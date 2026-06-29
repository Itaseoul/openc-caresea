import { NextRequest, NextResponse } from "next/server";
import { HOTSPOTS, predictAccumulationRisk, type RiskSignal } from "@/lib/litterRisk";
import { kstIso } from "@/lib/observation";

// 하류 퇴적 쓰레기 위험 예측 — "지금 이 시간" 핫스팟 순위.
//  GET /api/litter-risk
//   실데이터: 부산 강우(/api/busan-rain?area=) 구 단위 실값을 핫스팟별로 매핑해 위험 점수화.
//   응답: 위험 내림차순 핫스팟 + 사용된 강우 신호 + 생성 시각(KST).
//
// 주의: 라벨(실 퇴적량) 부재로 학습 모델이 아니라 물리 휴리스틱이다(is_estimate=true).
//   예측을 관측 레코드로 적재하고 수거 중량 앵커가 쌓이면 학습형으로 교정한다. (litterRisk.ts 참조)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

async function fetchJson(origin: string, path: string): Promise<any | null> {
  try {
    const r = await fetch(new URL(path, origin), { cache: "no-store" });
    return await r.json();
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  // 핫스팟이 쓰는 구(area) 집합만 강우 조회.
  const areas = Array.from(new Set(HOTSPOTS.map((h) => h.busanRainArea)));
  const signalsByArea: Record<string, RiskSignal> = {};
  const rainSources: Record<string, string> = {};
  await Promise.all(
    areas.map(async (area) => {
      const rain = await fetchJson(origin, `/api/busan-rain?area=${encodeURIComponent(area)}`);
      const item = rain?.items?.[0];
      signalsByArea[area] = {
        rainfall_mm: num(item?.rainfall),
        rain_observed_at: item?.observedAt ?? null,
      };
      rainSources[area] = rain?.ok ? "busan-rain(실값)" : `busan-rain:${rain?.reason ?? "unavailable"}`;
    })
  );

  const predictions = predictAccumulationRisk(HOTSPOTS, signalsByArea);

  return NextResponse.json({
    ok: true,
    generatedAt: kstIso(),
    model: "physical-heuristic-v0 (결정형 0단계 — 라벨 누적 후 학습형으로 교정)",
    method: "퇴적 ≈ 발생원 × 트랩(합류부·복개출구·조석) × (정체 + 강우 first-flush 펄스)",
    signals: areas.map((a) => ({ area: a, ...signalsByArea[a], source: rainSources[a] })),
    count: predictions.length,
    hotspots: predictions,
  });
}
