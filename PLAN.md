# openc.caresea.kr — SEA:CUT 우기 알림 사이트 (빌드 계획서)

> 한 줄 정체성: **"비를 못 오게 하진 못해도, 오는 비를 절대 놓치지 않게 한다."** — 우기 SPOF 대응 대시보드.
> 대상 지점: 서울 홍제천 사천교(서대문구, 베이스라인) → 부산 학장천 엄궁동(PoC).
> 작성 2026-06-28. 데이터 API 상세 명세는 워크플로우(wfbcfzqid) 결과로 확정·주입.
> **확장 2026-06-30:** 우기 알림(M0–M3)을 넘어 OpenBoom을 "물 위 데이터 공장"으로 보는 **physical AI 데이터 루프(탐지→표류→경로)**로 확장. 로드맵 M4–M6과 §10 참조.

## 1. 목적·기능 (v0.1)
1. **강수 예보** — 언제·얼마나·얼마나 오래 (기상청 단기예보)
2. **강수 실황** — 지금 오나 (기상청 초단기실황 + AWS)
3. **호우특보** — 철거 트리거 (기상청 특보)
4. **하천 수위** — 촬영·접근 안전, 통제수위 대비 (한강홍수통제소 / 서울 OA-1167)
5. **강우 이벤트 DB** — 시작·종료·누적량·지속시간 자동 기록 ("짧게 vs 길게" 자산)
6. **알림** — 촬영 윈도우 열림(비 직후 24~48h) / 호우특보=철거 권고 / 통제수위 도달=진입금지

## 2. CORS·키 — 구조적 해결 (정정된 정설)
- 공공 API의 CORS는 엔드포인트마다 다름(보장 X). 또한 `serviceKey`가 클라이언트에 노출되면 안 됨.
- → **Next.js API route(`src/app/api/*`)가 프록시 겸 키 보관소**. 브라우저는 우리 `/api/*`만 호출(동일 출처=CORS 무관), route가 서버에서 공공 API를 키와 함께 호출.
- 키는 `.env`(서버 전용, `NEXT_PUBLIC_` 접두사 절대 금지). 정적 노출 0.

## 3. 아키텍처
```
[브라우저 대시보드]  --동일출처-->  [Next.js API routes (프록시·키보관)]  --serviceKey-->  [기상청/홍수통제소/서울 공공 API]
                                          └─ (선택) 주기 수집 cron → KV/DB에 강우 이벤트 적재(⑤)
```
- v0.1: 브라우저가 `/api/kma` 등 호출 → 실시간 표시. (키 숨김·CORS 해결 완료)
- v0.2: 서버리스 cron(또는 ita.city)이 실황을 주기 적재 → 강우 이벤트 DB(⑤) → 알림(⑥).
- ★사용자 PC python hang 이력 회피: 로컬 상주 백엔드 없음. 전부 Next.js(노드) + 서버리스.

## 4. 배포 (openc.caresea.kr)
- 옵션 A(권장): **Vercel** — Next.js 네이티브, 커스텀 도메인 `openc.caresea.kr` CNAME 연결, env 시크릿 관리, cron(Vercel Cron) 내장. 무료 티어 충분.
- 옵션 B: **Cloudflare Pages + Functions** — caresea가 Cloudflare면 자연스러움.
- 옵션 C: 기존 caresea 서버에 `next build && next start`(Node) + 리버스 프록시.
- DNS: caresea.kr 관리 콘솔에서 `openc` 서브도메인 → 배포처 CNAME.

## 5. 레포 구조
```
openc-caresea/
  PLAN.md                 ← 본 문서
  README.md               ← 실행·배포 방법
  .env.example            ← 키 목록(복사해 .env로)
  package.json
  next.config.mjs / tsconfig.json / tailwind.config.ts / postcss.config.mjs
  src/
    app/
      layout.tsx
      globals.css
      page.tsx            ← 대시보드(플레이스홀더, Claude design이 교체)
      api/
        kma/route.ts      ← 기상청 프록시(구현됨: 초단기실황·단기예보)
        hrfco/route.ts    ← 한강홍수통제소 수위(워크플로우 결과로 채움) TODO
        seoul/route.ts    ← 서울 OA-1167 하천수위 TODO
    lib/
      grid.ts             ← 위경도 → 기상청 격자(nx,ny) 변환(구현됨)
      sites.ts            ← 관측 지점 좌표(사천교/학장천) TODO
```

