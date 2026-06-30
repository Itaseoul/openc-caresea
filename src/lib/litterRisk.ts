// 하류 퇴적 쓰레기 위험 예측기 — physical AI 0단계(결정형 척추, 학습형 표면).
//
// 목적: "지금 이 시간 하류에 쓰레기가 퇴적돼 있을 것으로 예상되는 곳(하천·장소)"을
//       실데이터(강우)로 점수화해 핫스팟을 순위로 낸다.
//
// 왜 학습 모델이 아니라 물리 휴리스틱인가:
//   라벨(실제 퇴적량·수거 중량 이력)이 아직 0건이라 지도학습이 불가능하다. 대신
//   하천 수리·퇴적 물리를 사전지식으로 인코딩한 투명한 위험 지수를 둔다. 이 예측기의
//   입력(강우)과 출력(예측)을 관측 레코드(observation.ts)로 적재하고, 이후 수거 중량
//   (collected_mass_kg)이 앵커로 들어오면 (예측, 결과) 쌍이 생겨 학습형 모델로 교정·대체한다.
//   즉 이 휴리스틱이 베이스라인이자 약지도(weak label) 생성기다.
//
// 퇴적 물리(왜 이 변수들인가):
//   퇴적량 ≈ 발생원 부하 × 이송(강우·first-flush) × 트랩 효율(합류부·복개출구·저구배·조석 정체).
//   · first-flush: 강우 시작 직후 건기에 쌓인 채널·노면 쓰레기가 한꺼번에 씻겨 내려가 하류 트랩에 걸린다.
//     그래서 총강우량보다 "강우가 최근/진행 중인가"가 더 중요하다(사용자 직관 그대로).
//   · 트랩: 흐름이 느려지거나 막히는 곳에 모인다 — 합류부, 복개 출구, 저구배, 하구 조석 정체.
//   · 건기에도 직전 이벤트의 정체 퇴적(standing)이 남아 평시 순위의 바닥을 만든다.

import { kstIso, type SeacutObservation, type Regime, type RiverGrade } from "@/lib/observation";

export const MODEL_VER = "physical-heuristic-v0";

export type RiskLevel = "낮음" | "관심" | "주의" | "높음";

// 정적 물리 사전(0~1). 근거는 docs/하류-퇴적-예측-0단계.md. 데이터 누적 후 학습으로 보정 대상.
export interface HotspotProfile {
  id: string;
  name: string; // 하천·장소(사람 읽는 이름)
  gu: string;
  river: string;
  lat: number;
  lon: number;
  regime: Regime; // 수리 레짐(estuary 기수·조석 / urban_stream 도시소하천)
  river_code: string;
  river_grade: RiverGrade;
  busanRainArea: string; // 강우 신호 매핑(/api/busan-rain?area=)
  catchment_load: number; // 상류 발생원 강도(산단/도심/시장 → 높음)
  trap_score: number; // 트랩 기하(합류부/복개출구/저구배 → 높음)
  tide_sensitive: number; // 조석 정체 가둠(하구 → 높음)
  trap_kind: string; // 트랩 유형(사람 읽기)
}

export interface RiskSignal {
  rainfall_mm: number | null; // 최근 강우 실값(mm)
  rain_observed_at?: string | null; // 강우 관측 시각(있으면 recency 감쇠)
  tide_factor?: number | null; // 0~1 현재 조위 트랩 강도(하구). null이면 중립 0.5(정적 tide_sensitive와 동일)
}

export interface RiskPrediction {
  id: string;
  name: string;
  gu: string;
  river: string;
  lat: number;
  lon: number;
  score: number; // 0~1
  level: RiskLevel;
  factors: {
    standing: number; // 평시 정체 퇴적
    pulse: number; // 강우 펄스 퇴적
    rain: number; // 강우 포화 인자
    flush: number; // first-flush 인자
    trap: number; // 트랩(+조석)
    tide: number; // 조석 현재 강도(0~1, null이면 0.5)
    catchment: number; // 발생원
  };
  why: string; // 지배 인자 기반 설명
  rainfall_mm: number | null;
  is_estimate: true;
}

