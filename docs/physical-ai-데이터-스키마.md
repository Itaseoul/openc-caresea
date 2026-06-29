# SEA:CUT 관측 레코드 표준 스키마 (physical AI 0단계)

작성 2026.06.29. physical AI 전문가 패널의 결론은 "액추에이터보다 로깅이 먼저"였다. 이 문서는 지금 바로 로깅을 시작할 수 있도록 관측 레코드 하나의 표준 구조를 확정한다. 한 레코드는 어디서(where) 언제(when) 무엇을(what) 측정했는가의 한 묶음이며, 수거 중량을 정답 앵커로 함께 담는다. 문체는 서술형이되 스키마 자체는 기계가 읽는 JSON이다.

설계 원칙은 다섯이다. 첫째 모든 스트림은 공통 타임스탬프로 정렬한다. 둘째 영상은 현장에서 비식별 처리한 뒤 메타데이터만 적재한다. 셋째 모든 추정치는 추정임을 표시하고 가능하면 신뢰구간을 붙인다. 넷째 수리 레짐이 다른 곳은 분리한다. 곧 을숙도 하구는 기수와 조석이라 도시 소하천과 데이터 풀을 나눈다. 다섯째 한강홍수통제소 관측소 코드와 공공데이터 표준에 연결해 상호운용을 연다.

## 필드 정의

| 그룹 | 필드 | 의미 |
|---|---|---|
| 공간 | site_id, boom_id | 스팟·붐 식별자 |
| 공간 | lat, lon | 위경도 |
| 공간 | river_code, river_grade | 하천코드, 법정등급(지방하천/소하천/기타하천/국가하천) |
| 공간 | hrfco_obs_code | 한강홍수통제소 수위관측소 코드(매핑) |
| 공간 | regime | 수리 레짐(estuary 기수·조석 / urban_stream 도시소하천) |
| 공간 | camera_calib | 카메라 시점·정사보정 파라미터 참조 |
| 시간 | ts | 관측 시각(ISO8601, +09:00) |
| 시간 | segment_sec | 집계 구간 길이(초) |
| 시간 | rain_event_id | 강우 이벤트 식별자(있으면) |
| 지표 | count_est, count_ci | 통과 부유물 개수 추정치와 신뢰구간(추정, 센서스 아님) |
| 지표 | area_ratio | 수면 점유 면적 비율(0~1) |
| 지표 | flux_est | 단위시간 통과량 추정(개수 또는 면적/시간) |
| 지표 | surface_velocity_est | 표면영상유속계 표면유속 추정(m/s) |
| 지표 | class_dist | 성상 분포 비율과 각 신뢰도(plastic/styrofoam/wood/other) |
| 지표 | water_level_hrfco | 한강홍수통제소 실측 수위(m) |
| 지표 | water_level_diff | 상하류 수위차 Δh, 막힘 지표(m) |
| 지표 | boom_tension | 계류 장력(N 또는 kgf), 누적 질량·항력 대용 |
| 지표 | boom_tilt | 부체 경사·흘수(deg) |
| 지표 | weather, illum | 날씨, 조도 상태(day/night/ir) |
| 앵커·품질 | collected_mass_kg | 수거 실측 중량(영상지표 보정 앵커) |
| 앵커·품질 | model_ver, confidence | 추론 모델 버전, 신뢰도 |
| 앵커·품질 | deid_flag, is_estimate | 비식별 처리 여부, 추정치 여부 |