## 6. Claude design 통합 방식
- Claude design은 **`src/app/page.tsx`와 `src/components/*`의 React+Tailwind UI만** 생성/교체.
- 데이터는 전부 `/api/*`에서 오므로, design은 "이 JSON을 이렇게 보여줘" 수준으로 독립 작업 가능.
- 디자인 산출물을 `src/components/`에 붙이고 `page.tsx`에서 조립. API·키·로직은 건드리지 않음.
- 권장 컴포넌트: `RainForecastCard` · `NowcastBadge` · `WarningBanner`(특보) · `RiverLevelGauge`(통제수위 대비) · `RainEventTimeline` · `AlertRules`.

## 7. 로드맵
- **M0 (지금):** 스캐폴드 + 기상청 프록시 동작(초단기실황·단기예보) + 격자 변환. VS Code에서 `npm i && npm run dev`로 사천교 강수 표시 확인.
- **M1:** 워크플로우 결과 주입 → 특보·AWS·홍수통제소·서울 수위 라우트 완성. 화면에 6기능 배치(Claude design).
- **M2:** 강우 이벤트 DB(서버리스 cron 적재) + 알림(브라우저 푸시/이메일/텔레그램·카카오 봇).
- **M3:** 부산 학장천 지점 추가(`sites.ts`), ita.city 연동, 공개.
- **M4 (구현 완료, 라벨 수집 시작):** physical AI 0단계 데이터 루프 — 관측 표준 스키마(`observation.ts`·`/api/observations`), 하류 퇴적 위험 예측기(`litterRisk.ts`·`/api/litter-risk`), 수거 중량 앵커(`/api/observations/anchor`), GPS 드리프터 궤적(`DriftTrack`·`/api/observations/drift`)과 예측 검증(`/api/litter-risk/validate`). 전부 휴리스틱·약지도 단계(라벨 0). 상세 §10.
- **M5:** 엣지 계측 모델(탐지 자동화 — `count_est`·`area_ratio`·`class_dist` 채움, ADIS식 크롭+메타데이터만 전송) + 현장 라벨(수거 중량·드리프터 궤적) 누적.
- **M6:** 수거 동선·붐 비움 경로 최적화(INFORMS 벤치마킹) + 라벨 누적 후 학습형 모델로 예측 교정.

## 8. 즉시 할 일 (키 신청) — ★[docs/DATA_APIS.md](./docs/DATA_APIS.md) 실측 검증 완료
신청은 **시차·사람손 리스크 순**:
1. **한강홍수통제소** `HRFCO_KEY` — hrfco 자체 발급(폼 불안정 시 전화 02-590-9999), 키가 등록 URL/IP 바인딩. 발급 직후 `waterlevel/info`로 **홍제천 사천교 코드 존재여부 확인**(소하천이라 없을 수 있음 → 그땐 서울 OA-1167 대용).
2. **data.go.kr** `KMA_SERVICE_KEY` 1개 — 단기예보(15084084)+기상특보 구버전(15000415) 동시 활용신청. 자동승인, **활성화 1~24h 시차** → 가장 먼저 걸어둘 것.
3. **서울 열린데이터광장** `SEOUL_KEY`(OA-1167) — 즉시 발급. 21개소 조회로 사천교 수위계 코드 확정. ★공공누리 2유형(상업이용 금지·출처표시).
> CORS 실측 결론: data.go.kr·hrfco·서울은 브라우저 직접도 되지만(제 "무조건 불가"는 정정), 키 노출·IP바인딩·mixed-content 때문에 `/api/*` 프록시로 통일. apihub.kma.go.kr만 CORS 없음(프록시 필수).

