import dynamic from "next/dynamic";
import { SITES, CANDIDATES, REGS, MAP_LINKS } from "@/components/eulsukdoData";

const EulMap = dynamic(() => import("@/components/EulsukdoMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 520, background: "#0b1f33", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
      지도 불러오는 중…
    </div>
  ),
});

export const metadata = {
  title: "을숙도 하구 실증 후보지 — SEA:CUT OpenBoom",
  description:
    "부산 사하구 을숙도 낙동강 하구 부유식 붐(OpenBoom) 설치 검토. 위치·소하천·부유 쓰레기 맥락과 4중 중첩 규제(천연기념물 제179호 등) 정리.",
};

const PARTNERS = [
  { name: "부산시 낙동강관리본부 / 낙동강하구에코센터", role: "1차 협의 창구 · 습지·생태 실관리(을숙도 내)" },
  { name: "낙동강유역환경청", role: "습지보호지역·환경 협의(환경부 소속)" },
  { name: "한국수자원공사(K-water)", role: "낙동강하굿둑 관리주체" },
  { name: "사하구청", role: "행정구역 관할(체육시설 한정 관리)" },
  { name: "습지와새들의친구(WBK)", role: "하구 보전 핵심 시민단체" },
];

export default function EulsukdoPage() {
  const all = [...SITES, ...CANDIDATES];

  return (
    <main style={{ minHeight: "100vh", background: "#eef2f6", color: "#0f172a" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#64748b", fontWeight: 700 }}>SEA:CUT · 실증 후보지</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.25 }}>
          을숙도 하구 — <span style={{ color: "#0e7490" }}>OpenBoom 설치 사이트 검토</span>
        </h1>
        <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, marginTop: 8, maxWidth: 720 }}>
          부산 사하구 <b>을숙도</b> 낙동강 하구에 부유 쓰레기 차단 부유식 붐(OpenBoom) 설치를 검토하기 위한 사이트 개요입니다.
          위치·소하천·부유 쓰레기 맥락과 <b>법적 규제·거버넌스</b>를 함께 정리했습니다.
        </p>

        {/* 규제 경고 — 가장 중요 */}
        <div style={{ marginTop: 16, padding: "14px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#b91c1c" }}>⚠️ 설치 전 선결: 국가유산청 현상변경 허가</div>
          <p style={{ fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.65, marginTop: 6 }}>
            을숙도·낙동강 하구는 빈 부지가 아니라 <b>4중 중첩 규제구역</b>입니다. 공유수면에 붐을 설치하는 것조차
            천연기념물 보호구역 내 행위로 보아 <b>국가유산청 현상변경 허가가 사실상 선결 조건</b>이며,
            습지보전법 협의·하천점용·공유수면 점용 허가가 중첩됩니다. <b>후보지 선정보다 인허가 가능성 타진이 먼저</b>입니다.
            (참고: 낙동강 하구는 람사르 <b>미등록</b> — "을숙도=람사르"는 통념 오류.)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 6, marginTop: 10 }}>
            {REGS.map((r) => (
              <div key={r.name} style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{r.law} · {r.since}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 지도 */}
        <div style={{ marginTop: 18 }}>
          <EulMap />
        </div>

        {/* 핀 범례 */}
        <div style={{ marginTop: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>지도 핀</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 8 }}>
            {all.map((s) => (
              <div key={s.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ flex: "0 0 auto", width: 22, height: 22, borderRadius: "50%", background: s.color, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.id}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                    {s.name}{" "}
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: s.approx ? "#b45309" : "#16a34a" }}>
                      {s.approx ? "· 대략" : "· 검증"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            '대략' 핀은 오리엔테이션용이며, 정확한 위치·하천구역은 아래 VWorld 항공영상·RIMGIS로 현장 검증해야 합니다.
            기본 베이스맵은 위성(Esri) — 우측 상단에서 하천·지형(OpenTopoMap)으로 전환하면 물길이 또렷합니다.
          </div>
        </div>

        {/* 지리 & 소하천 */}
        <Section title="지리 · 소하천">
          <ul style={ulStyle}>
            <li><b>을숙도</b>(35.097°N, 128.940°E): 낙동강이 운반한 토사가 쌓인 하중도(삼각주 모래섬), 사하구 하단동.</li>
            <li><b>낙동강하굿둑</b>이 을숙도 북부를 횡단 — <b>둑 북쪽=담수호(흐름 정체·부유물 집적), 남쪽=바다.</b> 본류 하구는 <b>국가하천</b>(소하천 아님).</li>
            <li>사하구 도시 <b>소하천</b>: <b>괴정천</b>(시약산→하단동→낙동강 본류 유입), <b>당리천</b>(→괴정천 합류). 두 하천의 법정 등급과 "하단천·장림천"은 추가 확인 필요.</li>
          </ul>
        </Section>

        {/* 부유 쓰레기 맥락 */}
        <Section title="부유 쓰레기 맥락 (사업 명분)">
          <ul style={ulStyle}>
            <li>낙동강 하구 무인도서(진우도·신자도 등)가 최대 집적지 — 2023년 단기 사업에서만 해양환경공단 501톤 수거.</li>
            <li>우기 급증: 전국 하천 부유물 2019년 4.8만 톤 → 2020년 10.5만 톤. 2024년 낙동강 10개 댐 23,526톤.</li>
            <li><b>선례:</b> 환경부·K-water "댐 부유물 차단시설", 해수부·해양환경공단 "강 하구 유입차단막"이 실제 운영 중 → OpenBoom의 정책적 근거.</li>
          </ul>
        </Section>

        {/* 거버넌스 */}
        <Section title="거버넌스 파트너 (협의 순서)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {PARTNERS.map((p, i) => (
              <div key={p.name} style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0e7490", flex: "0 0 auto" }}>{i + 1}</span>
                <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  <b>{p.name}</b> — <span style={{ color: "#64748b" }}>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 국내 맵 자원 */}
        <Section title="국내 지도 · 데이터 (직접 열람)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8 }}>
            {MAP_LINKS.map((m) => (
              <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer"
                 style={{ display: "block", padding: "9px 11px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, textDecoration: "none" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0e7490" }}>{m.label} ↗</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.note}</div>
              </a>
            ))}
          </div>
        </Section>

        <div style={{ marginTop: 18, fontSize: 11, color: "#94a3b8", lineHeight: 1.75 }}>
          출처: 국가유산포털(천연기념물 제179호) · 환경부 낙동강유역환경청 · 한국수자원공사 · 부산시 낙동강관리본부 · 한국민족문화대백과 · Wikidata(좌표). 위성 Esri World Imagery · 하천·지형 OpenTopoMap(CC-BY-SA) · CARTO · OpenStreetMap.
          본 페이지는 공개자료 기반 사이트 검토 메모이며 인허가·안전 자문이 아닙니다. 후보지·설계는 현장조사와 관계기관 협의로 확정해야 합니다.
        </div>

        <div style={{ marginTop: 22, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          ← <a href="/" style={{ color: "#0e7490", textDecoration: "underline" }}>openc 메인 (제안서)</a> ·{" "}
          <a href="/streams" style={{ color: "#0e7490", textDecoration: "underline" }}>전국 소하천 정비율</a> ·{" "}
          <a href="/dashboard" style={{ color: "#0e7490", textDecoration: "underline" }}>운영·안전 대시보드</a>
        </div>
      </div>
    </main>
  );
}

const ulStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 13, color: "#334155", lineHeight: 1.75 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
