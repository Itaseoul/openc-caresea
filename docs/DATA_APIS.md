# 데이터 API 명세 (실측 검증)

> 2026-06-27/28 curl·HTTP 헤더 프로빙으로 검증. [추정]은 명시. 라우트 구현의 단일 출처.

## CORS 실측 요약 (★제 앞 설명 정정)
| 호스트 | ACAO | 브라우저 직접 | 비고 |
|---|---|---|---|
| `apis.data.go.kr` (기상청 단기예보·특보 구버전) | `*` | **가능** | serviceKey URL 노출 → 프록시 권장 |
| `api.hrfco.go.kr` (한강홍수통제소) | `*` | **가능** | 키가 등록 URL/IP에 바인딩 |
| `openapi.seoul.go.kr:8088` (서울 OA-1167/1168) | — | http:8088 mixed-content 제약 | 프록시 권장 |
| `apihub.kma.go.kr` (기상청 API허브) | 없음 | **불가** | 프록시 필수 |

→ 결론: **CORS는 되는 곳이 많다(제 "무조건 불가"는 틀림)**. 다만 키 노출·mixed-content·IP바인딩 때문에 **얇은 프록시(Next.js API route)가 정석**. 본 프로젝트는 `/api/*`로 통일.

## 1. 기상청 단기예보 (data.go.kr 15084084) — ①예보 ②실황 [구현: /api/kma]
- 신청: https://www.data.go.kr/data/15084084/openapi.do · serviceKey 자동승인, **활성화 1~24h 시차**
- 베이스: `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0`
- 오퍼레이션:
  - `getUltraSrtNcst` 초단기실황(지금): 매시 정시 관측, ~40분 제공. 필드 `RN1`(1h 강수량) `PTY`(0없음/1비/2비눈/3눈/4소나기) `T1H` `REH`
  - `getVilageFcst` 단기예보(글피까지): 1일 8회 02·05·08·11·14·17·20·23시. 필드 `POP`(강수확률%) `PTY` `PCP`(1h 강수량, 문자열 "강수없음"/"1.0mm"/"30.0~50.0mm"/"50.0mm 이상") `SKY`(1맑3구름많4흐림) `TMP`
  - `getUltraSrtFcst` 초단기예보(+6h): 매시 30분 발표
- 격자: 사천교 nx=59 ny=127 / 학장천 nx=96 ny=75 (grid.ts, ±1칸 가능→운영 전 고정)
- 트래픽: 개발 10,000건/일. CORS `*`(브라우저 가능, 키노출→프록시)

## 2. 한강홍수통제소 (api.hrfco.go.kr) — ④수위 ③홍수특보 ②강우 [TODO: /api/hrfco]
- 신청: https://www.hrfco.go.kr/web/openapiPage/reference.do · 키관리 http://www.hrfco.go.kr/web/openapi/CertifyKeyMgr.do · ★**hrfco 자체 발급**(data.go.kr와 별개), 신청 폼 불안정 시 **전화 02-590-9999**. ★키가 **등록 URL/IP 바인딩** → 배포 도메인/IP 등록 필요
- 엔드포인트(키는 path):
  - 수위 10분: `https://api.hrfco.go.kr/{KEY}/waterlevel/list/_10M/{관측소코드}/{시작}/{종료}.json`
  - 수위 최신 전체: `…/waterlevel/list/_10M.json`
  - 강우 10분: `…/rainfall/list/_10M/{코드}.json`
  - 홍수특보: `…/fldfct/list.json`
  - 관측소 메타: `…/waterlevel/info.json`
- 필드: `WL`(수위m) `YMDHM` `FW`(유량) **`ATTWL`(주의)·`WRNWL`(경계/경보)·`ALMWL`(위험)·`SRSWL`(심각/계획홍수위)** ← 통제 임계. 특보: `KIND`·`OBSNM`·`FCTDT`
- 갱신: 한강권역 7~8분. CORS `*`(브라우저 가능). 트래픽 1분 1,000건(초과 3회 누적=차단)
- ★**홍제천 사천교 코드 = 미확정**. 확정경로: (a) data.go.kr 15117648 파일데이터에서 하천명='홍제천' 행, (b) 키 발급 후 `waterlevel/info`로 매칭. ★소하천이라 **hrfco 수위관측소가 없을 수 있음** → 없으면 서울 OA-1167(아래) 또는 인근 본류/중랑천 대용 + 현장 CCTV. 신청 직후 코드 존재여부 확인이 다음 액션

