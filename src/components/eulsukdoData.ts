// 을숙도 하구 실증 후보지 — 사이트/후보/물길/규제 데이터 (server/client 공용)
// 좌표 신뢰도: '을숙도 중심'만 Wikidata 1차 검증. 나머지는 지명·지형 기반 '대략' 좌표(측량값 아님).
// 정확한 위치·하천구역·하폭은 VWorld 항공영상·RIMGIS 하천대장·정보공개청구로 현장 검증해야 함.

export type Site = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  name: string;
  desc: string;
  approx: boolean;
};

// 지형/오리엔테이션 핀 (1~5)
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
    lat: 35.107,
    lng: 128.952,
    color: "#475569",
    name: "낙동강하굿둑(동측 구수문)",
    desc: "을숙도 북부 횡단(하단–을숙도–명지) · 둑 북=담수호, 남=바다 · K-water 관리 · 좌표 OSM 추정",
    approx: true,
  },
  {
    id: "3",
    lat: 35.1065,
    lng: 128.9431,
    color: "#16a34a",
    name: "낙동강하구에코센터",
    desc: "1차 거버넌스 파트너 · 부산시 낙동강관리본부(을숙도 내, ☎051-209-2000) · 좌표 Wikidata",
    approx: false,
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
  {
    id: "5",
    lat: 35.06719,
    lng: 128.87453,
    color: "#7c3aed",
    name: "하구 사주 무인도서(진우도)",
    desc: "실측 집적지 — 해양환경공단 약 2개월 501톤 수거 · 구성 약 86% 대형 목재류 · 좌표 OSM",
    approx: false,
  },
];

// 설치 후보 '유형' (A·B·C) — 모두 검토 단계, 현장 관측·인허가 선결
export const CANDIDATES: Site[] = [
  {
    id: "A",
    lat: 35.11,
    lng: 128.95,
    color: "#b45309",
    name: "후보A · 하굿둑 동측 수문 상류면",
    desc: "바다로 빠지기 직전 '마지막 길목'(발생원 차단 논리 최상위) · 규모·시의성 최상이나 난이도 높고 수문 앞 집적 관측자료 없음 + 보호구역 가능성 → K-water 수거일지·국가유산청 선확인",
    approx: true,
  },
  {
    id: "B",
    lat: 35.0793,
    lng: 128.951,
    color: "#b45309",
    name: "후보B · 장림천 하구(장림포구)",
    desc: "폭 좁은 제방형 수로의 단일 배출구 → 물리적으로 가장 현실적 · 단 전체 부유물 비중은 미상 · 좌표 OSM(장림포구)",
    approx: true,
  },
  {
    id: "C",
    lat: 35.1049,
    lng: 128.9633,
    color: "#b45309",
    name: "후보C · 괴정천 하단 개거 하구",
    desc: "사하구 유일 지방하천의 개방 하구(복원 개거 폭 40→46m) · 점용허가 주체가 시·구로 단순 · 좌표는 복개 종점(실 방류구 더 서측)",
    approx: true,
  },
];

// 유형별 물길 표 — 바다/낙동강 본류로 유입 (출처: 부산하천지원센터 하천현황·사하구 지역기본자료·RIMGIS)
export type StreamRow = {
  name: string;
  grade: string;     // 법정등급
  width: string;     // 하폭 유형
  outlet: string;    // 유입처
  conf: "상" | "중" | "하";
};

// 사하구 권역(동낙동강 = 낙동강 본류 수계)
export const STREAMS_SAHA: StreamRow[] = [
  { name: "낙동강 본류(동낙동강)", grade: "국가하천", width: ">10m", outlet: "남해(하굿둑 경유)", conf: "상" },
  { name: "괴정천", grade: "지방하천", width: "복원개거 40→46m / 복개 미상", outlet: "낙동강 본류 하구(하단)", conf: "상" },
  { name: "당리천", grade: "기타하천(미지정·복개)", width: "≤5m 추정", outlet: "괴정천 합류→낙동강", conf: "중" },
  { name: "장림천", grade: "기타하천(미지정)", width: "≤10m 추정", outlet: "낙동강 하구/바다(장림포구)", conf: "중" },
  { name: "신내천·보골천·본동천", grade: "기타하천(미지정)", width: "미상", outlet: "미상", conf: "하" },
  { name: "다대포 우수관로", grade: "구거·우수관", width: "관로", outlet: "남해(직접)", conf: "중" },
];

// 강서구 권역(서낙동강 수계)
export const STREAMS_GANGSEO: StreamRow[] = [
  { name: "서낙동강", grade: "국가하천", width: ">10m", outlet: "남해(녹산수문)", conf: "상" },
  { name: "평강천", grade: "국가하천", width: ">10m", outlet: "맥도강→서낙동강", conf: "상" },
  { name: "맥도강", grade: "국가하천", width: ">10m(약 300m)", outlet: "평강천→서낙동강", conf: "상" },
  { name: "조만강", grade: "지방하천", width: "미상", outlet: "서낙동강", conf: "중" },
  { name: "구랑천·장곡천·범방천", grade: "소하천", width: "미상(소하천=하폭 ≥2m)", outlet: "서낙동강 하류계", conf: "중" },
];

// 입지 전환 — 보호구역 '밖' 지방하천 실증 후보 (거버넌스 단순 + 시의성)
export type AltSite = {
  name: string;
  grade: string;
  permit: string;   // 점용허가 주체
  zone: string;     // 천연기념물 179호 포함 여부
  timely: string;   // 시의성 근거
  sea: string;      // 바다·하구 관련성
  fit: string;      // 종합 적합도
};