## JSON Schema (draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SEACUT Observation Record",
  "type": "object",
  "required": ["site_id", "ts", "regime", "is_estimate", "deid_flag"],
  "properties": {
    "site_id": { "type": "string" },
    "boom_id": { "type": "string" },
    "lat": { "type": "number" },
    "lon": { "type": "number" },
    "river_code": { "type": "string" },
    "river_grade": { "type": "string", "enum": ["지방하천", "소하천", "기타하천", "국가하천"] },
    "hrfco_obs_code": { "type": "string" },
    "regime": { "type": "string", "enum": ["estuary", "urban_stream"] },
    "camera_calib": { "type": "string", "description": "정사보정 파라미터 셋 참조 ID" },
    "ts": { "type": "string", "format": "date-time" },
    "segment_sec": { "type": "number" },
    "rain_event_id": { "type": ["string", "null"] },
    "count_est": { "type": ["number", "null"] },
    "count_ci": {
      "type": ["array", "null"],
      "items": { "type": "number" },
      "minItems": 2,
      "maxItems": 2,
      "description": "[하한, 상한]"
    },
    "area_ratio": { "type": ["number", "null"], "minimum": 0, "maximum": 1 },
    "flux_est": { "type": ["number", "null"] },
    "surface_velocity_est": { "type": ["number", "null"] },
    "class_dist": {
      "type": ["object", "null"],
      "properties": {
        "plastic": { "type": "number" },
        "styrofoam": { "type": "number" },
        "wood": { "type": "number" },
        "other": { "type": "number" },
        "confidence": { "type": "number" }
      }
    },
    "water_level_hrfco": { "type": ["number", "null"] },
    "water_level_diff": { "type": ["number", "null"] },
    "boom_tension": { "type": ["number", "null"] },
    "boom_tilt": { "type": ["number", "null"] },
    "weather": { "type": ["string", "null"] },
    "illum": { "type": ["string", "null"], "enum": ["day", "night", "ir", null] },
    "collected_mass_kg": { "type": ["number", "null"], "description": "수거 실측, 영상지표 보정 앵커" },
    "model_ver": { "type": ["string", "null"] },
    "confidence": { "type": ["number", "null"] },
    "deid_flag": { "type": "boolean", "description": "얼굴·번호판 비식별 처리 여부" },
    "is_estimate": { "type": "boolean", "description": "값이 추정치인지(자동 정확집계 미보장)" }
  }
}
```

## 샘플 레코드

```json
{
  "site_id": "gamjeon-01",
  "boom_id": "boom-a",
  "lat": 35.157,
  "lon": 128.985,
  "river_code": "GAMJEON",
  "river_grade": "지방하천",
  "hrfco_obs_code": "",
  "regime": "urban_stream",
  "camera_calib": "calib-gamjeon-01-v1",
  "ts": "2026-07-15T14:20:00+09:00",
  "segment_sec": 600,
  "rain_event_id": "rain-2026-07-15-am",
  "count_est": 42,
  "count_ci": [31, 58],
  "area_ratio": 0.12,
  "flux_est": 4.2,
  "surface_velocity_est": 0.35,
  "class_dist": { "plastic": 0.51, "styrofoam": 0.18, "wood": 0.22, "other": 0.09, "confidence": 0.6 },
  "water_level_hrfco": 1.42,
  "water_level_diff": 0.06,
  "boom_tension": 180.0,
  "boom_tilt": 3.1,
  "weather": "rain",
  "illum": "day",
  "collected_mass_kg": null,
  "model_ver": "det-v0",
  "confidence": 0.58,
  "deid_flag": true,
  "is_estimate": true
}
```

## 지금 시작하는 방법 (0단계)

기존 자산만으로 시작한다. openc.caresea.kr의 영상과 한강홍수통제소 수위를 같은 타임스탬프로 묶어 위 레코드로 적재한다. 계측 모델이 아직 없으면 count_est와 class_dist는 비우고 수동 관측이나 사후 라벨로 채우되 is_estimate를 true로 둔다. 정기 수거 때마다 collected_mass_kg를 채워 보정 앵커를 쌓는다. 장력 센서를 한두 점 더하면 boom_tension이 들어오기 시작한다. 핵심은 데이터가 적어도 스키마와 타임싱크부터 고정하는 것이다.

## 주의

이 스키마는 0단계 합의안이며 현장 적용에서 필드가 늘 수 있다. surface_velocity_est는 표면영상유속계 추정이라 수위 변동에 따른 정사보정이 필요하고 한강홍수통제소 실측 수위의 보조이지 대체가 아니다. count_est는 군집과 가림과 재유입으로 센서스가 아니므로 area_ratio와 함께 신뢰구간으로 보고한다. 을숙도와 도시 소하천은 regime로 분리해 한 모델의 무리한 전이를 막는다.