## 3. 서울 하천 수위현황 (data.seoul.go.kr OA-1167) — ④수위 [구현: /api/seoul]
- 신청: https://data.seoul.go.kr/dataList/OA-1167/S/1/datasetView.do · 인증키 즉시발급(자동)
- 엔드포인트: `http://openapi.seoul.go.kr:8088/{KEY}/json/ListRiverStageService/1/25/` (테스트 `{KEY}`=`sample`, 5건 제한)
- 필드: `RVR_NM` `WATG_NM` `RLTM_RVR_WATL_CNT`(수위m) **`CNTRL_WATL`(통제수위m, ★0.0=미설정 주의)** `PLAN_FLDE`(계획홍수위) `GU_OFC_NM` `DTRSM_DATA_CLCT_TM`
- 실데이터(2026-06-28): `홍제천|성산2교 11.75m 통제0.0`, `불광천|증산교 6.8 통제9.2`. 전체 21개소
- 갱신 10분. CORS `*`(단 http:8088 mixed-content→프록시). ★라이선스 **공공누리 2유형(상업이용 금지)**=출처표시 필요. ★사천교 수위계 코드는 실키로 21개소 조회해 확정 TODO

## 4. 기상청 특보 (data.go.kr) — ③호우특보=철거 트리거 [TODO: /api/wrn]
- ★권장 = **구버전 15000415**(`apis.data.go.kr/1360000/WthrWrnInfoService/...`, CORS `*`, serviceKey 자동승인). 신규 15139476은 apihub 리다이렉트(**CORS 없음·휴대폰 등록 필수**)라 프록시 운영 시에만
- 오퍼레이션: `getWthrWrnList`(특보목록)·`getWthrWrnMsg`(통보문). 파라미터 `stnId`(서울 109)·`fromTmFc`·`toTmFc`(YYYYMMDD)
- 필드: 특보종류(**호우주의보/경보**)·발표/해제시각·구역(서대문구 포함)·단계. 실시간 갱신
- 동일 `KMA_SERVICE_KEY` 사용 가능

## 5. 보조 — 서울 강우(OA-1168)·WAMIS·홍수CCTV
- 서울 강우량 OA-1168 `ListRainfallService`: 47개소 10분 누적, 서대문구 단위. ★CC BY-NC. 최근 31일만. (②보강, 선택)
- WAMIS(wamis.go.kr): 홍제천 코드 탐색용(hrfco에 코드 없을 때). 문의 070-5159-3108
- 홍수정보시스템 n.flood.go.kr: 수위 **CCTV** → 현장 접근안전 시각확인에 직접 유용(API보다 화면)

## 즉시 신청 순서 (시차·사람손 리스크 순)
1. **hrfco 키 신청(+전화)** → 직후 `waterlevel/info`로 홍제천 사천교 코드 존재여부 확인 (사람손 가능=최우선)
2. **data.go.kr serviceKey 1개** → 단기예보(15084084)+특보 구버전(15000415) 동시 활용신청 (자동, 1~24h 시차)
3. **서울 OA-1167 인증키**(즉시) → 사천교 수위계 코드 확정
4. 격자 nx/ny 고정 + 프록시 도메인 hrfco 등록
5. ⑤ 적재(10분 폴링→DB) + ⑥ 알림(PTY=0 전환 카운터=촬영윈도우 / 호우특보=철거)

## 부산 학장천 확장
hrfco 동일 OpenAPI로 낙동강권역 커버(코드만 교체, 갱신 11분+). 기상청·특보는 부산 격자(nx96 ny75)·구역코드만 교체. 서울 OA-1167은 서울 전용→부산은 hrfco 또는 부산 데이터.
