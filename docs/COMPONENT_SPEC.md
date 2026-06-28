# openc.caresea.kr 대시보드 — 컴포넌트 명세 (Claude design 브리핑)

> 목적: "오는 비를 놓치지 않는다" — 촬영 윈도우 포착 + 철거 트리거 알림. SEA:CUT 우기 SPOF 대응.
> ★데이터는 전부 `/api/*`(동일 출처)에서 옴. design은 **UI만** 만든다(아래 계약 유지). 키·로직·라우트는 건드리지 않음.
> 톤: 차분·신뢰·현장용. 한 화면에서 "지금 가도 되나 / 철거해야 하나"가 3초 안에 읽혀야 함. 모바일 우선(현장에서 폰으로 봄).

## 0. 데이터 계약 (각 컴포넌트가 부르는 엔드포인트·응답)
모든 응답에 `ok:boolean`, 일부 `demo:true`(키 없을 때 데모). 실패 시 `ok:false, reason:"NO_KEY"|"FETCH_ERROR"|"940"`.

| 엔드포인트 | 용도 | 핵심 응답 |
|---|---|---|
| `GET /api/kma?site=sacheon&type=ncst` | 지금 강수 | `items:[{category,obsrValue}]` — PTY(강수형태)·RN1(1h강수mm)·T1H(기온)·REH(습도) |
| `GET /api/kma?site=sacheon&type=fcst` | 예보 | `items:[{category,fcstTime,fcstValue}]` — POP(강수확률%)·PTY·PCP(강수mm,문자열)·SKY·TMP |
| `GET /api/seoul?river=홍제천` | 하천 수위 | `items:[{river,station,level,controlLevel,planFloodLevel,collectedAt}]` (성산2교) |
| `GET /api/wrn?stnId=109` | 호우특보 | `{heavyRainWarning:boolean, resultCode, items}` |
| `GET /api/hrfco?type=waterlevel` | 홍수통제소 수위 | `{content}` (배포 후. localhost 940) |
| `GET /api/busan-rain?area=사상구` | 부산 강우 | `items:[{area,rainfall,observedAt}]` (학장천용, 활성화 후) |

**코드값 매핑(컴포넌트에서 사람말로 변환):**
- PTY: `0`없음 `1`비 `2`비/눈 `3`눈 `4`소나기 `5`빗방울 `6`빗방울/눈날림 `7`눈날림
- SKY: `1`맑음 `3`구름많음 `4`흐림
- PCP: 문자열 — `"강수없음"` / `"1.0mm"` / `"1.0mm 미만"` / `"30.0~50.0mm"` / `"50.0mm 이상"` (그대로 표시)