// 핫스팟 레지스트리 — 낙동강 유입 길목의 주요 트랩 노드. 좌표는 NakdongMap·OBS_SITES 정합.
export const HOTSPOTS: HotspotProfile[] = [
  {
    id: "gamjeon-confluence",
    name: "감전천·학장천 합류부",
    gu: "사상구",
    river: "감전천",
    lat: 35.1326,
    lon: 128.9706,
    regime: "urban_stream",
    river_code: "GAMJEON",
    river_grade: "지방하천",
    busanRainArea: "사상구",
    catchment_load: 0.8, // 사상공단+도심 발생원
    trap_score: 0.85, // 합류부 정체(두 물길 합산 부하)
    tide_sensitive: 0.0,
    trap_kind: "합류부 정체",
  },
  {
    id: "hakjang-nakdong",
    name: "학장천 엄궁동 낙동강 유입구",
    gu: "사상구",
    river: "학장천",
    lat: 35.1299,
    lon: 128.9695,
    regime: "urban_stream",
    river_code: "HAKJANG",
    river_grade: "지방하천",
    busanRainArea: "사상구",
    catchment_load: 0.75, // 학장천+감전천 합산
    trap_score: 0.7, // 본류 합류 직전 정체
    tide_sensitive: 0.3, // 하구 조석 영향 일부
    trap_kind: "낙동강 유입구",
  },
  {
    id: "goejeong-culvert",
    name: "괴정천 복개 출구",
    gu: "사하구",
    river: "괴정천",
    lat: 35.1028,
    lon: 128.9716,
    regime: "urban_stream",
    river_code: "GOEJEONG",
    river_grade: "지방하천",
    busanRainArea: "사하구",
    catchment_load: 0.7, // 도심 발생원
    trap_score: 0.8, // 복개 출구 급변·저구배
    tide_sensitive: 0.1,
    trap_kind: "복개 출구·저구배",
  },
  {
    id: "eulsukdo-estuary",
    name: "을숙도 하구",
    gu: "사하구",
    river: "낙동강 하구",
    lat: 35.097,
    lon: 128.94,
    regime: "estuary",
    river_code: "NAKDONG_ESTUARY",
    river_grade: "국가하천",
    busanRainArea: "사하구",
    catchment_load: 0.5, // 본류 광역 부하
    trap_score: 0.6,
    tide_sensitive: 0.9, // 조석 정체 가둠 강함
    trap_kind: "하구 조석 정체",
  },
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sat = (x: number, k: number) => 1 - Math.exp(-Math.max(0, x) / k); // 포화 곡선

// first-flush 인자: 강우가 최근/진행 중일수록 강함. 관측시각 있으면 경과시간으로 감쇠(반감 ~6h).
export function flushFactor(rain: number, observedAt?: string | null, now: Date = new Date()): number {
  if (rain <= 0) return 0;
  if (observedAt) {
    const t = Date.parse(observedAt);
    if (Number.isFinite(t)) {
      const hours = (now.getTime() - t) / 3.6e6;
      return clamp01(Math.exp(-Math.max(0, hours) / 6));
    }
  }
  return 0.7; // 관측시각 미상 시 보수적 중간값
}

// 한 핫스팟의 현재 퇴적 위험 점수.
//   퇴적 ≈ 발생원 × 트랩 × (정체 standing + 강우 펄스). 강우 펄스에 가중(0.65).
export function scoreHotspot(p: HotspotProfile, s: RiskSignal, now: Date = new Date()): RiskPrediction {
  const rain = s.rainfall_mm ?? 0;
  const rainF = sat(rain, 10); // 10mm 근방에서 포화
  const flushF = flushFactor(rain, s.rain_observed_at, now);
  const tideNow = s.tide_factor ?? 0.5; // 라이브 조위 없으면 중립 0.5(정적 tide_sensitive와 동일 결과)
  const trap = clamp01(p.trap_score * (1 + p.tide_sensitive * tideNow)); // 조석이 트랩 보강(실시간 가능)
  const base = p.catchment_load * trap;
  const standing = base; // 평시 정체 퇴적(건기에도 존재)
  const pulse = base * rainF * (0.4 + 0.6 * flushF); // 강우 펄스
  const score = round2(clamp01(0.35 * standing + 0.65 * pulse)); // 표시값과 등급 일관성 위해 먼저 반올림

  const level: RiskLevel =
    score >= 0.6 ? "높음" : score >= 0.38 ? "주의" : score >= 0.18 ? "관심" : "낮음";

  const why = buildWhy(p, rain, flushF, pulse, standing, s.tide_factor ?? null);

  return {
    id: p.id,
    name: p.name,
    gu: p.gu,
    river: p.river,
    lat: p.lat,
    lon: p.lon,
    score,
    level,
    factors: {
      standing: round2(standing),
      pulse: round2(pulse),
      rain: round2(rainF),
      flush: round2(flushF),
      trap: round2(trap),
      tide: round2(tideNow),
      catchment: round2(p.catchment_load),
    },
    why,
    rainfall_mm: s.rainfall_mm ?? null,
    is_estimate: true,
  };
}

function buildWhy(
  p: HotspotProfile,
  rain: number,
  flushF: number,
  pulse: number,
  standing: number,
  tideLive: number | null = null
): string {
  const parts: string[] = [p.trap_kind];
  if (rain > 0) {
    parts.push(`강우 ${rain}mm`);
    if (flushF >= 0.5) parts.push("강우 직후 first-flush 펄스");
    else if (flushF > 0) parts.push("강우 이후 잔여 이송");
  } else {
    parts.push("건기(직전 이벤트 정체 퇴적 위주)");
  }
  if (p.tide_sensitive >= 0.6) {
    parts.push(tideLive != null ? `하구 조석 실시간 ${Math.round(tideLive * 100)}%` : "하구 조석 정체");
  }
  const driver = pulse > standing ? "강우 이송이 지배" : "평시 정체가 지배";
  return `${parts.join(" · ")} — ${driver}`;
}

const round2 = (x: number) => Math.round(x * 100) / 100;

// 여러 핫스팟을 현재 신호로 채점해 위험 내림차순 정렬.
//   signalsByArea: 강우 area(구) → 신호. 핫스팟의 busanRainArea로 매핑.
export function predictAccumulationRisk(
  profiles: HotspotProfile[],
  signalsByArea: Record<string, RiskSignal>,
  tideByHotspot: Record<string, number> = {}, // 하구 핫스팟 id → 실시간 조위 트랩 강도(0~1)
  now: Date = new Date()
): RiskPrediction[] {
  return profiles
    .map((p) =>
      scoreHotspot(
        p,
        {
          ...(signalsByArea[p.busanRainArea] ?? { rainfall_mm: null }),
          tide_factor: p.id in tideByHotspot ? tideByHotspot[p.id] : null,
        },
        now
      )
    )
    .sort((a, b) => b.score - a.score);
}

// 예측 → 관측 레코드. 예측 점수(risk_*)를 함께 적재해 이후 collected_mass_kg(정답)와
// (예측, 결과) 쌍으로 학습/교정한다. count_est 등 계측치는 0단계라 null(is_estimate=true).
export function hotspotToObservation(
  p: HotspotProfile,
  pred: RiskPrediction,
  signal: RiskSignal,
  ts?: string
): SeacutObservation {
  const t = ts ?? kstIso();
  const rain = signal.rainfall_mm ?? null;
  return {
    site_id: p.id,
    boom_id: null,
    lat: p.lat,
    lon: p.lon,
    river_code: p.river_code,
    river_grade: p.river_grade,
    hrfco_obs_code: null,
    regime: p.regime,
    camera_calib: null,
    ts: t,
    segment_sec: null,
    rain_event_id: rain != null && rain > 0 ? `rain-${t.slice(0, 10)}` : null,
    count_est: null,
    count_ci: null,
    area_ratio: null,
    flux_est: null,
    surface_velocity_est: null,
    class_dist: null,
    water_level_hrfco: null,
    water_level_self: null,
    water_level_source: "none",
    water_level_diff: null,
    boom_tension: null,
    boom_tilt: null,
    rainfall_mm: rain,
    weather: rain != null ? (rain > 0 ? "rain" : "clear") : null,
    illum: null,
    collected_mass_kg: null,
    model_ver: null,
    confidence: null,
    risk_score: pred.score,
    risk_level: pred.level,
    risk_model_ver: MODEL_VER,
    deid_flag: true,
    is_estimate: true,
  };
}
