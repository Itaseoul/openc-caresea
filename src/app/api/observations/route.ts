import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  OBS_SITES,
  getObsSite,
  buildObservation,
  validateObservation,
  toJsonl,
  kstIso,
  type SeacutObservation,
} from "@/lib/observation";

// SEA:CUT 관측 레코드 적재 엔드포인트 (physical AI 0단계).
//  GET  /api/observations?site=gamjeon-confluence
//       → 실데이터(부산 강우, 선택적 HRFCO 수위)로 라이브 레코드 1건 조립.
//       wlObs=<HRFCO 관측소코드> 주면 그 코드의 실측 수위를 water_level_hrfco로 채움(낙동강 본류 대용 등).
//       format=jsonl 이면 text/plain JSONL로 반환.
//  POST /api/observations  (본문: 레코드 1건 또는 배열)
//       → 검증 후 JSONL 반환. OBS_SINK_PATH 설정 시 그 파일에 append(서버리스는 휘발성 주의).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

// 내부 API를 절대 URL로 호출(라우트 핸들러에서 상대경로 fetch 불가).
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
  const sp = req.nextUrl.searchParams;
  const siteId = sp.get("site") ?? OBS_SITES[0].site_id;
  const site = getObsSite(siteId);
  if (!site) {
    return NextResponse.json(
      { ok: false, reason: "UNKNOWN_SITE", sites: OBS_SITES.map((s) => s.site_id) },
      { status: 200 }
    );
  }
  const origin = req.nextUrl.origin;

  // 실데이터 1) 부산 강우(사상구/사하구 단위) — 공개 실값.
  let rainfall_mm: number | null = null;
  const sources: Record<string, string> = {};
  if (site.busanRainArea) {
    const rain = await fetchJson(origin, `/api/busan-rain?area=${encodeURIComponent(site.busanRainArea)}`);
    const item = rain?.items?.[0];
    rainfall_mm = num(item?.rainfall);
    sources.rain = rain?.ok ? `busan-rain:${site.busanRainArea}` : `busan-rain:${rain?.reason ?? "unavailable"}`;
  }

  // 실데이터 2) 수위 — 소하천 공공 부재. wlObs로 HRFCO 관측소(낙동강 본류 대용) 코드를 주면 실측을 채움.
  let water_level_hrfco: number | null = null;
  const wlObs = sp.get("wlObs");
  if (wlObs) {
    const wl = await fetchJson(origin, `/api/hrfco?type=waterlevel&obs=${encodeURIComponent(wlObs)}&tt=10M`);
    const rows: any[] = wl?.content ?? [];
    const latest = Array.isArray(rows) ? rows[rows.length - 1] : null;
    water_level_hrfco = num(latest?.wl ?? latest?.WL);
    sources.water = wl?.ok ? `hrfco:${wlObs}` : `hrfco:${wl?.reason ?? "unavailable"}`;
  } else {
    sources.water = "none(소하천 공공 부재 → 자체 IoT 필요)";
  }

  const record = buildObservation({ site, rainfall_mm, water_level_hrfco });

  if (sp.get("format") === "jsonl") {
    return new NextResponse(toJsonl([record]), {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.json({
    ok: true,
    site: { id: site.site_id, name: site.name, track: site.track, regime: site.regime },
    generatedAt: kstIso(),
    sources,
    note: "0단계 — 계측 모델 전. count_est·class_dist는 null(is_estimate=true). 강우는 실값, 수위는 wlObs로 주입.",
    record,
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
  const accepted: SeacutObservation[] = [];
  const rejected: { index: number; errors: string[] }[] = [];
  arr.forEach((rec, i) => {
    const v = validateObservation(rec);
    if (v.ok) accepted.push(rec as SeacutObservation);
    else rejected.push({ index: i, errors: v.errors });
  });

  const jsonl = toJsonl(accepted);

  // 선택적 적재: OBS_SINK_PATH 설정 시 JSONL append. (서버리스 파일시스템은 휘발성 — 영속 저장은 DB/Blob로.)
  let persisted: string | null = null;
  const sink = process.env.OBS_SINK_PATH;
  if (sink && accepted.length) {
    try {
      await fs.appendFile(sink, jsonl, "utf-8");
      persisted = sink;
    } catch (e) {
      persisted = `ERROR:${String(e)}`;
    }
  }

  return NextResponse.json(
    { ok: rejected.length === 0, acceptedCount: accepted.length, rejected, persisted, jsonl },
    { status: rejected.length ? 207 : 200 }
  );
}