**상태 색 토큰(tailwind 정의됨):** `ok`(#16a34a 초록)·`watch`(#f59e0b 주황)·`danger`(#dc2626 빨강).

## 1. ★ActionAlert — 최상단 의사결정 배너 (이 사이트의 핵심)
지금 상태를 한 문장 + 색으로. 나머지 카드는 근거.

| 상태 | 조건 | 색 | 문구 |
|---|---|---|---|
| **철거 권고** | `wrn.heavyRainWarning` = true **또는** 수위 ≥ 위험선 | danger | "호우특보/수위 위험 — 붐 비상 철거" |
| **주의** | 현재 강수중(PTY≠0 또는 RN1>0) **또는** 수위 ≥ 주의선 | watch | "강우·증수 진행 — 둔치 진입 주의, 다리 위만" |
| **촬영 적기** | 강수 없음(PTY=0 & RN1=0) & 특보 없음 & 수위 안전 & (최근 강우 종료 후) | ok | "촬영 윈도우 — 비 직후 베이스라인 적기" |
| **평상** | 그 외(맑고 비 이력 없음) | neutral | "평상 — 특이사항 없음" |

- ★우선순위: 철거 > 주의 > 촬영적기 > 평상.
- "촬영 적기"의 정밀 판정(비 직후 24~48h)은 강우 이벤트 이력 필요(M2). v0.1은 "현재 강수 없음 + 예보 낮음"으로 근사하고, 작은 글씨로 "정밀 윈도우는 강우 이벤트 기록 연동 예정" 주석.
- 큰 아이콘 + 한 줄 + 보조설명 1줄. 모바일에서 화면 상단 풀폭.

## 2. NowcastCard — "지금 비?"
- 데이터: `/api/kma?type=ncst`. PTY→상태(비/없음), RN1→"최근 1시간 N mm", T1H→기온, REH→습도.
- 비 오면 파랑/물방울 아이콘 강조, 안 오면 차분한 회색. 큰 숫자=강수형태 라벨, 보조=mm·기온.
- 하단: 기준시각(`base.base_time`), `demo` 시 "데모" 칩.

## 3. RainForecastCard — 시간별 예보 (다음 몇 시간)
- 데이터: `/api/kma?type=fcst`. fcstTime별로 POP·PTY·PCP 묶어 **가로 타임라인/막대**.
- 각 시간 슬롯: 시각 / 강수확률 POP% / 아이콘(PTY·SKY) / 강수량 PCP. 비 구간은 파랑 음영.
- "언제부터 비/언제 그침"이 한눈에. 향후 6~24시간.

## 4. WarningBanner — 호우특보 (철거 트리거)
- 데이터: `/api/wrn`. `heavyRainWarning` true면 **danger 풀폭 배너**(상단 고정, ActionAlert보다 위 또는 통합) "호우특보 발효 — 철거 절차". false면 작게 "특보 없음"(ok 칩) 또는 숨김.
- `items`에 특보 내용 있으면 펼쳐보기.

## 5. RiverLevelGauge — 하천 수위 게이지
- 데이터: `/api/seoul?river=홍제천`(성산2교). `level` 현재값.
- ★임계선: **위험=계획홍수위 `planFloodLevel`(15.3m)**, **주의=위험의 ~90%(약 14m)**. `controlLevel`은 성산2교=0(미설정)이라 **0이면 통제수위 표시·사용 안 함**(주의: 0을 임계로 쓰지 말 것).
- 세로/가로 게이지에 현재 수위 + 주의/위험 라인 + 라벨. 안전권 ok, 주의권 watch, 위험권 danger.
- 하단: `station`(성산2교)·`collectedAt`·"사천교 게이지 없음→하류 성산2교 대체" 주석. `demo` 칩.

## 6. RainEventTimeline — 강우 이벤트 (M2 자리)
- v0.1은 **플레이스홀더**("강우 이벤트 기록은 M2에서 연동 — 비 시작/종료·누적량·지속시간"). 점선 박스로 자리만.
- M2 연동 시: 최근 강우 이벤트 리스트(시작~종료, 누적 mm, 지속 h) + "마지막 비 종료 후 경과시간"(촬영 윈도우 카운터).

## 공통 요소
- **SiteSwitcher**: 홍제천 사천교(서울) ↔ 학장천 엄궁동(부산). 선택 시 `site`·`stnId`·`area` 파라미터 전환. (부산 수위는 없음→강우+자체계측 안내)
- **상태 처리**: 로딩(스켈레톤)·`demo`(주황 칩 "데모 데이터")·에러(`NO_KEY`="키 설정 안내", `FETCH_ERROR`/`940`="일시 연결 실패, 배포 후/시차"). 빈데이터(특보 NO_DATA=정상 "없음").
- **데이터 신선도**: 각 카드 기준시각 + 전체 "마지막 갱신". 10분 주기 자동 새로고침(또는 수동 버튼).
- **★출처표시(법적 필수)**: 푸터에 "기상청·한강홍수통제소·서울특별시(공공누리 제2유형, 비상업)·부산광역시" 출처 명기. 서울/부산 데이터는 **상업적 이용 금지**라 비영리 표기.
- **푸터**: "powered by 이타시티 / SEA:CUT — openc.caresea.kr", 정직 문구 "예보·관측 보조 정보이며 안전을 보증하지 않습니다. 호우특보·현장 판단과 병행."

## 레이아웃 (모바일 우선)
```
[WarningBanner — 특보 시에만 danger 풀폭]
[ActionAlert — 큰 의사결정 배너]
[NowcastCard] [RiverLevelGauge]      ← 2열(모바일 1열)
[RainForecastCard — 타임라인 풀폭]
[RainEventTimeline — M2 플레이스홀더]
[SiteSwitcher · 갱신시각 · 출처 푸터]
```

## design 작업 범위
- 만들 것: `src/app/page.tsx` 재구성 + `src/components/*`(위 6종 + SiteSwitcher + 공통 상태). React + Tailwind(색 토큰 사용). 기존 `/api/*` fetch 계약 유지.
- 안 만질 것: `src/app/api/*`, `src/lib/*`, `.env*`.
- 데이터 형태가 헷갈리면 이 문서의 §0 응답 예시를 기준으로. 실제 값은 `demo` 모드로도 렌더 확인 가능.
