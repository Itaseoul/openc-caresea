"use client";
import { useApi } from "@/lib/useApi";
import CctvPlayer from "@/components/CctvPlayer";

// 을숙도/낙동강 하구 실시간 수문 상황판 (MVP)
// 출처: 한강홍수통제소(HRFCO) 오픈API — 전국 국가·지방하천 수위·유량(실시간).
// ★소하천 스마트계측 데이터는 지자체 관제용으로 외부 미개방(2026 심층연구 결론) →
//   본류·지방하천(낙동강 하구) 데이터로 우회. 영상은 홍수정보시스템 외부링크.
// 관측소 선정: 이름 키워드가 아니라 "을숙도에서 가까운 순(거리)"으로 골라 배포 즉시 채워지게 함.

const EULSUKDO = { lat: 35.0966, lon: 128.9402 }; // 을숙도 중심
const RADIUS_KM = 30; // 하구 인접 본류·지방하천 포착 반경
const MAX_CARDS = 8;
// 좌표 파싱 실패 시(제원 포맷 이상) 대비용 이름 키워드 폴백
const KEYWORDS = ["낙동강하구둑", "하구둑", "구포", "명호", "대저", "사상", "하단", "을숙도", "삼락", "낙동"];

const n = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  const x = Number(String(v).trim());
  return Number.isFinite(x) ? x : null;
};

// HRFCO 제원 좌표는 십진수("128.94") 또는 도-분-초("128-56-24"/"128:56:24") 혼재 → 모두 십진수로.
function parseCoord(v: any): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (!/[:\s]|(?<=\d)-/.test(s)) {
    const dec = Number(s);
    return Number.isFinite(dec) ? dec : null;
  }
  const parts = s.split(/[-:\s]+/).map(Number).filter((x) => Number.isFinite(x));
  if (parts.length >= 2) {
    const [d, m, sec = 0] = parts;
    const sign = d < 0 ? -1 : 1;
    return sign * (Math.abs(d) + m / 60 + sec / 3600);
  }
  const dec = Number(s);
  return Number.isFinite(dec) ? dec : null;
}

function distKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

type Stage = { label: string; color: string };
function stageOf(wl: number | null, t: { att: number | null; wrn: number | null; alm: number | null; srs: number | null }): Stage | null {
  if (wl === null) return null;
  if (t.srs !== null && wl >= t.srs) return { label: "심각", color: "#7f1d1d" };
  if (t.alm !== null && wl >= t.alm) return { label: "위험", color: "#dc2626" };
  if (t.wrn !== null && wl >= t.wrn) return { label: "경계", color: "#ea580c" };
  if (t.att !== null && wl >= t.att) return { label: "주의", color: "#ca8a04" };
  if (t.att !== null || t.wrn !== null) return { label: "정상", color: "#16a34a" };
  return null; // 기준수위 미제공 관측소
}

function fmtTime(ymdhm: any): string {
  const s = String(ymdhm ?? "");
  if (s.length < 12) return "";
  return `${s.slice(4, 6)}.${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}`;
}

interface Row {
  code: string;
  name: string;
  distKm: number | null;
  wl: number | null;
  fw: number | null;
  time: string;
  stage: Stage | null;
}

