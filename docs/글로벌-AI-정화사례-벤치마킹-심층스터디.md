# 글로벌 AI 환경정화 5선 — SEA:CUT 벤치마킹 심층 스터디

2026-06-30, 의뢰인이 제시한 "오늘의 AI 환경 정화 뉴스" 5건과 원문 링크를 모두 직접 확인해, SEA:CUT(소하천·하구 쓰레기 차단·수거 physical AI)의 자산·코드·포지셔닝에 무엇을 가져오고 무엇을 거를지 매핑한다. 수치는 원문에서 검증한 것만 쓰고, 추정·미확인은 `(추정)`·`(미확인)`으로 표시한다. 과장 금지 — 외해·위성 사례의 성능 수치를 우리 소하천 도메인에 직접 귀속하지 않는다.

---

## 0. 한 줄 합의 — 5건이 가리키는 단 하나의 청사진

**5건 중 3건(ADIS·ADOPT·INFORMS)이 모두 The Ocean Cleanup 생태계다.** 한 조직이 "데이터 수집(엣지 AI 카메라) → 탐지·표류 예측(위성+ML) → 수거 경로 최적화(운영연구)"의 **풀스택을 오픈/협력 모델로** 쌓고 있다. 나머지 2건은 그 스택의 양 끝을 보강한다 — PlasticPiratesEU는 **입력단(시민과학 표준 데이터)**, DEEP-PLAST는 **탐지·예측 아키텍처(U-Net++ + Lagrangian)**.

SEA:CUT가 베낄 청사진은 기술 한 토막이 아니라 **이 풀스택의 구조**다. 단, 규모와 위치를 뒤집어서:

- 그들은 **외해(태평양·흑해)**, 우리는 **소하천·하구 상류 차단점**. → 우리가 발생원에 더 가깝다.
- 그들은 **위성·대형 선단·NPU 함대**, 우리는 **고정 붐 1기 + 근접 영상 + 시민**. → 우리는 연속·고해상도 시계열을 싸게 얻는다.
- 공통점: **탐지는 끝이 아니라 예측·최적화의 입력이고, 데이터 표준·오픈이 신뢰·정책의 통로다.**

거를 것은 명확하다 — 위성 궤도, 외해 항해, 1,000대 함대, "60%·F1 0.84" 같은 **타 도메인 수치의 직접 차용**. 가져올 것은 **설계 원리**다([[physical-ai-boom]]의 "붐=데이터 공장" 명제를 풀스택으로 확장).

---

## 1. 5건 한눈에 — 검증 표

| # | 사례 | 주체 | 핵심 기술 | 검증된 수치 | SEA:CUT 직결 |
|---|------|------|-----------|-------------|--------------|
| 1 | **PlasticPiratesEU** (Plastic Pirates – Go Europe!) | DLR PT(독), 14개국 학교·연구파트너 | 공통 과학 프로토콜 시민과학, 4팀 역할분담, **사진 검증** | 2022–2025, **25,000명** 청소년, **390개** 강·개울·해변, Zenodo·EMODnet 오픈데이터 | 시민관측 표준화·라벨 공백 메우기 |
| 2 | **ADIS** (Automated Debris Imaging System) | The Ocean Cleanup (Lead: Robin De Vries) | **MAIVIN NPU 엣지 카메라**, 5분류 객체탐지, 크롭+메타데이터만 전송, 오프라인-우선 | **6W** 전력, **18척·33대**, 20,000km² 스캔, 2억+ 프레임, **1,000대** 확장 가능 | OpenBoom 엣지AI 설계·전송 스키마 |
| 3 | **ADOPT** (AI for Detecting Ocean Plastic w/ Tracking) | ESA·EPFL ECEO·SDSC·Wageningen·The Ocean Cleanup | Sentinel-2 탐지 + **ML 편향보정 24h 표류예측**, windrows 추적 | Sentinel-2 6일/10m, PlanetScope 매일/3–5m, Global Drifter GPS(1990s~), 오픈소스, 2년 펀딩 | litter-risk 다음 단계(표류·이동 예측) |
| 4 | **DEEP-PLAST** | MDPI *Water* 17(22):3318 (흑해) | **YOLOv5(UAV) + U-Net++(Sentinel-2) + Lagrangian 표류** | **F1 = 0.84, FPR 5.2%**(U-Net++), Copernicus·NOAA 환경모델, 웹툴 계획 | 탐지→예측 아키텍처 참조 |
| 5 | **INFORMS** "Optimizing the Path Towards Plastic-Free Oceans" | *Operations Research*, den Hertog(암스테르담대)·Pauphilet(LBS)·Sainte-Rose(TOC) | **비선형 경로 최적화**, 동적 환경요인 실시간 분석 | 2022–2024, 1년치 해양조건·밀도 데이터, **수거효율 60%↑**(비용 동결), 초 단위 연산, 태평양 운영 통합 | 수거 동선·붐 배치 최적화 |

