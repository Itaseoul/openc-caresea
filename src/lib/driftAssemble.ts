// 드리프터 단건 ping → 궤적(DriftTrack) 조립 → 공개 스냅샷(GeoJSON) 생성.
// 기기는 좌표 한 점만 보내고(펌웨어 단순화), 조립·표시는 서버가 한다. 순수 함수라 단위 검증이 쉽다.

import { trackDistanceM } from "@/lib/geo";
import { kstIso, type DriftTrack, type DriftPoint } from "@/lib/observation";

export interface Ping {
  device_id: string;
  lat: number;
  lon: number;
  ts: string; // ISO8601. 수신 시 비어 있으면 라우트가 서버 시각으로 채운다.
  site_id?: string | null;
  batt?: number | null; // 배터리 전압(V, 선택) — 원격 소진 감시
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const GAP_MS = 2 * 3600 * 1000; // 같은 기기라도 2시간 이상 공백이면 새 배치(궤적)로 분리

// 단건 ping 경량 검증. ts는 선택(없거나 형식오류면 빈 문자열로 두고 라우트가 채움).
export function validatePing(rec: unknown): { ok: boolean; value?: Ping; errors: string[] } {
  const e: string[] = [];
  if (!rec || typeof rec !== "object") return { ok: false, errors: ["ping이 객체가 아님"] };
  const r = rec as Record<string, unknown>;
  const device_id = typeof r.device_id === "string" ? r.device_id : "";
  if (!device_id) e.push("device_id 필수(문자열)");
  const lat = typeof r.lat === "number" ? r.lat : NaN;
  const lon = typeof r.lon === "number" ? r.lon : NaN;
  if (!Number.isFinite(lat)) e.push("lat 필수(number)");
  if (!Number.isFinite(lon)) e.push("lon 필수(number)");
  let ts = typeof r.ts === "string" ? r.ts : "";
  if (ts && !ISO_RE.test(ts)) ts = ""; // 형식 오류면 버리고 서버 시각으로
  if (e.length) return { ok: false, errors: e };
  const site_id = typeof r.site_id === "string" ? r.site_id : null;
  const batt = typeof r.batt === "number" && Number.isFinite(r.batt) ? r.batt : null;
  return { ok: true, value: { device_id, lat, lon, ts, site_id, batt }, errors: [] };
}

// ping 배열을 기기별·시간순으로 묶어 DriftTrack 배열로 조립. 2시간 공백에서 궤적을 분리한다.
export function assembleTracks(pings: Ping[]): DriftTrack[] {
  const byDev = new Map<string, Ping[]>();
  for (const p of pings) {
    const a = byDev.get(p.device_id) || [];
    a.push(p);
    byDev.set(p.device_id, a);
  }
  const tracks: DriftTrack[] = [];
  byDev.forEach((arr, dev) => {
    arr.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)); // ★실시각(epoch) 정렬. 문자열 비교면 ...Z와 +09:00 혼재 시 오정렬
    let seg: Ping[] = [];
    const flush = () => {
      if (!seg.length) return;
      const points: DriftPoint[] = seg.map((p) => ({ ts: p.ts, lat: p.lat, lon: p.lon, batt: p.batt ?? null }));
      const first = seg[0];
      tracks.push({
        track_id: `${dev}-${first.ts.replace(/[^0-9]/g, "").slice(0, 14)}`,
        drifter_id: dev,
        site_id: first.site_id || "unknown",
        release_ts: first.ts,
        release_lat: first.lat,
        release_lon: first.lon,
        points,
        distance_m: points.length > 1 ? trackDistanceM(points) : 0,
        is_estimate: true,
      });
      seg = [];
    };
    for (const p of arr) {
      if (seg.length) {
        const dt = Date.parse(p.ts) - Date.parse(seg[seg.length - 1].ts);
        if (Number.isFinite(dt) && dt > GAP_MS) flush();
      }
      seg.push(p);
    }
    flush();
  });
  return tracks;
}

// device_id를 짧은 비가역 해시로. 공개 스냅샷 PII 최소화(역추적 방지, 데이터 윤리 경계).
function anonId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "d" + h.toString(36).slice(0, 7);
}

// 궤적들을 지도용 GeoJSON으로. 궤적당 LineString(경로) + 마지막 위치 Point. 기본 익명화.
export function tracksToLiveGeoJSON(
  tracks: DriftTrack[],
  opts: { anonymize?: boolean } = {}
): { type: "FeatureCollection"; generated_at: string; features: unknown[] } {
  const anon = opts.anonymize !== false;
  const features: unknown[] = [];
  for (const t of tracks) {
    const id = anon ? anonId(t.drifter_id || t.track_id) : t.drifter_id || t.track_id;
    const coords = t.points.map((p) => [p.lon, p.lat]);
    if (coords.length > 1) {
      features.push({
        type: "Feature",
        properties: { id, site_id: t.site_id, points: t.points.length, distance_m: t.distance_m ?? null, kind: "track" },
        geometry: { type: "LineString", coordinates: coords },
      });
    }
    const last = t.points[t.points.length - 1];
    if (last) {
      features.push({
        type: "Feature",
        properties: { id, site_id: t.site_id, ts: last.ts, batt: last.batt ?? null, kind: "last" },
        geometry: { type: "Point", coordinates: [last.lon, last.lat] },
      });
    }
  }
  return { type: "FeatureCollection", generated_at: kstIso(), features };
}