export const ALT_PILOTS: AltSite[] = [
  {
    name: "괴정천 (사하)",
    grade: "지방하천",
    permit: "사하구청 단일창구",
    zone: "상·중류 밖(확정) / 하구말단 확인필요",
    timely: "2025.4 중앙투자심사 통과·약 500억 생태복원 본궤도(2028 준공)",
    sea: "하단→낙동강 본류 유입",
    fit: "상",
  },
  {
    name: "동천 (부산진·동구)",
    grade: "지방하천",
    permit: "자치구",
    zone: "무관(밖)",
    timely: "2026.1 정어리 떼죽음으로 언론·정치 시의성 최고조",
    sea: "부산항 북항 바다 직유입",
    fit: "상",
  },
  {
    name: "감전천 (사상)",
    grade: "지방하천",
    permit: "사상구청",
    zone: "확인 필요",
    timely: "2026.3 '250억 복원 무색·수질 나쁨' 보도",
    sea: "낙동강 본류 경유 하구",
    fit: "중상",
  },
  {
    name: "평강천·맥도강 (강서)",
    grade: "국가하천",
    permit: "부산지방국토관리청 (시·구 아님)",
    zone: "확인 필요",
    timely: "낙동강 BOD 최악 1·2위, 어류폐사(2025.12)",
    sea: "서낙동강→낙동강 하구",
    fit: "중 (국가하천=인허가 복잡)",
  },
];

// 4중 중첩 규제 (검증됨)
export const REGS: { law: string; name: string; since: string }[] = [
  { law: "자연유산법", name: "천연기념물 제179호 「낙동강 하류 철새 도래지」(을숙도 포함)", since: "1966.7.23" },
  { law: "습지보전법", name: "낙동강하구 습지보호지역(환경부)", since: "1999" },
  { law: "국토계획법", name: "자연환경보전지역(용도지역)", since: "1988" },
  { law: "해양환경관리법", name: "특별관리해역", since: "1982" },
];

// 합법적 신속 실증 경로 (규제샌드박스/협업) — 추천 순
export type Pathway = {
  rank: string;
  title: string;
  who: string;
  basis: string;
  risk: string;
};

export const PATHWAYS: Pathway[] = [
  {
    rank: "1순위",
    title: "공공 관리주체 주관 + 정부 차단막 확대계획 편승",
    who: "부산시 낙동강관리본부 / 낙동강유역환경청 / 해수부 (의뢰인=기술·운영 파트너)",
    basis: "물환경보전법 하천·하구쓰레기 정화사업 · 제1차 해양폐기물 관리 기본계획(차단막 확대) · 인허가는 공공 주체가 처리",
    risk: "속도가 기관 예산·의지에 좌우(수개월~차년도) · 단 인허가 리스크는 최소",
  },
  {
    rank: "2순위",
    title: "규제샌드박스 실증특례(순환경제/산업융합) + 신속확인 병행",
    who: "의뢰인(기업) — 접수: KEITI(순환경제)·KIAT(산업융합)·대한상의 통합창구",
    basis: "순환경제 사회 전환 촉진법 제27~34조 / 산업융합촉진법 · 상시 접수, 최대 4년, 실증비·보험료 최대 1.4억(중견·중소)",
    risk: "샌드박스가 천연기념물 현상변경·공유수면 점용 허가를 갈음하는지 미확인 → 국가유산청 협의 별도 필요",
  },
  {
    rank: "3순위",
    title: "K-water 국가 K-테스트베드 / 지자체 테스트베드 실증",
    who: "의뢰인(기업) — ktestbed.net, 연 2회(3·9월) 공모",
    basis: "K-water 테스트베드 운영규정·실증 협약(MOU) · 공공 인프라에서 기술 성능 데이터 선확보",
    risk: "을숙도 보호구역이 테스트베드 인프라 목록에 있는지 미확인 → 하굿둑 등에서 선검증 단계 필요할 수 있음",
  },
];

// 규제 창구 연락처
export const SANDBOX_CONTACTS: { label: string; detail: string }[] = [
  { label: "대한상의 규제샌드박스 지원센터(4종 통합)", detail: "☎ 02-6050-3001 · sandbox@korcham.net" },
  { label: "순환경제 샌드박스(KEITI)", detail: "☎ 02-2284-1790 · sandbox@keiti.re.kr" },
  { label: "산업융합 실증특례(KIAT)", detail: "☎ 02-6009-4088 · sandbox@kiat.or.kr" },
  { label: "감사원 사전컨설팅(적극행정면책)", detail: "인허가 적법성 사전 검토 → 의견대로 처리 시 면책" },
];

// 국내 지도·데이터 자원
export const MAP_LINKS: { label: string; url: string; note: string }[] = [
  { label: "VWorld 항공정사영상", url: "https://map.vworld.kr/map/maps.do", note: "국내 최고해상도 · 섬·수로 지형 파악" },
  { label: "RIMGIS 하천관리지리정보", url: "https://www.river.go.kr/map/rimMap.do", note: "하천구역 경계·하천대장(점용허가 판단 직결)" },
  { label: "국토정보플랫폼", url: "https://map.ngii.go.kr/", note: "과거↔현재 영상 비교" },
  { label: "WAMIS 수자원정보", url: "https://www.wamis.go.kr/", note: "수위·유량 시계열" },
  { label: "물환경정보시스템", url: "https://water.nier.go.kr/web", note: "수질·녹조·퇴적물" },
  { label: "규제샌드박스 통합포털", url: "https://www.sandbox.go.kr/", note: "8개 분야 실증특례·임시허가 접수" },
];