> DOI: DEEP-PLAST = [10.3390/w17223318](https://doi.org/10.3390/w17223318), INFORMS = [10.1287/opre.2023.0515](https://pubsonline.informs.org/doi/10.1287/opre.2023.0515)

---

## 2. 사례별 심층 — 무엇을 가져오고 무엇을 거르나

### 2.1 PlasticPiratesEU — "표준 프로토콜 + 사진 검증"이 시민 데이터를 과학으로 만든다

**무엇인가.** 독일에서 2016년 시작한 Plastic Pirates를 EU가 2022–2025 확장(코디네이터 Philip Ackermann, DLR Project Management Agency). 14개국 청소년 25,000명이 390개 강·개울·해변을 표본 채집. 핵심은 규모가 아니라 **방법의 표준화**다.

- **공통 과학 프로토콜 하나**를 모든 국가가 따른다.
- 4팀 역할분담: ① 구간별 플라스틱 양 추적 ② 수집·분류 ③ 미세망으로 미세플라스틱 포집(연구소 송부) ④ **검증 전담: 전 과정을 최대한 사진 촬영**.
- 결과는 **Zenodo 오픈 저장소 + EMODnet**(유럽 해양데이터 플랫폼)에 공개 → "EU Mission: Ocean and Waters" 정책에 직접 연계.
- Ackermann: "사진으로 모든 결과를 검증하므로 **때로는 아이들의 데이터가 전문 연구원보다 신뢰성이 높다.**"

**가져올 것.** SEA:CUT의 시민 수거([[opensource-collection-robot]] 1기)는 이미 사람이 붙는다. 거기에 **① 공통 관측 프로토콜 + ② 사진 검증 의무화**를 얹으면, 수거 활동이 그대로 **라벨 데이터 생산**이 된다. 우리 `SeacutObservation` 스키마의 `deid_flag`·`is_estimate`에 더해 **`photo_verified: boolean` 필드**를 추가하면 시민 데이터를 학습셋으로 승격하는 신뢰 장치가 생긴다. 지역별 특성(스페인=물티슈)처럼 **사이트별 성상 분포(class_dist) 차이**를 드러내는 것도 우리 괴정천·감전천 비교에 그대로 적용된다.

**거를 것.** 우리는 14개국이 아니라 1~2개 사이트다. 규모를 흉내 낼 게 아니라 **프로토콜의 엄밀성**만 가져온다.

### 2.2 ADIS — 엣지 추론 + "크롭만 전송" 오프라인-우선, 6W의 경제성

**무엇인가.** The Ocean Cleanup의 분산 센싱 플랫폼. 상업용 선박 18척에 AI 카메라 33대를 달아 해수면 부유물을 실시간 탐지한다(Lead: Robin De Vries).

- **하드웨어:** MAIVIN 엣지 컴퓨트 모듈(NPU 내장) 기반 카메라. **약 6W**로 작동 → 전용 인프라 없이 표준 선박 전기로 구동. 연속 비디오가 아니라 **간격 기반 스틸 캡처**.
- **탐지:** 엣지에서 5분류(경질 플라스틱·섬유질(로프·어망)·부표·식물·동물) 바운딩박스를 **온디바이스로** 뽑는다.
- **전송:** 전체 프레임이 아니라 **잘린 탐지(cropped detections) + 메타데이터만** 전송 → 대역폭 급감.
- **오프라인-우선 파이프라인:** 엣지 감지 → 로컬 버퍼링 → 입항해 모바일 네트워크 잡히면 기회적 업로드 → AWS(Python/PostgreSQL) 후처리.
- **규모:** 20,000km² 스캔, 2억+ 프레임, **최대 1,000대**까지 확장 설계.

**가져올 것 — 가장 직결.** 이것이 OpenBoom의 엣지 AI 설계 그 자체다([[physical-ai-boom]]의 "시간 동기 멀티모달" + "저전력"). 핵심 3가지:

1. **온디바이스 추론 → 크롭+메타데이터만 송신.** 우리도 붐 카메라 원본 영상을 보내지 않는다. 엣지(Pi5+Hailo, [[opensource-collection-robot]])에서 부유물 바운딩박스만 뽑아 `count_est`·`area_ratio`·`class_dist`로 요약 전송 → 대역폭·비식별([[public-agency-focus]]의 영상 안전) 동시 해결.
2. **6W·표준 전기 = 무동력 실증과 정합.** 우리의 "무동력·저비용" 명분(규제샌드박스·ChangeX)에 ADIS의 6W 사례는 강력한 레퍼런스.
3. **오프라인-우선 버퍼링.** 소하천 현장도 네트워크가 불안정하다. "엣지 버퍼 → 연결 시 기회적 업로드"를 `/api/observations`의 `POST`(JSONL append) 설계에 반영 — 현장 디바이스가 오프라인에 쌓았다가 일괄 전송.

**거를 것.** 1,000대 함대·상업선 탑재는 우리 스케일이 아니다. 우리는 **고정점 1기**라 오히려 유리하다 — 같은 지점을 연속 관측해 인과 시계열을 만든다(움직이는 선박은 못 하는 것).

### 2.3 ADOPT — 위성 탐지 + "ML 편향보정" 24시간 표류 예측

**무엇인가.** EPFL ECEO 주도, SDSC(EPFL·ETH·PSI)·Wageningen·The Ocean Cleanup·ESA 협력. 2년 펀딩 프로젝트(2026 가을 종료 예정).

- **탐지:** Sentinel-2(6일 주기, 10m/픽셀)로 대규모 부유물·windrows(수백 m 길이 띠) 탐지. 보완으로 PlanetScope(매일, 3–5m).
- **표류 예측(핵심):** Christian Donner의 방식 — "널리 쓰이는 풍속·해류 모델에 **기계학습을 얹어 편향을 보정**". 학습 데이터는 Global Drifter Program의 GPS 부표(1990년대~). **탐지 후 24시간 내** 정화팀 도착 시점의 표류 위치를 예측해 **targeted recovery**.
- **한계·보완:** 구름이 광학 센서를 무력화 → Sentinel-1 레이더 통합 검토(투과 가능하나 분광 특성 손실, 현재 미추진). 악천후 미작동.
- **산출물:** 두 시스템 코드 + 논문 2편 **오픈소스 공개**.

**가져올 것.** 우리 `/api/litter-risk`는 현재 "물리 휴리스틱(발생원 × 트랩 × 강우 펄스)" 0단계다([[physical-ai-0stage-impl]]). ADOPT의 교훈은 **"탐지값을 정적 핫스팟에서 멈추지 말고, 환경모델(강우·유속) 위에 ML 편향보정을 얹어 '다음 위치'를 예측하라"**는 것. 소하천판으로 옮기면: **강우 펄스 후 N시간 뒤 하류 어느 퇴적 지점에 쌓일지**를 예측하는 것 — 우리 litter-risk의 1→2단계 자연스러운 진화 방향. "물리모델 + ML 편향보정"은 라벨이 적은 우리 초기 상황에 특히 맞는 패턴(순수 학습형보다 데이터 효율적).

**거를 것.** Sentinel-2 10m 해상도는 **소하천 폭(수 m)에서 무의미**하다 — 위성은 우리 도구가 아니다. 우리의 대응물은 위성이 아니라 **고정 붐의 근접 카메라**이고, 이게 오히려 cm급 해상도라 우위. Global Drifter(외해 부표)도 소하천엔 안 맞고, 우리 대응물은 **자체 IoT 수위·장력 센서 시계열**이다.

### 2.4 DEEP-PLAST — U-Net++ 분할 + Lagrangian 표류, 아키텍처 청사진

**무엇인가.** MDPI *Water* 17(22):3318(흑해). 통합 AI 프레임워크로, 세 모듈을 한 파이프라인에 묶었다:

1. **객체 탐지:** YOLOv5 (UAV 영상).
2. **시맨틱 분할:** U-Net / **U-Net++** (Sentinel-2). → **U-Net++가 최고 성능: F1 = 0.84, 오탐률(FPR) 5.2%.**
3. **표류 시뮬레이션:** 탐지 위치를 **Lagrangian drift 모델**에 연결(Copernicus·NOAA 환경데이터) → 흑해 누적 구역(accumulation zone) 식별.
- **한계(정직):** 표류 검증이 ground truth 부족으로 **정성적 수준**에 머묾 — 향후 현장·NGO 데이터로 보완 예정. 향후 웹툴을 NGO·정책결정자용으로 공개.

**가져올 것.** DEEP-PLAST는 우리가 단계적으로 밟을 **AI 아키텍처의 교과서적 분해**를 보여준다 — `탐지(YOLO) → 분할(U-Net++) → 표류(Lagrangian)`. SEA:CUT 매핑:
- **탐지(YOLO류):** 1기 엣지 카메라의 부유물 바운딩박스 = ADIS와 동일 계층.
- **분할(U-Net++):** 수면 점유 면적(`area_ratio`) 정밀 산출에 분할이 더 정확 — count보다 area가 붐 효율·수거량과 직결.
- **표류(Lagrangian):** 우리 하류 퇴적 예측의 물리 백본. 단 외해 Lagrangian이 아니라 **1차원 하천 유하(routing) 모델**로 치환.

**거를 것.** **F1 0.84는 흑해·위성/UAV 도메인 수치다 — 우리 소하천 성능으로 인용 절대 금지**([[opensource-collection-robot]]의 도메인 갭 경고와 동일). 저자들조차 "표류 검증은 정성적"이라고 정직하게 밝혔다. 우리도 같은 정직성을 유지해야 한다.

### 2.5 INFORMS — 비선형 경로 최적화로 "같은 비용에 60%↑"

**무엇인가.** *Operations Research* 게재(den Hertog/암스테르담대, Pauphilet/런던비즈니스스쿨, Sainte-Rose/The Ocean Cleanup). 2022–2024 연구.

- **방법:** **비선형 경로 최적화 알고리즘**이 동적 환경요인(해류·플라스틱 밀도)을 실시간 분석해 최적 수거 경로를 **초 단위로** 산출. 대규모에서도 빠름.
- **결과:** 1년치 해양조건·밀도 데이터에서 **수거효율 60%↑(운영비 동결)** — 더 짧은 시간에 더 많이. 태평양 운영 소프트웨어에 **이미 통합**.

**가져올 것.** 이건 탐지·예측의 **하류(downstream) 가치 실현** 단계다 — "어디에 쓰레기가 있나"를 알면 다음 질문은 "**어떤 순서·동선으로 걷어야 가장 효율적인가**". SEA:CUT 매핑:
- **시민 수거 동선 최적화:** litter-risk 핫스팟 순위([[physical-ai-0stage-impl]])를 입력으로, "오늘 자원봉사 N명이 어느 구간을 어떤 순서로 도는 게 최대 수거량인가"를 산출. 외해 선박 라우팅의 소하천·도보판.
- **붐 배치·비움 스케줄 최적화:** 강우 펄스 예측 + 퇴적 위험 → "언제·어느 붐을 먼저 비울지"의 출동 우선순위(우리 자율성 사다리 레벨1 "예측적 비움·출동"과 정확히 일치, [[physical-ai-boom]]).

**거를 것.** **"60%"는 외해 선박 라우팅 수치다 — 우리 사례에 직접 붙이지 않는다.** 가져오는 건 "탐지·예측을 운영 최적화로 닫으면 같은 비용에 회수량이 는다"는 **구조적 명제**뿐.

---

## 3. 교차 패턴 — 5건에서 반복되는 4가지 설계 원리

1. **탐지는 끝이 아니라 입력이다.** 5건 모두 탐지에서 멈추지 않는다 — ADOPT·DEEP-PLAST는 표류 예측으로, INFORMS는 경로 최적화로 닫는다. **우리 litter-risk도 "핫스팟 표시"에서 멈추면 절반이다.** 표류(이동)·수거(동선)까지 닫아야 가치가 실현된다.
2. **오프라인-우선 + 메타데이터만 전송 = 경제성·프라이버시 동시 해결.** ADIS의 크롭+메타데이터(6W)는 우리 무동력·비식별 명분과 완벽 정합.
3. **오픈데이터·오픈소스가 신뢰와 정책의 통로다.** PlasticPirates(Zenodo·EMODnet), ADOPT(오픈소스), DEEP-PLAST(NGO 웹툴)가 모두 공개로 정책·NGO에 연결됐다. SEA:CUT의 공공 보완 포지셔닝([[public-agency-focus]])과 같은 논리 — **데이터를 열어 행안부·NDMI 880개 소하천 플랫폼의 공백을 메우는 통로**로 쓴다.
4. **"한 조직 풀스택" — 데이터가 다음 단계의 연료.** The Ocean Cleanup이 데이터→탐지→예측→최적화를 한 루프로 묶은 것이 핵심 해자. 우리의 `/api/observations → /api/litter-risk → /api/observations/anchor` 학습 루프가 바로 이 구조의 소하천판이다([[physical-ai-0stage-impl]]).

---

## 4. SEA:CUT 코드·자산에 매핑 — 지금 무엇을 바꾸나

| 벤치마크 | 출처 | 우리 적용 지점 | 변경 내용 |
|----------|------|----------------|-----------|
| 사진 검증으로 시민 데이터 승격 | PlasticPirates | `SeacutObservation` 스키마(`src/lib/observation.ts`) | `photo_verified: boolean` 필드 추가, 수거 활동을 라벨 생산으로 |
| 크롭+메타데이터만 전송 | ADIS | 엣지 디바이스 ↔ `POST /api/observations` | 원본 영상 미전송, 바운딩박스→`count_est`/`area_ratio`/`class_dist` 요약 |
| 오프라인-우선 버퍼링 | ADIS | `/api/observations` JSONL append | 현장 오프라인 누적 → 연결 시 일괄 업로드 |
| 물리모델+ML 편향보정 표류예측 | ADOPT | `/api/litter-risk` 1→2단계 | 강우 펄스 후 N시간 하류 퇴적 위치 예측(편향보정형) |
| 분할(U-Net++)로 면적 정밀화 | DEEP-PLAST | `area_ratio` 산출 | count 중심 → area 중심(수거량 직결) 전환 검토 |
| 비선형 경로 최적화 | INFORMS | 신규 — 수거 동선·붐 비움 스케줄러 | litter-risk 핫스팟 → 자원봉사 동선/출동 우선순위 산출 |

이 표 자체가 **로드맵 한 장**이다 — 위 3개(스키마·전송·버퍼링)는 즉시 저비용, 아래 3개(표류예측·분할·경로최적화)는 라벨이 쌓인 뒤 1→2단계.

---

## 5. 거를 것 · 정직 경계 (중요)

- **위성은 우리 도구가 아니다.** Sentinel-2 10m 해상도는 폭 수 m 소하천에서 무의미. 우리 대응물은 위성이 아니라 **고정 붐 근접 카메라**(cm급). 위성 사례는 *방법론*만 빌리고 *도구*는 버린다.
- **타 도메인 성능 수치 직접 인용 금지.** "60%↑"(외해 선박 라우팅), "F1 0.84"(흑해 위성/UAV)는 **우리 소하천 성능으로 쓰지 않는다**. 인용 시 반드시 "외해/위성 사례" 출처 명시. 이는 [[opensource-collection-robot]]의 도메인 갭, [[maritime-csv-funding]]의 "직접 귀속 금지"와 같은 규율.
- **표류 검증은 그들도 정성적이다.** DEEP-PLAST 저자가 "ground truth 부족으로 정성적"이라 명시. 우리 표류·퇴적 예측도 라벨이 쌓이기 전엔 "학습 모델 아님(휴리스틱)" 프레임을 유지([[physical-ai-0stage-impl]]).
- **풀스택을 한 번에 흉내 내지 않는다.** The Ocean Cleanup은 자원·연식이 다르다. 우리는 **학습 루프 구조**만 베끼고, 단계는 0→1→2로 정직하게 밟는다.

---

## 6. 한국 소하천·하구 정합 — 우리 위치가 오히려 우위

- **발생원 근접.** 외해 사례는 이미 흩어진 쓰레기를 쫓는다. 우리는 **하천 상류 차단점**에서 잡는다 — 발생원에 가깝고, 회수 단위 비용이 낮다(육상기인 부유물의 낙동강 하구 정렬, [[busan-marine-policy-outreach]]).
- **고정점 = 연속 인과 시계열.** 움직이는 선박·궤도 위성은 같은 지점을 연속 관측 못 한다. **고정 붐은 같은 단면을 24시간 시계열로** 본다 — physical AI 해자(인과·폐루프 데이터)의 이상적 조건([[physical-ai-boom]]).
- **좁은 강폭 = 고해상도.** 위성 10m가 불가능한 cm급 성상 분류가 근접 카메라로 가능 → DEEP-PLAST 분할의 소하천판이 오히려 더 정밀.
- **공공 공백 정렬.** 행안부·NDMI 880개 소하천 플랫폼이 비운 "영상 안전 + 부유물 포집"을, 위 벤치마크의 오픈데이터 논리로 메운다([[public-agency-focus]], [[cctv-data-collab-model]]).

---

## 7. 즉시 반영 가능한 3가지 (저비용·이번 분기)

1. **시민 관측 공통 프로토콜 + 사진 검증 채택.** PlasticPirates 4팀 모델을 1기 시민 수거에 이식, `photo_verified` 필드 추가 → 수거가 곧 라벨 생산.
2. **엣지 "크롭+메타데이터" 전송 스키마 확정.** ADIS 패턴으로 원본 영상 미전송 원칙을 문서·스키마에 명문화(비식별 + 대역폭 + 무동력 명분 동시 충족).
3. **litter-risk 로드맵에 "표류·경로" 다음 단계 명시.** ADOPT(표류)·INFORMS(경로)를 `/api/litter-risk`의 1→2단계 목표로 PLAN.md에 박아, "탐지에서 멈추지 않는다"는 설계 원리를 공식화.

---

## 8. 리스크와 미해결

- **도메인 갭.** 5건 모두 외해/위성/UAV 도메인 — 소하천 근접 영상으로 곧장 전이 안 됨. 자체 현장 라벨이 결국 답([[opensource-collection-robot]]).
- **라벨 부족.** 우리 표류·경로 최적화는 수거 중량 앵커(`collected_mass_kg`)가 충분히 쌓여야 학습형으로 전환 — 현재는 휴리스틱.
- **위성 비교의 함정.** "우리도 AI로 쓰레기 본다"를 위성 사례와 동급으로 홍보하면 과대포장. 우리 강점은 **위치(상류 차단)와 연속성(고정 시계열)**이지 위성 해상도가 아니다.
- **경로 최적화의 조기 도입 위험.** 수거 단위가 작을 때(시민 1~2팀) 60%식 최적화는 과잉 — 데이터·규모가 임계점을 넘은 뒤 도입.

---

## 9. 즉시 행동 (다음 스텝)

1. `src/lib/observation.ts`에 `photo_verified` 필드 추가 + 스키마 문서([[physical-ai-0stage-impl]]) 갱신.
2. PLAN.md에 "탐지→표류→경로" 풀스택 로드맵(0→1→2단계)을 4장 표로 반영.
3. ADIS "크롭+메타데이터 전송" 원칙을 엣지 설계 문서([[opensource-collection-robot]])에 명문화.
4. ChangeX·규제샌드박스 소구문에 "글로벌 풀스택(The Ocean Cleanup)의 소하천·시민판" 한 줄 포지셔닝 추가 — 단 외해 수치 직접 인용 금지([[public-agency-focus]]).

---

## 출처 (대표 — 의뢰인 제공 링크, 2026-06-30 직접 확인)

1. PlasticPiratesEU — The European Sting, "Teen scientists are tracking plastic pollution across Europe's rivers" (2026-06-29). https://europeansting.com/2026/06/29/teen-scientists-are-tracking-plastic-pollution-across-europes-rivers-2/
2. ADIS / The Ocean Cleanup — Frontier Enterprise, "How distributed edge AI is reshaping ocean plastic monitoring". https://www.frontier-enterprise.com/how-distributed-edge-ai-is-reshaping-ocean-plastic-monitoring/
3. ESA ADOPT — Surfer, "AI Satellites Track Ocean Plastic Cleanup" (2026-04). 보강: EPFL Actu "AI helps marine scientists track floating debris from space". https://actu.epfl.ch/news/ai-helps-marine-scientists-track-floating-debris-2/
4. DEEP-PLAST — *Water* (MDPI) 17(22):3318, "Empowering Sustainability Through AI-Driven Monitoring: The DEEP-PLAST Approach…". https://doi.org/10.3390/w17223318
5. INFORMS — *Operations Research*, "Optimizing the Path Towards Plastic-Free Oceans". 보도: INFORMS/EurekAlert/Phys.org (2025-04). https://pubsonline.informs.org/doi/10.1287/opre.2023.0515

**내부 교차참조:** [[physical-ai-boom]] · [[physical-ai-0stage-impl]] · [[opensource-collection-robot]] · [[public-agency-focus]] · [[maritime-csv-funding]] · [[cctv-data-collab-model]] · [[busan-marine-policy-outreach]]
