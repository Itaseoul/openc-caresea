// 대상 하천 하류 CCTV 지역 프리셋.
// ITS(국가교통정보센터) 도로 CCTV 중 "하천을 건너거나 하류를 지나는" 카메라가 잡히도록
// 각 하천 하구/하류에 맞춘 bbox. 좌표는 2026-07 실조회로 하천 교량 카메라 존재 확인.
// 첫 항목(부산 낙동강 하류)이 우리 실증 대상지.

export type Bbox = { minX: number; maxX: number; minY: number; maxY: number };
// static=고정목록(서귀포), dataGov=data.go.kr API 조회(제주시), 그 외=ITS 도로 CCTV.
export type CctvRegion = { key: string; label: string; river: string; bbox: Bbox; static?: boolean; dataGov?: "jeju" };

export const CCTV_REGIONS: CctvRegion[] = [
  // 실증 대상지 — 낙동강 하구로 흘러드는 소하천 길목(서낙동강교·강서낙동강교·서부산 낙동강교·조만강교)
  { key: "busan-nakdong", label: "부산 낙동강 하류", river: "낙동강", bbox: { minX: 128.88, maxX: 129.06, minY: 35.05, maxY: 35.26 } },
  // ★제주시 하천 감시 CCTV — data.go.kr riverCctvService(하천 62개소, HLS). "진짜 하천" 개방 API.
  { key: "jeju-si-river", label: "제주시 하천 (공공 API)", river: "제주시 하천", bbox: { minX: 126.2, maxX: 126.9, minY: 33.25, maxY: 33.55 }, dataGov: "jeju" },
  // ★지자체 하천 CCTV 개방 실증 — 서귀포시가 하천 영상을 HLS로 공개(도로 아닌 "진짜 하천"). ITS 아님(고정 목록).
  { key: "seogwipo-river", label: "제주 서귀포 하천 (개방 실증)", river: "서귀포 하천", bbox: { minX: 126.1, maxX: 126.9, minY: 33.2, maxY: 33.5 }, static: true },
  // 인천 남동·연수 — 장수천1교·논현교·신천·은행교
  { key: "incheon-jangsu", label: "인천 장수천·승기천", river: "장수천", bbox: { minX: 126.66, maxX: 126.82, minY: 37.38, maxY: 37.48 } },
  // 한강 하류 — 김포대교(남·북단)·행주
  { key: "hangang-low", label: "한강 하류(김포·행주)", river: "한강", bbox: { minX: 126.72, maxX: 126.92, minY: 37.56, maxY: 37.66 } },
  // 금강 하류 — 금강대교·군산
  { key: "geum-low", label: "금강 하류(군산)", river: "금강", bbox: { minX: 126.68, maxX: 126.92, minY: 35.98, maxY: 36.12 } },
  // 영산강 하류 — 몽탄·성암교·무안/나주
  { key: "yeongsan-low", label: "영산강 하류(나주·목포)", river: "영산강", bbox: { minX: 126.42, maxX: 126.72, minY: 34.88, maxY: 35.12 } },
  // 태화강 — 범서대교·다운교·울산
  { key: "taehwa-ulsan", label: "태화강(울산)", river: "태화강", bbox: { minX: 129.22, maxX: 129.36, minY: 35.52, maxY: 35.62 } },
  // 섬진강 하류 — 수어천교·하동/광양
  { key: "seomjin-low", label: "섬진강 하류(하동·광양)", river: "섬진강", bbox: { minX: 127.66, maxX: 127.84, minY: 34.9, maxY: 35.06 } },
];

export const DEFAULT_REGION_KEY = CCTV_REGIONS[0].key;

export function getRegion(key: string | null | undefined): CctvRegion | undefined {
  if (!key) return undefined;
  return CCTV_REGIONS.find((r) => r.key === key);
}

// 카메라 이름이 "물길"에 해당하는지(강/천/하구/대교/보/수문) — 터널·휴게소·영업소·IC 등은 제외.
// 하천 화면을 우선 노출하기 위한 정렬/필터용.
export function isWaterCam(name: string | undefined): boolean {
  if (!name) return false;
  if (/(터널|휴게소|영업소|분기점|졸음|IC|나들목|톨게이트|요금소)/.test(name)) return false;
  return /(강교|천교|낙동강|한강|금강|영산강|섬진강|태화강|하구|대교|수문|보$|보\)|장수천|승기천|수어천|조만강|낙동)/.test(name);
}
