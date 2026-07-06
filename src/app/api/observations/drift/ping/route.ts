import { NextRequest, NextResponse } from "next/server";
import { validatePing, assembleTracks, tracksToLiveGeoJSON, type Ping } from "@/lib/driftAssemble";
import { driftStore } from "@/lib/driftStore";
import { kstIso } from "@/lib/observation";

// 드리프터 단건 ping 수신 → 원본 누적(R2) → 궤적 조립 → 공개 스냅샷(live.geojson) bake.
//  기기는 좌표 한 점만 보내고(펌웨어 단순화), 궤적 조립·표시는 서버가 한다.
//  POST /api/observations/drift/ping  본문: {device_id, lat, lon, ts?} 단건 또는 배열.
//    ts가 없으면 서버 수신 시각(KST)으로 채운다. 완성 궤적을 통째로 올리는 경로는
//    상위 /api/observations/drift(DriftTrack) 쪽이고, 이 경로는 스트리밍 단건 전용이다.
//  GET  → 공개 스냅샷(live.geojson) 반환(없으면 즉석 조립).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_JSON" }, { status: 400 });
  }

  const arr = Array.isArray(body) ? body : [body];
  const accepted: Ping[] = [];
  const rejected: { index: number; errors: string[] }[] = [];

  arr.forEach((rec, i) => {
    const v = validatePing(rec);
    if (!v.ok || !v.value) {
      rejected.push({ index: i, errors: v.errors });
      return;
    }
    accepted.push({ ...v.value, ts: v.value.ts || kstIso() });
  });

  if (accepted.length) await driftStore.appendPings(accepted);

  // 누적 ping으로 궤적 재조립 후 공개 스냅샷 갱신.
  const pings = (await driftStore.readPings()) as Ping[];
  const tracks = assembleTracks(pings);
  const live = tracksToLiveGeoJSON(tracks, { anonymize: true });
  await driftStore.writeLive(live);

  return NextResponse.json(
    {
      ok: rejected.length === 0,
      storage: driftStore.storage(),
      acceptedCount: accepted.length,
      rejected,
      receivedAt: kstIso(),
      tracks: tracks.length,
      features: live.features.length,
    },
    { status: rejected.length ? 207 : 200 }
  );
}

export async function GET() {
  let live = await driftStore.readLive();
  if (!live) {
    const pings = (await driftStore.readPings()) as Ping[];
    live = tracksToLiveGeoJSON(assembleTracks(pings), { anonymize: true });
  }
  return NextResponse.json(live, {
    headers: { "cache-control": "public, max-age=30" },
  });
}
