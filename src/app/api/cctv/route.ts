import { NextRequest, NextResponse } from "next/server";
import { CCTV_REGIONS, DEFAULT_REGION_KEY, getRegion, isWaterCam } from "@/lib/cctvRegions";
import cctvSnapshot from "@/lib/cctvSnapshot.json";
import { SEOGWIPO_CAMS } from "@/lib/seogwipoRivers";

// Vercel→ITS(:9443) 는 간헐적으로 연결 자체가 실패(TypeError: fetch failed, 대량요청 시 IP 스로틀 추정).
// 짧은 재시도로 흡수하고, 그래도 비면 커밋된 스냅샷으로 폴백해 히어로가 절대 비지 않게 한다.
async function itsFetch(url: string, tries = 3): Promise<any[]> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 7000);
      try {
        const r = await fetch(url, { next: { revalidate: 120 }, signal: ctl.signal });
        const text = await r.text();
        const json = JSON.parse(text);
        return json?.response?.data ?? [];
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((res) => setTimeout(res, 200 + i * 300));
    }
  }
  throw lastErr ?? new Error("its fetch failed");
}

// 국가교통정보센터(ITS) CCTV OpenAPI 프록시 (openapi.its.go.kr)
// 강·하천·교량을 지나는 도로 CCTV의 실시간 HLS(m3u8) 스트림 주소를 좌표 범위로 조회한다.
// ★ 별도 인증키 필요: https://www.its.go.kr → 회원가입 → 마이페이지 → 인증키 신청 (무료, 즉시).
//   발급 후 .env.local 에 ITS_KEY=... 추가.
// 파라미터:
//   bbox: minX,maxX,minY,maxY (경도/위도). 미지정 시 낙동강 하구·을숙도 일대 기본값.
//   cctvType: 1=실시간 스트리밍(HLS), 2=동영상파일, 3=정지영상 (기본 1)
//   road: ex(고속도로) | its(국도) | all(둘 다 병합, 기본)
// 응답 content[*]: { cctvname, coordx(경도), coordy(위도), cctvformat, cctvurl(스트림), road }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 한국 정부 API(openapi.its.go.kr)가 해외 리전 egress를 막는 정황 → 서울 리전에서 호출.
export const preferredRegion = "icn1";

