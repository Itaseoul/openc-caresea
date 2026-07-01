import { NextRequest, NextResponse } from "next/server";
import { CCTV_REGIONS, DEFAULT_REGION_KEY, getRegion, isWaterCam } from "@/lib/cctvRegions";

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

  // 도로별 조회는 서로 독립 → allSettled 로 한쪽(ex 또는 its)이 실패해도 나머지는 반환.
  // (Vercel→ITS :9443 은 간헐 타임아웃이 있어 Promise.all 이면 한 번의 실패가 전체를 죽였음)
  const settled = await Promise.allSettled(
    roads.map(async (type) => {
      const r = await fetch(build(type), { next: { revalidate: 120 } });
      const text = await r.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        return { type, error: "NON_JSON", raw: text.slice(0, 200) };
      }
      const data: any[] = json?.response?.data ?? [];
      return { type, data };
    })
  );

  const results = settled.map((s, i) =>
    s.status === "fulfilled" ? s.value : { type: roads[i], error: "FETCH_ERROR", message: String(s.reason) }
  );

  const content = results.flatMap((res: any) =>
    (res.data ?? []).map((d: any) => ({
      cctvname: d.cctvname,
      coordx: Number(d.coordx),
      coordy: Number(d.coordy),
      cctvformat: d.cctvformat, // HLS 등
      cctvurl: d.cctvurl, // 원본 스트림 주소(http) — 참고용
      // 실제 재생용: 동일출처 프록시. 원본이 http라 https 라이브에선 이걸 써야 혼합콘텐츠 차단을 피함.
      stream: d.cctvurl ? `/api/cctv/stream?u=${encodeURIComponent(d.cctvurl)}` : null,
      road: res.type, // ex | its
      water: isWaterCam(d.cctvname), // 하천/교량 등 물길 화면 여부
    }))
  );

  // 하천(물길) 카메라를 앞으로 — 히어로/보드가 앞에서부터 쓰면 바로 하천 화면이 나온다.
  content.sort((a: any, b: any) => Number(b.water) - Number(a.water));

  const errors = results.filter((r: any) => r.error);
  // 전부 실패했을 때만 ok:false. 일부라도 성공하면 그 결과 + errors 로 응답.
  return NextResponse.json({
    ok: content.length > 0 || errors.length < results.length,
    count: content.length,
    region: { key: region.key, label: region.label, river: region.river },
    regions: CCTV_REGIONS.map((r) => ({ key: r.key, label: r.label, river: r.river })),
    bbox: { minX, maxX, minY, maxY },
    ...(errors.length ? { errors } : {}),
    content,
  });
}