## 9. 정직·제약
- 예보는 불확실(6/29 갬도 "추정"). 사이트는 **확률·실황·특보를 함께** 보여주고 단정하지 않음.
- 공개 데이터 한계·갱신주기 표기. 키 보안은 프록시로, 절대 클라이언트 노출 금지.
- 알림은 **의사결정 보조**이지 안전 보증 아님. 호우특보·통제수위는 현장 판단과 병행.

## 10. physical AI 데이터 루프 — 탐지→표류→경로 (2026-06-30 확장)

OpenBoom은 단순한 차단막이 아니라 부유물이 한 점에 모이는 **계측 게이트, 곧 물 위의 데이터 공장**이다([[docs/physical-ai-boom-전문가패널.md]]). 세계의 정화는 떠 있는 쓰레기를 막는 물리 장치에서 **탐지하고 예측하고 최적 동선으로 걷어내는 데이터 루프**로 진화 중이며(특히 The Ocean Cleanup이 한 조직 안에서 풀스택을 오픈/협력으로 구축), SEA:CUT은 이를 외해·위성이 아니라 **소하천·하구 규모로, 시민·무동력으로** 가져온다. 근거: `docs/글로벌-AI-정화사례-벤치마킹-심층스터디.md`, `docs/GPS-드리프터-표류실측-심층스터디.md`.

### 풀스택 3축

| 축 | 세계 벤치마크 | SEA:CUT 구현 | 상태 |
|---|---|---|---|
| **탐지 (detect)** | ADIS 엣지 AI 카메라(약 6W, 크롭+메타데이터만 전송) | 관측 스키마 `count_est`·`area_ratio`·`class_dist`, `/api/observations` | 스키마 ✓ / 계측 모델 TODO(M5) |
| **표류 (drift)** | ADOPT·DEEP-PLAST 위성+ML 표류 예측, GPS 드리프터 실측 | `litter-risk` 예측(`/api/litter-risk`) + 드리프터 궤적(`/api/observations/drift`) + 예측 검증(`/api/litter-risk/validate`) | 휴리스틱 예측·약지도 검증 ✓ |
| **경로 (route)** | INFORMS 비선형 경로 최적화 | 수거 동선·붐 비움 출동 우선순위 | TODO(M6, 라벨 누적 후) |

### 학습 루프 (0→3단계)

- **0단계 로깅 ✓** — 표준 스키마·타임싱크로 관측 적재(`/api/observations`). 계측 모델 전이라 `is_estimate=true`.
- **1단계 예측 ✓** — 물리 휴리스틱(발생원 × 트랩 × 강우 first-flush 펄스)으로 핫스팟 순위(`/api/litter-risk`), 예측을 관측 레코드(`risk_score`)로 적재.
- **2단계 앵커·검증 ✓** — 수거 중량 `collected_mass_kg` 앵커(`/api/observations/anchor`, "얼마나")와 드리프터 궤적 경로 검증(`/api/litter-risk/validate`, "어디로")으로 (예측, 정답) 쌍 완성.
- **3단계 교정 TODO** — 라벨이 충분히 쌓이면 학습형 모델로 휴리스틱을 교정·대체(M6).

### 정직 경계

- 현재 예측·검증은 **라벨 0단계의 약지도(weak)** — 휴리스틱이 베이스라인이자 약지도 생성기다. 학습형 모델이 아니다.
- 위성·외해·대형 선단의 성능 수치(예: 수거효율 60%↑, 탐지 F1 0.84)는 측정 환경이 달라 **우리 소하천 성능으로 직접 인용하지 않는다**(도메인 갭). 우리 강점은 위성 해상도가 아니라 발생원에 가까운 **상류 차단 위치**와 고정 붐의 **연속 시계열**이다.
- GPS 드리프터는 상시 도구가 아니라 **간헐 캘리브레이션 캠페인**이며, 소하천은 붐이 종점이라 회수·재사용을 전제로 윤리 논란을 피한다.
