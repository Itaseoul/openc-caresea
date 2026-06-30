// 좌표 거리·궤적 유틸 — 드리프터 궤적 적재와 예측 핫스팟 검증에서 공용으로 쓴다.
// 소하천~하구 규모라 구면 근사(Haversine)로 충분하다.

export interface LatLon {
  lat: number;
  lon: number;
}

// 두 좌표 간 대권 거리(m).
export function haversineM(a: LatLon, b: LatLon): number {
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
export function trackDistanceM(points: LatLon[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineM(points[i - 1], points[i]);
  return Math.round(d * 10) / 10;
}

// 궤적 종점(마지막 좌표) — 드리프터의 회수·정체 지점.
export function endpointOf(points: LatLon[]): LatLon | null {
  return points.length ? points[points.length - 1] : null;
}
