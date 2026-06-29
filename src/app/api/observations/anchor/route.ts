import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { kstIso, type SeacutObservation } from "@/lib/observation";

// 수거 중량(정답) 앵커 결합 — 학습 루프 2단계.
//  POST /api/observations/anchor  { site_id, collected_mass_kg, ts?, window_hours?, all? }
//    같은 사이트의 최근 예측 레코드(risk_score 있음, 미라벨)에 collected_mass_kg를 붙여
//    (예측, 정답) 학습쌍을 완성한다. 기본은 윈도(기본 24h) 내 가장 최근 1건, all=true면 전부.
//  GET /api/observations/anchor → 라벨 결합된 학습쌍(현재까지의 학습셋) 조회.
//
// 저장은 OBS_SINK_PATH(JSONL). 서버리스 파일시스템은 휘발성이라 운영 영속은 DB/Blob로 둔다.
// 현장 수거 중량은 의뢰인이 채우는 실데이터이며, 이 엔드포인트는 그 입력·결합 메커니즘이다.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readSink(path: string): Promise<SeacutObservation[]> {
  try {
    const txt = await fs.readFile(path, "utf-8");
    return txt
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as SeacutObservation);
  } catch {
    return [];
  }
}

async function writeSink(path: string, recs: SeacutObservation[]): Promise<void> {
  await fs.writeFile(path, recs.map((r) => JSON.stringify(r)).join("\n") + (recs.length ? "\n" : ""), "utf-8");
}

export async function GET() {
  const sink = process.env.OBS_SINK_PATH;
  if (!sink) {
    return NextResponse.json(
      { ok: false, reason: "NO_SINK", hint: "OBS_SINK_PATH(영속 적재 경로) 미설정" },
      { status: 200 }
    );
  }
  const recs = await readSink(sink);
  const labeled = recs.filter((r) => r.collected_mass_kg != null && r.risk_score != null);
  return NextResponse.json({
    ok: true,
    total: recs.length,
    pairs: labeled.length,
    note: "라벨 결합된 (예측 risk_score, 정답 collected_mass_kg) 학습쌍 — 누적되면 학습형으로 교정",
    training: labeled.map((r) => ({
      site_id: r.site_id,
      ts: r.ts,
      rainfall_mm: r.rainfall_mm,
      risk_score: r.risk_score,
      risk_level: r.risk_level,
      collected_mass_kg: r.collected_mass_kg,
      anchored_at: r.anchored_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const sink = process.env.OBS_SINK_PATH;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_JSON" }, { status: 400 });
  }

  const site_id = body?.site_id;
  const mass = body?.collected_mass_kg;
  if (typeof site_id !== "string" || !site_id || typeof mass !== "number" || !Number.isFinite(mass)) {
    return NextResponse.json(
      { ok: false, reason: "BAD_INPUT", hint: "{ site_id: string, collected_mass_kg: number, ts?, window_hours?, all? }" },
      { status: 400 }
    );
  }
  if (!sink) {
    return NextResponse.json(
      { ok: false, reason: "NO_SINK", hint: "OBS_SINK_PATH(영속 적재 경로) 설정 필요" },
      { status: 200 }
    );
  }

  const anchorMs = body?.ts ? Date.parse(String(body.ts)) : Date.now();
  const winMs = (typeof body?.window_hours === "number" ? body.window_hours : 24) * 3.6e6;
  const all = body?.all === true || body?.all === "1";
  const at = kstIso();

  const recs = await readSink(sink);

  // 후보: 같은 사이트, 예측 레코드(risk_score 있음), 미라벨, 윈도 내(앵커 시각 이전).
  const candidates: number[] = [];
  recs.forEach((r, i) => {
    if (r.site_id !== site_id) return;
    if (r.risk_score == null) return;
    if (r.collected_mass_kg != null) return;
    const t = Date.parse(r.ts);
    if (!Number.isFinite(t)) return;
    if (t <= anchorMs && anchorMs - t <= winMs) candidates.push(i);
  });

  if (!candidates.length) {
    return NextResponse.json(
      { ok: false, reason: "MATCH_NONE", hint: "윈도 내 미라벨 예측 레코드 없음(site_id·window_hours·ts 확인)" },
      { status: 200 }
    );
  }

  // 기본은 가장 최근 1건, all이면 윈도 내 전부.
  const targets = all
    ? candidates
    : [candidates.reduce((best, i) => (Date.parse(recs[i].ts) > Date.parse(recs[best].ts) ? i : best), candidates[0])];

  const paired = targets.map((i) => {
    recs[i] = { ...recs[i], collected_mass_kg: mass, anchored_at: at };
    return recs[i];
  });

  await writeSink(sink, recs);

  return NextResponse.json({
    ok: true,
    anchoredAt: at,
    matched: paired.length,
    pairs: paired.map((r) => ({
      site_id: r.site_id,
      ts: r.ts,
      risk_score: r.risk_score,
      rainfall_mm: r.rainfall_mm,
      collected_mass_kg: r.collected_mass_kg,
    })),
  });
}
