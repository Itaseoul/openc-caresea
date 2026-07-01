// 서귀포시 실시간하천 재난안전 CCTV — 지자체가 하천 영상을 HLS로 공개하는 실증 사례.
// 출처: https://www.seogwipo.go.kr/field/safety/live/hls.htm (2026-07 확인, 스트림 재생 검증됨)
// 스트림: http://211.34.191.215:1935/live/{id}.stream/playlist.m3u8 (http라 /api/cctv/stream 프록시로 재생)
// ★ ITS 도로 CCTV와 달리 "진짜 하천"을 비춘다 — SEA:CUT의 "하천 영상 개방" 명분의 실물 근거.

export const SEOGWIPO_HOST = "211.34.191.215";

const streamOf = (id: string) => `http://${SEOGWIPO_HOST}:1935/live/${id}.stream/playlist.m3u8`;

type River = { name: string; id: string };
const RIVERS: River[] = [
  { name: "효돈천 (쇠소깍다리)", id: "1-41" },
  { name: "강정천 (강정교)", id: "1-70" },
  { name: "동홍천 (동홍교)", id: "1-35" },
  { name: "솜반천 (걸매공원옆)", id: "1-50" },
  { name: "악근천 (용흥교)", id: "1-38" },
  { name: "중문천 (중문교)", id: "1-40" },
  { name: "천미천 (성읍교)", id: "1-43" },
  { name: "창고천 (창천교)", id: "1-46" },
  { name: "신례천 (신례3교)", id: "1-42" },
  { name: "서홍천 (생수교)", id: "1-39" },
  { name: "도순천 (도순2교)", id: "1-37" },
  { name: "효돈천 (제2효례교)", id: "1-53" },
  { name: "가시천 (가시교)", id: "1-59" },
  { name: "예래천 (상천교)", id: "1-63" },
];

// route 에서 쓰는 형태: cctvname + cctvurl(원본 http m3u8). 프록시/포스터 붙이는 건 route 공통 로직.
export const SEOGWIPO_CAMS = RIVERS.map((r) => ({
  cctvname: r.name,
  cctvurl: streamOf(r.id),
  coordx: 0,
  coordy: 0,
  water: true,
  thumb: null as string | null,
}));
