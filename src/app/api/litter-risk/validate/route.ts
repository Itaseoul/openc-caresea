import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  HOTSPOTS,
  predictAccumulationRisk,
  validateRiskAgainstDrift,
  type DriftEndpoint,
} from "@/lib/litterRisk";
import { endpointOf } from "@/lib/geo";
import { kstIso, type DriftTrack } from "@/lib/observation";

// litter-risk 예측 검증 — 드리프터 궤적 실측으로 예측 핫스팟을 약하게 검증(예측-실측 폐루프).
//  GET /api/litter-risk/validate?radius=500&topN=2
//   DRIFT_SINK_PATH의 드리프터 궤적 종점이 상위 예측 핫스팟 반경 내 도달했는지 리포트한다.
//   0단계: 건기 baseline 예측(트랩 기하 위주)과 비교. 강우 이벤트별 검증은 라벨 누적 후.
//
// 수거 중량 앵커(/api/observations/anchor)가 "얼마나"의 정답이라면, 드리프터 궤적은
// "어디로·어디서 멈췄나"의 정답이다. 이 엔드포인트는 후자로 핫스팟 예측을 점검한다.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readDrift(path: string): Promise<DriftTrack[]> {
  try {
    const txt = await fs.readFile(path, "utf-8");
    return txt
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as DriftTrack);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const sink = process.env.DRIFT_SINK_PATH;
  if (!sink) {
    return NextResponse.json(
      { ok: false, reason: "NO_SINK", hint: "DRIFT_SINK_PATH(드리프터 궤적 적재 경로) 미설정" },
      { status: 200 }
    );
  }
  const tracks = await readDrift(sink);
  if (!tracks.length) {
    return NextResponse.json(
      { ok: false, reason: "NO_TRACKS", hint: "적재된 드리프터 궤적 없음(POST /api/observations/drift)" },
      { status: 200 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const radius_m = Number(sp.get("radius")) || 500;
  const top_n = Number(sp.get("topN")) || 2;

  // 각 궤적의 종점(회수·정체 지점). 좌표 시계열이 비면 투하점으로 대체.
  const endpoints: DriftEndpoint[] = tracks.map((t) => {
    const ep = endpointOf(t.points ?? []) ?? { lat: t.release_lat, lon: t.release_lon };
    return {
      track_id: t.track_id,
      lat: ep.lat,
      lon: ep.lon,
      stranded: t.stranded ?? null,
      recovered_at_boom: t.recovered_at_boom ?? null,
    };
  });

  // 건기 baseline 예측(강우 신호 없음 → 트랩 기하 위주 순위).
  const predictions = predictAccumulationRisk(HOTSPOTS, {}, {});
  const report = validateRiskAgainstDrift(predictions, endpoints, { radius_m, top_n });

  return NextResponse.json({
    ok: true,
    generatedAt: kstIso(),
    predicted_order: predictions.map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, score: p.score, level: p.level })),
    validation: report,
  });
}
