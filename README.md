# openc.caresea.kr — SEA:CUT 우기 알림 사이트

우기 SPOF 대응 대시보드. 강수 예보·실황·호우특보·하천 수위를 한 화면에 모아, 촬영 윈도우(비 직후 24~48h)와 철거 트리거(호우특보·통제수위)를 알린다. 계획은 [PLAN.md](./PLAN.md).

## 빠른 시작 (VS Code)
```bash
npm install
cp .env.example .env.local   # 키 채우기 (Windows: copy .env.example .env.local)
npm run dev                  # http://localhost:3000
```

## 키 (.env.local)
- `KMA_SERVICE_KEY` — data.go.kr 기상청 단기예보/특보 인증키. ★"Decoding(일반)" 키를 넣을 것(코드가 인코딩 처리). `NEXT_PUBLIC_` 접두사 금지(서버 전용).
- `HRFCO_KEY` — 한강홍수통제소 api.hrfco.go.kr 키 (수위). M1에서 사용.
- `SEOUL_KEY` — data.seoul.go.kr 인증키 (OA-1167 하천수위). M1에서 사용.

## CORS·키 원칙
브라우저는 우리 `/api/*`(동일 출처)만 호출 → CORS 무관. `/api/*`(Next.js route)가 서버에서 키와 함께 공공 API를 호출 → 키 노출 0. 절대 클라이언트에서 공공 API를 직접 부르지 말 것.

## 동작 확인 (M0)
`npm run dev` 후 메인 페이지가 `/api/kma?type=ncst&lat=37.5705&lng=126.9197`(사천교)를 호출해 현재 강수형태·기온·강수량을 표시하면 파이프라인 정상. 키 미설정 시 안내 메시지 표시.

## 배포
PLAN.md §4 참고. 권장=Vercel(커스텀 도메인 `openc.caresea.kr` 연결, env 시크릿).
