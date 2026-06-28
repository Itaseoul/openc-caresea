import { NextRequest, NextResponse } from "next/server";
import { DEMO_SEOUL } from "@/lib/demo";

// 서울 열린데이터광장 「서울시 하천 수위 현황」 OA-1167 / ListRiverStageService 프록시
// 실측(2026-06-28): ACAO:* (브라우저 직접도 가능) · 10분 갱신 · 전체 21개소 · 홍제천 실재
// 핵심 필드: RVR_NM(하천명) WATG_NM(수위계명) RLTM_RVR_WATL_CNT(실시간수위m)
//           CNTRL_WATL(통제수위m, ★0.0=미설정 주의) PLAN_FLDE(계획홍수위) DTRSM_DATA_CLCT_TM(수집시각)
// 라이선스: 공공누리 2유형(출처표시+상업적 이용금지) → 표기 필요.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const river = req.nextUrl.searchParams.get("river"); // 예: 홍제천
  const key = process.env.SEOUL_KEY;
  if (!key) {
    // 키 발급 전: 데모 데이터로 UI 렌더
    return NextResponse.json({ ok: true, demo: true, total: DEMO_SEOUL.length, items: DEMO_SEOUL });
  }
  const url = `http://openapi.seoul.go.kr:8088/${key}/json/ListRiverStageService/1/25/`;

  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    const json: any = await r.json();
    const rows: any[] = json?.ListRiverStageService?.row ?? [];
    const filtered = river ? rows.filter((x) => x.RVR_NM === river) : rows;
    const items = filtered.map((x) => ({
      river: x.RVR_NM,
      station: x.WATG_NM,
      gu: x.GU_OFC_NM,
      level: num(x.RLTM_RVR_WATL_CNT),
      controlLevel: num(x.CNTRL_WATL), // 0이면 미설정
      planFloodLevel: num(x.PLAN_FLDE),
      collectedAt: x.DTRSM_DATA_CLCT_TM,
    }));
    return NextResponse.json({
      ok: true,
      usingSampleKey: !process.env.SEOUL_KEY,
      total: rows.length,
      items,
      license: "공공누리 제2유형(출처표시+상업적 이용금지)",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "FETCH_ERROR", message: String(e) }, { status: 200 });
  }
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
