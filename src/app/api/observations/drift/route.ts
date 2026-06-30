import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  validateDriftTrack,
  toJsonl,
  kstIso,
  type DriftTrack,
  type DriftPoint,
} from "@/lib/observation";

// GPS 드리프터 궤적 적재 — 표류 예측의 "어디로·어떻게" 정답 라벨(학습 루프 보강).
//  POST /api/observations/drift  (본문: 궤적 1건 또는 배열, DriftTrack 스키마)
//    → validateDriftTrack 검증 후 distance_m(미지정 시 Haversine 자동계산) 보강, JSONL 반환.
//      DRIFT_SINK_PATH 설정 시 그 파일에 append(서버리스 파일시스템은 휘발성 주의 — 영속은 DB/Blob).
//  GET /api/observations/drift → 적재된 궤적 요약 조회(track_id·거리·고착·붐회수·발생원 지표).
//
// 근거·선례: docs/GPS-드리프터-표류실측-심층스터디.md.
// 소하천은 고정 붐이 드리프터 종점이라 회수·재사용 전제(recovered_at_boom).
// 관측 레코드(SeacutObservation)와 스키마가 달라 별도 sink로 분리한다.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const SINK_ENV = "DRIFT_SINK_PATH";

// 두 좌표 간 대권 거리(m). 소하천 규모라 구면 근사로 충분.
function haversineM(a: DriftPoint, b: DriftPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 궤적 누적 이동 거리(m) — 드리프터의 핵심 산출.
function trackDistanceM(points: DriftPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineM(points[i - 1], points[i]);
  return Math.round(d * 10) / 10;
}

async function readSink(path: string): Promise<DriftTrack[]> {
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

export async function GET() {
  const sink = process.env[SINK_ENV];
  if (!sink) {
    return NextResponse.json(
      { ok: false, reason: "NO_SINK", hint: `${SINK_ENV}(드리프터 궤적 적재 경로) 미설정` },
      { status: 200 }
    );
  }
  const tracks = await readSink(sink);
  return NextResponse.json({
    ok: true,
    total: tracks.length,
    note: "적재된 드리프터 궤적 요약 — litter-risk 표류 예측의 실측 라벨(예측-실측 폐루프)",
    tracks: tracks.map((t) => ({
      track_id: t.track_id,
      site_id: t.site_id,
      release_ts: t.release_ts,
      recovered_ts: t.recovered_ts ?? null,
      recovered_at_boom: t.recovered_at_boom ?? null,
      points: t.points?.length ?? 0,
      distance_m: t.distance_m ?? null,
      stranded: t.stranded ?? null,
      vsc_current: t.vsc_current ?? null,
      vsc_wind: t.vsc_wind ?? null,
      wind_factor_alpha: t.wind_factor_alpha ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_JSON" }, { status: 400 });
  }
  const arr = Array.isArray(body) ? body : [body];
  const accepted: DriftTrack[] = [];
  const rejected: { index: number; errors: string[] }[] = [];

  arr.forEach((rec, i) => {
    const v = validateDriftTrack(rec);
    if (!v.ok) {
      rejected.push({ index: i, errors: v.errors });
      return;
    }
    const t = rec as DriftTrack;
    // 거리 미지정 시 좌표 시계열에서 자동 보강(점이 2개 이상일 때).
    const distance_m = t.distance_m ?? (t.points.length > 1 ? trackDistanceM(t.points) : 0);
    accepted.push({ ...t, distance_m });
  });

  const jsonl = toJsonl(accepted);

  // 선택적 적재: DRIFT_SINK_PATH 설정 시 JSONL append.
  let persisted: string | null = null;
  const sink = process.env[SINK_ENV];
  if (sink && accepted.length) {
    try {
      await fs.appendFile(sink, jsonl, "utf-8");
      persisted = sink;
    } catch (e) {
      persisted = `ERROR:${String(e)}`;
    }
  }

  return NextResponse.json(
    {
      ok: rejected.length === 0,
      acceptedCount: accepted.length,
      receivedAt: kstIso(),
      rejected,
      persisted,
      tracks: accepted.map((t) => ({
        track_id: t.track_id,
        site_id: t.site_id,
        distance_m: t.distance_m,
        points: t.points.length,
        recovered_at_boom: t.recovered_at_boom ?? null,
      })),
      jsonl,
    },
    { status: rejected.length ? 207 : 200 }
  );
}
