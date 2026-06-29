// SEA:CUT 관측 레코드 표준 — physical AI 0단계 구현체.
// 문서(docs/physical-ai-데이터-스키마.md)의 JSON Schema(draft-07)를 TS 계약으로 옮기고,
// 실데이터(부산 강우/HRFCO 수위)로 레코드를 조립하는 빌더와 JSONL 직렬화·경량 검증을 둔다.
// 전문가 패널 결론대로 "액추에이터보다 로깅 먼저" — 계측 모델 전이라도 스키마·타임싱크부터 고정한다.
//
// 검토 보강(2026-06-30):
//  · 감전천은 학장천 지류(엄궁동 합류→낙동강) → 좌표를 합류부 기준으로 정렬(상류 35.157 폐기).
//  · 소하천은 공공 수위 부재 → water_level_self(자체 IoT)·water_level_source 추가.
//  · 2트랙 정합 — 감전천=데이터(붐 없음), 괴정천=붐 물리 실증(hasBoom).

export type RiverGrade = "지방하천" | "소하천" | "기타하천" | "국가하천";
export type Regime = "estuary" | "urban_stream"; // 기수·조석 / 도시 소하천
export type Illum = "day" | "night" | "ir";
export type Track = "data" | "boom" | "obs" | "estuary";
export type WaterLevelSource = "hrfco" | "self_iot" | "none";

export interface ClassDist {
  plastic?: number;
  styrofoam?: number;
  wood?: number;
  other?: number;
  confidence?: number;
}

// 관측 레코드 하나 = 어디서(where) 언제(when) 무엇을(what) + 수거 중량(정답 앵커).
export interface SeacutObservation {
  // 공간
  site_id: string;
  boom_id?: string | null;
  lat?: number | null;
  lon?: number | null;
  river_code?: string | null;
  river_grade?: RiverGrade | null;
  hrfco_obs_code?: string | null; // 한강홍수통제소 수위관측소 코드(소하천은 부재 가능)
  regime: Regime;
  camera_calib?: string | null; // 정사보정 파라미터 셋 참조 ID
  // 시간
  ts: string; // ISO8601 (+09:00)
  segment_sec?: number | null; // 집계 구간 길이(초)
  rain_event_id?: string | null;
  // 지표(추정치는 is_estimate=true, 가능하면 신뢰구간)
  count_est?: number | null; // 통과 부유물 개수 추정(센서스 아님)
  count_ci?: [number, number] | null; // [하한, 상한]
  area_ratio?: number | null; // 수면 점유 면적 비율 0~1
  flux_est?: number | null;
  surface_velocity_est?: number | null; // 표면영상유속계(m/s)
  class_dist?: ClassDist | null;
  water_level_hrfco?: number | null; // 공공 실측 수위(m)
  water_level_self?: number | null; // 자체 IoT 수위(m) — 소하천 공공 부재 시
  water_level_source?: WaterLevelSource | null; // 수위 출처 구분
  water_level_diff?: number | null; // 상하류 수위차 Δh, 막힘 지표(m)
  boom_tension?: number | null; // 계류 장력(N/kgf), 누적 질량·항력 대용
  boom_tilt?: number | null; // 부체 경사·흘수(deg)
  rainfall_mm?: number | null; // 강우 실값(부산 강우 API 등) — 0단계 실데이터 컨텍스트
  weather?: string | null;
  illum?: Illum | null;
  // 앵커·품질
  collected_mass_kg?: number | null; // 수거 실측 중량(영상지표 보정 앵커)
  model_ver?: string | null;
  confidence?: number | null;
  deid_flag: boolean; // 얼굴·번호판 비식별 처리 여부
  is_estimate: boolean; // 값이 추정치인지(자동 정확집계 미보장)
}

// 관측 사이트 레지스트리 — 좌표는 합류부(낙동강 유입 직전 마디) 기준으로 단일화.
// (수위·강우 보드용 src/lib/sites.ts와 목적이 다름: 이쪽은 관측 레코드 조립용.)
export interface ObsSite {
  site_id: string;
  name: string;
  gu: string;
  river: string;
  river_code: string;
  river_grade: RiverGrade;
  regime: Regime;
  lat: number;
  lon: number;
  track: Track;
  busanRainArea?: string; // /api/busan-rain?area=
  hrfco_obs_code?: string; // 공공 수위 관측소(없으면 빈값=자체 IoT 필요)
  hasBoom: boolean; // 물리 붐 트랙 여부(2트랙: 감전천=데이터 / 괴정천=붐)
}

export const OBS_SITES: ObsSite[] = [
  {
    site_id: "gamjeon-confluence",
    name: "감전천 합류부",
    gu: "사상구",
    river: "감전천",
    river_code: "GAMJEON", // 임시 코드 — 실 하천코드(RIMGIS/국가하천코드)로 매핑 예정
    river_grade: "지방하천",
    regime: "urban_stream",
    lat: 35.1326,
    lon: 128.9706, // 엄궁동 학장천 합류부(NakdongMap·OSM 정합)
    track: "data",
    busanRainArea: "사상구",
    hrfco_obs_code: "", // 소하천 공공 수위 부재 → 자체 IoT
    hasBoom: false, // 감전천=데이터 실증 트랙(붐 없음)
  },
  {
    site_id: "goejeong-boom",
    name: "괴정천",
    gu: "사하구",
    river: "괴정천",
    river_code: "GOEJEONG",
    river_grade: "지방하천",
    regime: "urban_stream",
    lat: 35.1028,
    lon: 128.9716,
    track: "boom",
    busanRainArea: "사하구",
    hrfco_obs_code: "",
    hasBoom: true, // 괴정천=무동력 붐 물리 실증 트랙
  },
];