export default function EulsukdoStatusBoard() {
  // 제원(이름·좌표·기준수위) + 실시간(수위·유량)을 각각 조회해 코드로 조인.
  const info = useApi<any>("/api/hrfco?type=waterlevel&info=1");
  const live = useApi<any>("/api/hrfco?type=waterlevel");
  // ITS CCTV(HLS) — 키 발급 시 영상 표시, 미발급이면 ok:false(NO_KEY)
  const cctv = useApi<any>("/api/cctv");
  const cctvStreams: any[] = cctv.data?.ok && Array.isArray(cctv.data?.content)
    ? cctv.data.content.filter((c: any) => c.cctvurl).slice(0, 4)
    : [];
  const cctvNoKey = cctv.data && cctv.data.ok === false && cctv.data.reason === "NO_KEY";

  const loading = info.loading || live.loading;
  const infoOk = info.data?.ok && Array.isArray(info.data?.content);
  const liveOk = live.data?.ok && Array.isArray(live.data?.content);

  let rows: Row[] = [];
  let pickedBy: "거리" | "이름" = "거리";
  if (infoOk) {
    const liveMap = new Map<string, any>();
    if (liveOk) for (const d of live.data.content) liveMap.set(String(d.wlobscd), d);

    const toRow = (s: any, dist: number | null): Row => {
      const code = String(s.wlobscd);
      const cur = liveMap.get(code);
      const wl = n(cur?.wl);
      const t = { att: n(s.attwl), wrn: n(s.wrnwl), alm: n(s.almwl), srs: n(s.srswl) };
      return { code, name: String(s.obsnm ?? code), distKm: dist, wl, fw: n(cur?.fw), time: fmtTime(cur?.ymdhm), stage: stageOf(wl, t) };
    };

    // 1차: 을숙도에서 RADIUS_KM 내, 가까운 순
    rows = (info.data.content as any[])
      .map((s) => {
        const lat = parseCoord(s.lat);
        const lon = parseCoord(s.lon);
        const dist = lat !== null && lon !== null ? distKm(EULSUKDO.lat, EULSUKDO.lon, lat, lon) : null;
        return { s, dist };
      })
      .filter((x) => x.dist !== null && x.dist <= RADIUS_KM)
      .sort((a, b) => (a.dist as number) - (b.dist as number))
      .slice(0, MAX_CARDS)
      .map((x) => toRow(x.s, x.dist));

    // 폴백: 좌표 파싱이 전부 실패하면 이름 키워드로
    if (rows.length === 0) {
      pickedBy = "이름";
      rows = (info.data.content as any[])
        .filter((s) => KEYWORDS.some((k) => String(s.obsnm ?? "").includes(k)))
        .slice(0, MAX_CARDS)
        .map((s) => toRow(s, null));
    }
  }

  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>🌊 실시간 수문 상황 — 낙동강 하구(국가·지방하천)</div>
        <div style={{ fontSize: 10.5, color: "#cbd5e1" }}>출처 HRFCO 오픈API · 10분 갱신</div>
      </div>

      {loading && <div style={{ fontSize: 12.5, color: "#94a3b8", padding: "10px 0" }}>실시간 수위·유량 불러오는 중…</div>}

      {!loading && rows.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
            {rows.map((r) => (
              <div key={r.code} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 11px", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>{r.name}</span>
                  {r.stage && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: r.stage.color, borderRadius: 20, padding: "1px 7px" }}>{r.stage.label}</span>
                  )}
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#0e7490", lineHeight: 1 }}>{r.wl ?? "—"}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>m</span>
                  {r.fw !== null && <span style={{ fontSize: 11, color: "#64748b" }}>· {r.fw} m³/s</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "#cbd5e1", marginTop: 4 }}>
                  {r.distKm !== null ? `을숙도 ~${r.distKm.toFixed(1)}km` : ""}
                  {r.distKm !== null && r.time ? " · " : ""}
                  {r.time ? `${r.time} 기준` : !r.distKm ? "관측시각 미상" : ""}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 7, fontSize: 10.5, color: "#cbd5e1" }}>
            을숙도 반경 {RADIUS_KM}km 내 가까운 순 · {pickedBy} 기준 선정
          </div>
        </>
      )}

      {/* 데이터 없음/미배포(키 바인딩) 안내 — 솔직하게 */}
      {!loading && rows.length === 0 && (
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "9px 11px" }}>
          {infoOk ? (
            <>응답에 을숙도 반경 {RADIUS_KM}km 내 관측소가 없습니다. 배포 후 <code style={{ fontSize: 11 }}>/api/hrfco?type=waterlevel&info=1</code> 응답의 좌표·<b>obsnm</b>을 확인해 반경/키워드를 조정하세요.</>
          ) : (
            <><b>실시간 데이터 대기 중.</b> HRFCO 키가 등록 도메인(openc.caresea.kr)·IP에 바인딩돼 <b>로컬에서는 940 인증 실패</b>가 정상입니다. 배포 환경에서 실데이터가 표시됩니다. (그 전까지는 아래 외부 링크로 확인)</>
          )}
        </div>
      )}

      {/* CCTV 라이브(HLS) — ITS 키 발급 시 영상 직접 표시(리버캠과 동일 원리) */}
      {cctvStreams.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>📹 현장 CCTV 라이브 (ITS · 낙동강 하구 인근)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
            {cctvStreams.map((c, i) => (
              <CctvPlayer key={i} src={c.cctvurl} name={c.cctvname} />
            ))}
          </div>
        </div>
      )}
      {cctvNoKey && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.6, background: "#f1f5f9", border: "1px dashed #cbd5e1", borderRadius: 10, padding: "9px 11px" }}>
          📹 <b>CCTV 영상 플레이어 준비 완료</b> — <b>ITS 인증키</b>만 발급해 Vercel 환경변수 <code style={{ fontSize: 11 }}>ITS_KEY</code>에 넣으면 낙동강 하구 인근 도로·교량 CCTV가 <b>이 자리에 바로 재생</b>됩니다(리버캠과 동일 방식).{" "}
          <a href="https://www.its.go.kr" target="_blank" rel="noopener noreferrer" style={{ color: "#0e7490", fontWeight: 700, textDecoration: "underline" }}>its.go.kr 인증키 신청 ↗</a>
        </div>
      )}

      {/* 현장 영상 — 임베드 약관 미확정이라 외부 링크로 (정직) */}
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 6 }}>
        <a href="https://n.flood.go.kr/observation/waterlevel/waterLevelCCTV.do" target="_blank" rel="noopener noreferrer"
           style={{ display: "block", padding: "9px 11px", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 10, textDecoration: "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0e7490" }}>📹 수위관측 CCTV (홍수정보시스템) ↗</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>국가·지방하천 현장 영상. 임베드 약관 확인 전 외부 링크로 연결.</div>
        </a>
        <a href="https://www.hrfco.go.kr/sumun/cctvRtmp.do" target="_blank" rel="noopener noreferrer"
           style={{ display: "block", padding: "9px 11px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, textDecoration: "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0e7490" }}>📹 주요지점 수위동영상 (HRFCO) ↗</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>홍수통제소 직접 영상 페이지.</div>
        </a>
      </div>

      <div style={{ marginTop: 9, fontSize: 10.5, color: "#94a3b8", lineHeight: 1.6 }}>
        ※ 소하천 스마트계측(수위·유속·유량·CCTV)은 지자체 관제용으로 <b>외부 공개 API가 없습니다</b>(2026 조사). 위 수치는 인접 <b>국가·지방하천</b> 본류 데이터로, 소하천 직접 상황이 아닌 <b>하구 본류 참고치</b>입니다.
      </div>
    </div>
  );
}
