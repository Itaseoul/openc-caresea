// 17개 시도 소하천 정비율 데이터 — server/client 양쪽에서 안전하게 import 가능
// 출처: 행정안전부 · 더불어민주당 한병도 의원실(2024). 평균 46.5%.
// 미확보 7곳(부산·대구·경기·경북·경남·제주·세종)은 "확인 중"으로 표기.

export type SohaRow = { name_eng: string; label: string; pct: number | null };

export const SOHA_DATA: SohaRow[] = [
  { name_eng: "Seoul", label: "서울", pct: 79.1 },
  { name_eng: "Gangwon-do", label: "강원", pct: 59.0 },
  { name_eng: "Ulsan", label: "울산", pct: 46.4 },
  { name_eng: "Chungcheongbuk-do", label: "충북", pct: 46.0 },
  { name_eng: "Daejeon", label: "대전", pct: 45.7 },
  { name_eng: "Jeollanam-do", label: "전남", pct: 38.4 },
  { name_eng: "Chungcheongnam-do", label: "충남", pct: 35.0 },
  { name_eng: "Jeollabuk-do", label: "전북", pct: 34.4 },
  { name_eng: "Incheon", label: "인천", pct: 31.9 },
  { name_eng: "Gwangju", label: "광주", pct: 11.5 },
  { name_eng: "Busan", label: "부산", pct: null },
  { name_eng: "Daegu", label: "대구", pct: null },
  { name_eng: "Sejongsi", label: "세종", pct: null },
  { name_eng: "Gyeonggi-do", label: "경기", pct: null },
  { name_eng: "Gyeongsangbuk-do", label: "경북", pct: null },
  { name_eng: "Gyeongsangnam-do", label: "경남", pct: null },
  { name_eng: "Jeju-do", label: "제주", pct: null },
];

// 정비율 구간별 색상 — 지도(코로플레스)와 막대 목록이 동일 색계를 공유
export function colorFor(pct: number | null): string {
  if (pct == null) return "#cbd5e1";
  if (pct < 30) return "#dc2626";
  if (pct < 40) return "#f97316";
  if (pct < 50) return "#eab308";
  if (pct < 70) return "#0ea5e9";
  return "#1d4ed8";
}

export const LEGEND: { label: string; color: string }[] = [
  { label: "30% 미만", color: "#dc2626" },
  { label: "30~39%", color: "#f97316" },
  { label: "40~49%", color: "#eab308" },
  { label: "50~69%", color: "#0ea5e9" },
  { label: "70% 이상", color: "#1d4ed8" },
  { label: "확인 중", color: "#cbd5e1" },
];