export function getObsSite(id?: string | null): ObsSite | undefined {
  return OBS_SITES.find((s) => s.site_id === id);
}

// KST(+09:00) ISO 타임스탬프. (앱 런타임이므로 Date 사용 가능 — 워크플로 스크립트 제약과 무관.)
export function kstIso(d: Date = new Date()): string {
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().replace(/\.\d{3}Z$/, "").concat("+09:00");
}

export interface BuildInput {
  site: ObsSite;
  ts?: string; // 미지정 시 현재 KST
  segment_sec?: number;
  rainfall_mm?: number | null;
  water_level_hrfco?: number | null;
  water_level_self?: number | null;
}

// 0단계 레코드 조립: 계측 모델 전이라 count_est·class_dist 등은 null, is_estimate=true.
// 실데이터로 채워지는 것은 강우(부산 강우 API)와 (제공 시) 수위·시각·사이트 좌표.
export function buildObservation(input: BuildInput): SeacutObservation {
  const { site } = input;
  const ts = input.ts ?? kstIso();
  const rainfall = input.rainfall_mm ?? null;
  const wlHrfco = input.water_level_hrfco ?? null;
  const wlSelf = input.water_level_self ?? null;
  const water_level_source: WaterLevelSource =
    wlHrfco != null ? "hrfco" : wlSelf != null ? "self_iot" : "none";
  const rain_event_id =
    rainfall != null && rainfall > 0 ? `rain-${ts.slice(0, 10)}` : null;

  return {
    site_id: site.site_id,
    boom_id: site.hasBoom ? `${site.site_id}-a` : null,
    lat: site.lat,
    lon: site.lon,
    river_code: site.river_code,
    river_grade: site.river_grade,
    hrfco_obs_code: site.hrfco_obs_code || null,
    regime: site.regime,
    camera_calib: null,
    ts,
    segment_sec: input.segment_sec ?? 600,
    rain_event_id,
    count_est: null,
    count_ci: null,
    area_ratio: null,
    flux_est: null,
    surface_velocity_est: null,
    class_dist: null,
    water_level_hrfco: wlHrfco,
    water_level_self: wlSelf,
    water_level_source,
    water_level_diff: null,
    boom_tension: null,
    boom_tilt: null,
    rainfall_mm: rainfall,
    weather: rainfall != null ? (rainfall > 0 ? "rain" : "clear") : null,
    illum: null,
    collected_mass_kg: null,
    model_ver: null,
    confidence: null,
    deid_flag: true,
    is_estimate: true,
  };
}

const GRADES: RiverGrade[] = ["지방하천", "소하천", "기타하천", "국가하천"];
const REGIMES: Regime[] = ["estuary", "urban_stream"];
const ILLUMS: Illum[] = ["day", "night", "ir"];

// 경량 런타임 검증(외부 라이브러리 없이). 필수 필드·enum·범위만 확인.
export function validateObservation(rec: unknown): { ok: boolean; errors: string[] } {
  const e: string[] = [];
  if (!rec || typeof rec !== "object") return { ok: false, errors: ["레코드가 객체가 아님"] };
  const r = rec as Record<string, unknown>;
  if (typeof r.site_id !== "string" || !r.site_id) e.push("site_id 필수(문자열)");
  if (typeof r.ts !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(r.ts as string))
    e.push("ts 필수(ISO8601)");
  if (r.regime !== "estuary" && r.regime !== "urban_stream")
    e.push("regime 은 estuary|urban_stream");
  if (typeof r.deid_flag !== "boolean") e.push("deid_flag 필수(boolean)");
  if (typeof r.is_estimate !== "boolean") e.push("is_estimate 필수(boolean)");
  if (r.river_grade != null && !GRADES.includes(r.river_grade as RiverGrade))
    e.push("river_grade 값 오류");
  if (r.illum != null && !ILLUMS.includes(r.illum as Illum)) e.push("illum 값 오류");
  if (r.area_ratio != null) {
    const a = r.area_ratio as number;
    if (typeof a !== "number" || a < 0 || a > 1) e.push("area_ratio 는 [0,1]");
  }
  if (r.count_ci != null && (!Array.isArray(r.count_ci) || r.count_ci.length !== 2))
    e.push("count_ci 는 [하한, 상한]");
  return { ok: e.length === 0, errors: e };
}

// JSONL 직렬화 — 한 줄 한 레코드(적재 표준 포맷).
export function toJsonl(records: SeacutObservation[]): string {
  if (!records.length) return "";
  return records.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

export { REGIMES, GRADES, ILLUMS };
