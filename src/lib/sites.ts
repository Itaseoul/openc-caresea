// 관측 대상 지점. nx/ny는 grid.ts로 검증된 기상청 격자.
// seoulRiver/seoulWatg: 서울 OA-1167(ListRiverStageService) 매칭용. 사천교 수위계 코드는 실키 발급 후 21개소 조회로 확정.

export interface Site {
  id: string;
  name: string;
  river: string;
  lat: number;
  lon: number;
  nx: number;
  ny: number;
  seoulRiver?: string; // 서울 OA-1167 RVR_NM
  seoulWatg?: string; // 서울 OA-1167 WATG_NM (확정 전 후보)
  busanRainArea?: string; // 부산 강우 API clientName (구 단위)
}

export const SITES: Site[] = [
  {
    id: "sacheon",
    name: "사천교",
    river: "홍제천",
    lat: 37.5835,
    lon: 126.9182,
    nx: 59,
    ny: 127,
    seoulRiver: "홍제천", // ★OA-1167 실데이터(2026-06-28): 홍제천 수위계는 성산2교(코드 1501, 마포 하구)뿐 — 사천교 게이지 없음. river=홍제천 필터로 성산2교 사용(사천교 바로 하류 대체). 대안=불광천 증산교(코드 1401, 서대문구, 통제수위 9.2)
    seoulWatg: "성산2교",
  },
  {
    id: "hakjang",
    name: "엄궁동",
    river: "학장천",
    lat: 35.138,
    lon: 128.969,
    nx: 96,
    ny: 75,
    busanRainArea: "사상구", // 부산 강우 API(/api/busan-rain?area=사상구). ★수위는 공공 없음=자체 IoT
    // 서울 OA-1167 대상 아님. 수위는 낙동강홍수통제소(hrfco 코드 확인 필요)/자체계측(M3)
  },
];

export const DEFAULT_SITE = SITES[0];

export function getSite(id?: string | null): Site {
  return SITES.find((s) => s.id === id) ?? DEFAULT_SITE;
}
