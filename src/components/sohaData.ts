// 17개 시도 소하천 정비율 데이터 — server/client 양쪽에서 안전하게 import 가능
// 출처: 행정안전부 『2024 행정안전통계연보』(2023.12.31 기준) p.305 「7-1-3-1 지역별 소하천 정비」.
// 전국 22,099개소·55,679km, 평균 정비율 46.5%. 17개 시도 전부 실측값 확보.
// 참고: 동일 데이터가 한병도 의원실(2024 국정감사) 보도자료로도 인용됨.

export type SohaRow = { name_eng: string; label: string; pct: number | null };

export const SOHA_DATA: SohaRow[] = [
  { name_eng: "Seoul", label: "서울", pct: 79.1 },
  { name_eng: "Jeju-do", label: "제주", pct: 67.5 },
  { name_eng: "Daegu", label: "대구", pct: 61.6 },
  { name_eng: "Gangwon-do", label: "강원", pct: 58.9 },
  { name_eng: "Busan", label: "부산", pct: 57.0 },
  { name_eng: "Gyeonggi-do", label: "경기", pct: 54.5 },
  { name_eng: "Gyeongsangbuk-do", label: "경북", pct: 51.3 },
  { name_eng: "Sejongsi", label: "세종", pct: 47.5 },
  { name_eng: "Chungcheongbuk-do", label: "충북", pct: 46.7 },
  { name_eng: "Ulsan", label: "울산", pct: 46.4 },
  { name_eng: "Gyeongsangnam-do", label: "경남", pct: 45.9 },
  { name_eng: "Daejeon", label: "대전", pct: 45.7 },
  { name_eng: "Jeollanam-do", label: "전남", pct: 38.4 },
  { name_eng: "Chungcheongnam-do", label: "충남", pct: 35.0 },
  { name_eng: "Jeollabuk-do", label: "전북", pct: 34.4 },
  { name_eng: "Incheon", label: "인천", pct: 31.9 },
  { name_eng: "Gwangju", label: "광주", pct: 11.5 },
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
];
