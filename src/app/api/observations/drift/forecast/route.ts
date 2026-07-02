import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// 표류 예측(OpenDrift/라그랑주) 궤적 서빙 — "예측-실측 폐루프"의 예측 축.
//  GET /api/observations/drift/forecast
//    → public/data/drift-forecast.geojson(오프라인 모델 산출물)을 GeoJSON으로 반환.
//      DRIFT_FORECAST_PATH 설정 시 그 파일을 우선 사용(스케줄 재생성 대응).
//    파생: 앙상블 평균 경로(mean_path) · 불확실성 범위(envelope) · 24h 도달 분포(endpoints).
//
// 실측 축은 POST/GET /api/observations/drift (DriftTrack). 지도(NakdongMap)가 둘을 겹쳐
// 예측 대비 실측을 표시 → 검증 데이터로 모델을 교정하는 폐루프.
//
// 산출 파이프라인: seacut_drifter/make_forecast_geojson.py (OpenDrift B모드 실forcing 전 표출본).
// OpenDrift 실forcing(해양수산부 해수유동·해상풍 격자, data.go.kr org 1192000)이 붙으면
// 같은 스키마로 이 파일만 교체된다.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const DEFAULT_REL = path.join("public", "data", "drift-forecast.geojson");

export async function GET() {
  const p = process.env.DRIFT_FORECAST_PATH || path.join(process.cwd(), DEFAULT_REL);
  let raw: string;
  try {
    raw = await fs.readFile(p, "utf-8");
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "NO_FORECAST",
        hint: "drift-forecast.geojson 없음 — seacut_drifter/make_forecast_geojson.py 실행 필요",
      },
      { status: 200 }
    );
  }

  let gj: any;
  try {
    gj = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_GEOJSON" }, { status: 200 });
  }

  const feats: any[] = Array.isArray(gj?.features) ? gj.features : [];
  const kinds = feats.reduce((m: Record<string, number>, f) => {
    const k = f?.properties?.kind ?? "unknown";
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});

  return NextResponse.json({
    ok: true,
    note: "표류 예측 궤적(앙상블) — 실측 DriftTrack과 겹쳐 예측·실측 폐루프의 예측 축",
    meta: gj.properties ?? null,
    summary: { features: feats.length, kinds },
    geojson: gj,
  });
}
