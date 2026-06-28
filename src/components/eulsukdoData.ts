// 을숙도 하구 실증 후보지 — 사이트/후보 좌표 + 규제·맥락 (server/client 공용)
// 좌표 신뢰도: '을숙도 중심'만 Wikidata 1차 검증. 나머지는 오리엔테이션용 '대략' 좌표이며,
// 정확한 위치는 VWorld 항공영상·RIMGIS 하천구역으로 현장 검증해야 함.

export type Site = {
  id: string;          // 핀 라벨(번호/문자)
  lat: number;
  lng: number;
  color: string;
  name: string;
  desc: string;
  approx: boolean;     // true면 '대략' 좌표
};

// 확인/지형 핀 (1~4)
export const SITES: Site[] = [
  {
    id: "1",
    lat: 35.0972,
    lng: 128.9403,
    color: "#2563eb",
    name: "을숙도 중심",
    desc: "낙동강 하중도(삼각주 모래섬) · 사하구 하단동 · 검증 좌표(Wikidata)",
    approx: false,
  },
  {
    id: "2",
    lat: 35.1083,
    lng: 128.9357,
    color: "#475569",
    name: "낙동강하굿둑",
    desc: "을숙도 북부를 횡단(하단동–을숙도–명지동) · 둑 북=담수호, 남=바다 · K-water 관리",
    approx: true,
  },
  {
    id: "3",
    lat: 35.1055,
    lng: 128.943,
    color: "#16a34a",
    name: "낙동강하구에코센터",
    desc: "1차 거버넌스 파트너 · 부산시 낙동강관리본부(을숙도 내, ☎051-209-2000)",
    approx: true,
  },
  {
    id: "4",
    lat: 35.06,
    lng: 128.925,
    color: "#0ea5e9",
    name: "낙동강 하구(바다 경계)",
    desc: "강·바다가 만나는 지점(섬 남쪽) · 본류 하구는 국가하천",
    approx: true,
  },
];

// 설치 후보 '유형' (A·B) — 모두 검토 단계, 현장조사·인허가 선결
export const CANDIDATES: Site[] = [
  {
    id: "A",
    lat: 35.115,
    lng: 128.94,
    color: "#b45309",
    name: "후보A · 하굿둑 상류 정체구간",
    desc: "담수호 측 흐름 정체로 부유물 자연 집적 → 포집형 붐 후보(검토)",
    approx: true,
  },
  {
    id: "B",
    lat: 35.103,
    lng: 128.96,
    color: "#b45309",
    name: "후보B · 소하천 합류부(하단 일대)",
    desc: "괴정천·당리천 → 낙동강 본류 유입부 · '발생원 차단' 관점(검토·대략)",
    approx: true,
  },
];

// 4중 중첩 규제 (검증됨)
export const REGS: { law: string; name: string; since: string }[] = [
  { law: "자연유산법", name: "천연기념물 제179호 「낙동강 하류 철새 도래지」(을숙도 포함)", since: "1966.7.23" },
  { law: "습지보전법", name: "낙동강하구 습지보호지역(환경부)", since: "1999" },
  { law: "국토계획법", name: "자연환경보전지역(용도지역)", since: "1988" },
  { law: "해양환경관리법", name: "특별관리해역", since: "1982" },
];

// 국내 지도·데이터 자원
export const MAP_LINKS: { label: string; url: string; note: string }[] = [
  { label: "VWorld 항공정사영상", url: "https://map.vworld.kr/map/maps.do", note: "국내 최고해상도 · 섬·수로 지형 파악" },
  { label: "RIMGIS 하천관리지리정보", url: "https://www.river.go.kr/map/rimMap.do", note: "하천구역 경계(점용허가 판단 직결)" },
  { label: "국토정보플랫폼", url: "https://map.ngii.go.kr/", note: "과거↔현재 영상 비교" },
  { label: "WAMIS 수자원정보", url: "https://www.wamis.go.kr/", note: "수위·유량 시계열" },
  { label: "물환경정보시스템", url: "https://water.nier.go.kr/web", note: "수질·녹조·퇴적물" },
  { label: "카카오맵(을숙도)", url: "https://map.kakao.com/?q=을숙도", note: "스카이뷰(항공) 토글" },
];
