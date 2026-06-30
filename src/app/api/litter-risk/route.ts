import { NextRequest, NextResponse } from "next/server";
import { HOTSPOTS, predictAccumulationRisk, hotspotToObservation, MODEL_VER, type RiskSignal } from "@/lib/litterRisk";
import { kstIso, toJsonl } from "@/lib/observation";

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

  // 실시간 조위(하구 핫스팟) — 수동 override(tideFactor=0~1) 우선, 없으면 KHOA(키 있을 때), 둘 다 없으면 정적.
  const tideByHotspot: Record<string, number> = {};
  const estuaryHotspots = HOTSPOTS.filter((h) => h.regime === "estuary");
  const manualTide = req.nextUrl.searchParams.get("tideFactor");
  let tideSource = "static(중립 0.5)";
  if (manualTide != null && Number.isFinite(Number(manualTide))) {
    const f = Math.max(0, Math.min(1, Number(manualTide)));
    estuaryHotspots.forEach((h) => (tideByHotspot[h.id] = f));
    tideSource = `manual(${f})`;
  } else if (process.env.KHOA_KEY && estuaryHotspots.length) {
    const date = kstIso().slice(0, 10).replace(/-/g, "");
    const t = await fetchJson(origin, `/api/khoa-tide?date=${date}`);
    if (t?.ok && t.factor != null) {
      estuaryHotspots.forEach((h) => (tideByHotspot[h.id] = t.factor));
      tideSource = `khoa(level ${t.level}, factor ${t.factor})`;
    } else {
      tideSource = `khoa:${t?.reason ?? "no-factor"}`;
    }
  }

  const predictions = predictAccumulationRisk(HOTSPOTS, signalsByArea, tideByHotspot);

  // 예측 로깅 연결: format=observations → 관측 레코드 JSONL, log=1 → /api/observations로 적재.
  const wantObs = req.nextUrl.searchParams.get("format") === "observations";
  const wantLog = req.nextUrl.searchParams.get("log") === "1";
  if (wantObs || wantLog) {
    const ts = kstIso();
    const records = predictions.map((pr) => {
      const prof = HOTSPOTS.find((h) => h.id === pr.id)!;
      return hotspotToObservation(prof, pr, signalsByArea[prof.busanRainArea] ?? { rainfall_mm: null }, ts);
    });
    if (wantObs && !wantLog) {
      return new NextResponse(toJsonl(records), {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    // log=1 → 내부적으로 /api/observations POST(검증+적재).
    let logged: any = null;
    try {
      const r = await fetch(new URL("/api/observations", origin), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(records),
        cache: "no-store",
      });
      logged = await r.json();
    } catch (e) {
      logged = { ok: false, error: String(e) };
    }
    return NextResponse.json({
      ok: logged?.ok ?? true,
      generatedAt: ts,
      model: MODEL_VER,
      logged: {
        acceptedCount: logged?.acceptedCount,
        rejected: logged?.rejected,
        persisted: logged?.persisted,
      },
      count: records.length,
      observations: records,
    });
  }

  return NextResponse.json({
    ok: true,
    generatedAt: kstIso(),
    model: `${MODEL_VER} (결정형 0단계 — 라벨 누적 후 학습형으로 교정)`,
    method: "퇴적 ≈ 발생원 × 트랩(합류부·복개출구·조석) × (정체 + 강우 first-flush 펄스)",
    signals: areas.map((a) => ({ area: a, ...signalsByArea[a], source: rainSources[a] })),
    tide: tideSource,
    count: predictions.length,
    hotspots: predictions,
  });
}
