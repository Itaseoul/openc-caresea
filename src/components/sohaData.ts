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
