import { NextRequest, NextResponse } from "next/server";
import { CCTV_REGIONS, DEFAULT_REGION_KEY, getRegion, isWaterCam } from "@/lib/cctvRegions";
import cctvSnapshot from "@/lib/cctvSnapshot.json";

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
  const key = process.env.ITS_KEY;
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        reason: "NO_KEY",
        hint: ".env.local 에 ITS_KEY 설정. its.go.kr 회원가입 → 마이페이지 → 인증키 신청(무료).",
        regions: CCTV_REGIONS.map((r) => ({ key: r.key, label: r.label, river: r.river })),
      },
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

  const build = (type: string) =>
    `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${encodeURIComponent(key)}` +
    `&type=${type}&cctvType=${cctvType}` +
    `&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;

  const toItem = (d: any, roadType: string) => ({
    cctvname: d.cctvname,
    coordx: Number(d.coordx),
    coordy: Number(d.coordy),
    cctvformat: d.cctvformat ?? "HLS",
    cctvurl: d.cctvurl, // 원본 스트림 주소(http) — 참고용
    // 실제 재생용: 동일출처 프록시. 원본이 http라 https 라이브에선 이걸 써야 혼합콘텐츠 차단을 피함.
    stream: d.cctvurl ? `/api/cctv/stream?u=${encodeURIComponent(d.cctvurl)}` : null,
    road: roadType,
    water: isWaterCam(d.cctvname), // 하천/교량 등 물길 화면 여부
  });

  // 도로별 조회는 서로 독립 → allSettled + 재시도로 한쪽 실패해도 나머지는 반환.
  const settled = await Promise.allSettled(
    roads.map(async (type) => ({ type, data: await itsFetch(build(type)) }))
  );
  const results = settled.map((s, i) =>
    s.status === "fulfilled" ? s.value : { type: roads[i], error: "FETCH_ERROR", message: String(s.reason) }
  );

  let content = results.flatMap((res: any) => (res.data ?? []).map((d: any) => toItem(d, res.type)));
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
