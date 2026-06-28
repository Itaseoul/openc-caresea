// 데모(샘플) 데이터 — 공공 API 키 활성화 전 UI 빌드/렌더용.
// 실제 응답 스키마와 동일 형태(getUltraSrtNcst obsrValue / getVilageFcst fcstValue / OA-1167 row).
// ★키가 들어오면 라우트가 실데이터로 전환. 이 값은 임의 샘플(비 오는 상황 가정)이며 실측 아님.

export const DEMO_NCST = [
  { category: "PTY", obsrValue: "1" }, // 강수형태 1=비
  { category: "RN1", obsrValue: "2.5" }, // 최근 1시간 강수량(mm)
  { category: "T1H", obsrValue: "21.0" },
  { category: "REH", obsrValue: "88" },
  { category: "WSD", obsrValue: "2.1" },
];

export const DEMO_FCST = [
  { category: "POP", fcstDate: "-", fcstTime: "1500", fcstValue: "80" },
  { category: "PTY", fcstDate: "-", fcstTime: "1500", fcstValue: "1" },
  { category: "PCP", fcstDate: "-", fcstTime: "1500", fcstValue: "3.0mm" },
  { category: "SKY", fcstDate: "-", fcstTime: "1500", fcstValue: "4" },
  { category: "TMP", fcstDate: "-", fcstTime: "1500", fcstValue: "22" },
  { category: "POP", fcstDate: "-", fcstTime: "1800", fcstValue: "30" },
  { category: "PTY", fcstDate: "-", fcstTime: "1800", fcstValue: "0" },
  { category: "PCP", fcstDate: "-", fcstTime: "1800", fcstValue: "강수없음" },
];

export function demoKma(type: string) {
  return type === "ncst" ? DEMO_NCST : DEMO_FCST;
}

export const DEMO_SEOUL = [
  {
    river: "홍제천",
    station: "사천교(데모)",
    gu: "서대문구",
    level: 0.42,
    controlLevel: 2.5,
    planFloodLevel: 15.3,
    collectedAt: "DEMO",
  },
];