export async function GET(req: NextRequest) {
  const regionsMeta = CCTV_REGIONS.map((r) => ({ key: r.key, label: r.label, river: r.river }));
  const reqRegion = getRegion(req.nextUrl.searchParams.get("region"));

  // ★고정 목록 지역(서귀포 하천 등)은 ITS 키 없이도 동작 — 지자체 공개 HLS를 프록시로 재생.
  if (reqRegion?.static) {
    const content = SEOGWIPO_CAMS.map((d) => ({
      cctvname: d.cctvname,
      coordx: d.coordx,
      coordy: d.coordy,
      cctvformat: "HLS",
      cctvurl: d.cctvurl,
      stream: `/api/cctv/stream?u=${encodeURIComponent(d.cctvurl)}`,
      thumb: d.thumb,
      road: "river",
      water: true,
    }));
    return NextResponse.json({
      ok: true,
      count: content.length,
      source: "gov-open",
      region: { key: reqRegion.key, label: reqRegion.label, river: reqRegion.river },
      regions: regionsMeta,
      note: "서귀포시가 공개하는 하천 재난 CCTV(HLS) — 지자체 하천 영상 개방 실증 사례",
      content,
    });
  }

  // ★제주시 하천 감시 CCTV — data.go.kr riverCctvService(KMA_SERVICE_KEY 공용). 62개 하천 HLS.
  if (reqRegion?.dataGov === "jeju") {
    const gkey = process.env.KMA_SERVICE_KEY;
    try {
      const url =
        `https://apis.data.go.kr/6510000/riverCctvService/getRiverCctvList` +
        `?serviceKey=${encodeURIComponent(gkey ?? "")}&pageNo=1&numOfRows=100&dataType=json`;
      const r = await fetch(url, { next: { revalidate: 600 } });
      const j = await r.json();
      const raw = j?.response?.body?.items?.item ?? [];
      const list = Array.isArray(raw) ? raw : [raw];
      const content = list
        .filter((it: any) => it?.useYn === "Y" && it?.cctvUrl)
        .map((it: any) => ({
          cctvname: it.spotNm,
          coordx: Number(it.loCrdnt),
          coordy: Number(it.laCrdnt),
          cctvformat: "HLS",
          cctvurl: it.cctvUrl,
          stream: `/api/cctv/stream?u=${encodeURIComponent(it.cctvUrl)}`,
          thumb: null,
          road: "river",
          water: true,
        }));
      return NextResponse.json({
        ok: content.length > 0,
        count: content.length,
        source: "gov-open",
        region: { key: reqRegion.key, label: reqRegion.label, river: reqRegion.river },
        regions: regionsMeta,
        note: "제주시 하천 감시 CCTV(data.go.kr riverCctvService) — 공공 API로 개방된 실시간 하천 영상",
        content,
      });
    } catch (e) {
      return NextResponse.json(
        { ok: false, reason: "JEJU_FETCH_ERROR", message: String(e), region: { key: reqRegion.key, label: reqRegion.label, river: reqRegion.river }, regions: regionsMeta, content: [] },
        { status: 200 }
      );
    }
  }

  const key = process.env.ITS_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, reason: "NO_KEY", hint: ".env.local 에 ITS_KEY 설정.", regions: regionsMeta },
      { status: 200 }
    );
  }

  const sp = req.nextUrl.searchParams;
  // 지역 프리셋(대상 하천 하류) 우선 → 없으면 명시 bbox → 없으면 기본(부산 낙동강 하류)
  const region = getRegion(sp.get("region")) ?? getRegion(DEFAULT_REGION_KEY)!;
  const DEF = region.bbox;
  const minX = sp.get("minX") ?? String(DEF.minX);
  const maxX = sp.get("maxX") ?? String(DEF.maxX);
  const minY = sp.get("minY") ?? String(DEF.minY);
  const maxY = sp.get("maxY") ?? String(DEF.maxY);
  const cctvType = sp.get("cctvType") ?? "1"; // 1=HLS 실시간
  const road = sp.get("road") ?? "all"; // ex | its | all

  const roads = road === "all" ? ["ex", "its"] : [road];

  const build = (type: string, ctype: string) =>
    `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${encodeURIComponent(key)}` +
    `&type=${type}&cctvType=${ctype}` +
    `&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;

  const toItem = (d: any, roadType: string, thumb?: string | null) => ({
    cctvname: d.cctvname,
    coordx: Number(d.coordx),
    coordy: Number(d.coordy),
    cctvformat: d.cctvformat ?? "HLS",
    cctvurl: d.cctvurl, // 원본 스트림 주소(http) — 참고용
    // 실제 재생용: 동일출처 프록시. 원본이 http라 https 라이브에선 이걸 써야 혼합콘텐츠 차단을 피함.
    stream: d.cctvurl ? `/api/cctv/stream?u=${encodeURIComponent(d.cctvurl)}` : null,
    // 정지영상(썸네일·포스터). cctvType=3의 cctvurl2 는 https(:8091)라 프록시 없이 직접 사용 가능.
    thumb: thumb ?? d.thumb ?? null,
    road: roadType,
    water: isWaterCam(d.cctvname), // 하천/교량 등 물길 화면 여부
  });

  // type=1(HLS 스트림) + type=3(정지영상 https) 를 함께 조회해 카메라별로 썸네일을 붙인다.
  const settled = await Promise.allSettled(
    roads.map(async (type) => {
      const [stream, still] = await Promise.all([
        itsFetch(build(type, cctvType)),
        itsFetch(build(type, "3")).catch(() => [] as any[]), // 정지영상은 없어도 무방
      ]);
      // 정지영상 https 주소(cctvurl2)를 cctvname 으로 매핑
      const thumbByName = new Map<string, string>();
      for (const s of still) if (s?.cctvname && s?.cctvurl2) thumbByName.set(s.cctvname, s.cctvurl2);
      return { type, data: stream, thumbByName };
    })
  );
  const results = settled.map((s, i) =>
    s.status === "fulfilled" ? s.value : { type: roads[i], error: "FETCH_ERROR", message: String(s.reason), thumbByName: new Map() }
  );

  let content = results.flatMap((res: any) =>
    (res.data ?? []).map((d: any) => toItem(d, res.type, res.thumbByName?.get(d.cctvname)))
  );
  const errors = results.filter((r: any) => r.error);

  // 라이브가 전부 실패해 비었으면 커밋된 스냅샷으로 폴백(히어로가 절대 비지 않게).
  let source = "live";
  if (content.length === 0) {
    const snap: any[] = (cctvSnapshot as any)[region.key] ?? [];
    if (snap.length) {
      content = snap.map((d) => toItem(d, d.road ?? "snapshot"));
      source = "snapshot";
    }
  }

  // 하천(물길) 카메라를 앞으로 — 히어로/보드가 앞에서부터 쓰면 바로 하천 화면이 나온다.
  content.sort((a: any, b: any) => Number(b.water) - Number(a.water));

  return NextResponse.json({
    ok: content.length > 0,
    count: content.length,
    source,
    region: { key: region.key, label: region.label, river: region.river },
    regions: CCTV_REGIONS.map((r) => ({ key: r.key, label: r.label, river: r.river })),
    bbox: { minX, maxX, minY, maxY },
    ...(errors.length ? { errors } : {}),
    content,
  });
}
