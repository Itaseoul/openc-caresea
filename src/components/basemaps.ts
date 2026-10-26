// 공용 베이스맵. CARTO 타일이 키를 요구하게 되어(2026-10 「API KEY REQUIRED」 워터마크) 키 없는 OSM 표준 타일을
// 채도를 낮춰(.tiles-muted) 심플 라이트로 쓴다. 하천망과 데이터 레이어가 위에서 또렷하게 보이도록 한 선택.
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function simpleLight(L: any) {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: OSM_ATTR,
    className: "tiles-muted",
  });
}

export function osmStandard(L: any) {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: OSM_ATTR });
}

// 위성 위 지명 라벨(키 없음, Esri 참조 레이어)
export function placeLabels(L: any, opts: Record<string, unknown> = {}) {
  return L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Labels &copy; Esri", ...opts }
  );
}
