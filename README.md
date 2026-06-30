# openc.caresea.kr — SEA:CUT 우기 알림 사이트

우기 SPOF 대응 대시보드. 강수 예보·실황·호우특보·하천 수위를 한 화면에 모아, 촬영 윈도우(비 직후 24~48h)와 철거 트리거(호우특보·통제수위)를 알린다. 여기에 더해, OpenBoom을 물 위 데이터 공장으로 보는 **physical AI 데이터 루프(탐지→표류→경로)**를 0단계로 구현했다(아래 §physical AI 데이터 루프, 상세 [PLAN.md §10](./PLAN.md)). 계획은 [PLAN.md](./PLAN.md).

## 빠른 시작 (VS Code)
```bash
npm install
cp .env.example .env.local   # 키 채우기 (Windows: copy .env.example .env.local)
npm run dev                  # http://localhost:3000
```

## 키 (.env.local)
공공 API 키(시크릿, 서버 전용 — `NEXT_PUBLIC_` 접두사 금지):
- `KMA_SERVICE_KEY` — data.go.kr 기상청 단기예보/특보/부산 강우. ★"Decoding(일반)" 키(코드가 인코딩 처리).
- `HRFCO_KEY` — 한강홍수통제소 api.hrfco.go.kr 수위.
- `SEOUL_KEY` — data.seoul.go.kr OA-1167 하천수위.
- `ITS_KEY` — 국가교통정보센터 CCTV 스트림(`/api/cctv`).
- `KHOA_KEY` — 국립해양조사원 조위(하구 핫스팟 조석 트랩 보강). 없으면 정적 중립값.

physical AI 적재 경로(선택, 미설정 시 응답만 반환·적재 생략):
- `OBS_SINK_PATH` · `DRIFT_SINK_PATH` — 관측·드리프터 레코드 JSONL 적재 경로. 서버리스(Vercel)는 휘발성 → 영속은 DB/Blob.

지도 타일 키(공개 전제 — `NEXT_PUBLIC_*` 허용, 도메인 바인딩. 없으면 CARTO 심플·지형으로 동작):
- `NEXT_PUBLIC_VWORLD_KEY` · `NEXT_PUBLIC_MAPBOX_TOKEN` — NakdongMap 베이스맵.

## CORS·키 원칙
브라우저는 우리 `/api/*`(동일 출처)만 호출 → CORS 무관. `/api/*`(Next.js route)가 서버에서 키와 함께 공공 API를 호출 → 키 노출 0. 절대 클라이언트에서 공공 API를 직접 부르지 말 것.

## physical AI 데이터 루프 (관측·예측·검증)
우기 알림(M0–M3)을 넘어 OpenBoom을 데이터 공장으로 보는 0단계 루프(상세 [PLAN.md §10](./PLAN.md)·M4). 전부 휴리스틱·약지도 단계(라벨 0, 학습형 아님).

| 엔드포인트 | 역할 |
|---|---|
| `GET·POST /api/observations` | 관측 레코드(표준 스키마) 조립·검증·적재 |
| `POST /api/observations/anchor` | 수거 중량(정답) 앵커 결합 — "얼마나" |
| `GET /api/litter-risk` | 하류 퇴적 위험 예측(발생원 × 트랩 × first-flush) 핫스팟 순위 |
| `POST·GET /api/observations/drift` | GPS 드리프터 궤적 적재(이동거리 자동계산) — "어디로" |
| `GET /api/litter-risk/validate` | 드리프터 종점 ↔ 예측 핫스팟 폐루프 검증 |

화면: 홈 "데이터 루프" 섹션(라이브 예측 + 드리프터 검증)과 지도(NakdongMap)의 위험 후광 오버레이. 적재·검증을 켜려면 `OBS_SINK_PATH`·`DRIFT_SINK_PATH` 설정.

## 동작 확인 (M0)
`npm run dev` 후 메인 페이지가 `/api/kma?type=ncst&lat=37.5705&lng=126.9197`(사천교)를 호출해 현재 강수형태·기온·강수량을 표시하면 파이프라인 정상. 키 미설정 시 안내 메시지 표시.

## 배포
PLAN.md §4 참고. 권장=Vercel(커스텀 도메인 `openc.caresea.kr` 연결, env 시크릿).
