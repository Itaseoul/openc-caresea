import dynamic from "next/dynamic";
import {
  SITES,
  CANDIDATES,
  REGS,
  MAP_LINKS,
  STREAMS_SAHA,
  STREAMS_GANGSEO,
  PATHWAYS,
  SANDBOX_CONTACTS,
  ALT_PILOTS,
  type StreamRow,
} from "@/components/eulsukdoData";

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

        {/* 지리 & 하천 (정정) */}
        <Section title="지리 · 하천 (법정등급 정정)">
          <ul style={ulStyle}>
            <li><b>을숙도</b>(35.097°N, 128.940°E): 낙동강이 운반한 토사가 쌓인 하중도(삼각주 모래섬), 사하구 하단동.</li>
            <li><b>낙동강하굿둑</b>이 을숙도 북부를 횡단 — 둑 북=담수호, 남=바다. 본류 하구는 <b>국가하천</b>.</li>
            <li><b>괴정천 = 지방하천</b>(시약산→하단동→낙동강 본류 유입, 연장 5.2km 중 4.4km 복개). 사하구엔 <b>지정 소하천이 0개</b>입니다.</li>
            <li><b>당리천·장림천 = 법정 미지정 "기타하천"</b>(대부분 복개). <b>"하단천"은 실존하지 않는 명칭</b>(하단동 지명), <b>"평강천"은 강서구 국가하천</b>(서낙동강 수계) — 사하구 하천 아님.</li>
          </ul>
        </Section>

        {/* 유형별 물길 표 */}
        <Section title="바다·본류 유입 물길 — 유형별">
          <StreamTable title="사하구 권역 (동낙동강 = 본류 수계)" rows={STREAMS_SAHA} />
          <div style={{ height: 10 }} />
          <StreamTable title="강서구 권역 (서낙동강 수계)" rows={STREAMS_GANGSEO} />
          <div style={{ marginTop: 9, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            ※ 하천법·소하천정비법에 ‘≤5m/≤10m’ 폭 등급은 없습니다(소하천 기준 = 평균 하폭 ≥2m·길이 ≥500m). 표의 폭 유형은 국가하천(&gt;10m) 외 대부분 ‘미상’이며,
            측점별 정밀 하폭·좌표는 RIMGIS 하천대장 또는 사하구청 정보공개청구로만 확보됩니다.
          </div>
        </Section>

        {/* 입지 전환 — 보호구역 밖 (권장) */}
        <Section title="🎯 입지 전략 — 보호구역 '밖'에서 시작 (권장)">
          <div style={{ fontSize: 12.5, color: "#065f46", lineHeight: 1.65, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "9px 11px", marginBottom: 10 }}>
            국가유산청 협의가 비현실적이라면, <b>천연기념물 179호를 벗어난 지방하천 구간</b>에서 실증을 시작하는 편이 빠릅니다.
            <b>괴정천·장림천의 상·중류는 보호구역 밖(확정)</b>이고, 지방하천 점용허가는 부산시→<b>구청에 위임</b>되어 단일 창구가 됩니다.
            게다가 「하천점용허가 세부기준」은 <b>‘부유식 구조 우선 고려’</b>를 명시 — 붐 설치에 유리한 법적 근거입니다.
            <br />→ <b>전략:</b> 보호구역 밖 지방하천에서 데이터·신뢰를 먼저 쌓고, 단계적으로 하구로 확장.
          </div>
          <AltTable rows={ALT_PILOTS} />
          <div style={{ marginTop: 9, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            ※ ‘공동 문제’가 가장 뜨거운 곳은 낙동강 하구 자체(=179호 안)라는 긴장점이 있습니다. 위는 <b>‘시의성 × 인허가 단순(국가유산청 불요)’</b>을 함께 만족하는 순으로,
            <b>괴정천 중·하류</b>가 균형 최우수. 단 하구 말단 정밀 경계·외곽 500m 보존지역 저촉은 국가유산청 고시 지형도면 대조로 확인해야 합니다.
          </div>
        </Section>

        {/* 부유물 실태 (정정) */}
        <Section title="부유물 실태 (사업 명분 · 정정)">
          <ul style={ulStyle}>
            <li><b>정량 입증된 집적지는 하굿둑 ‘하류’ 사주 무인도서</b>(진우도·신자도 등) — 해양환경공단 약 2개월 <b>501톤</b> 수거. ‘수문 앞 상류 집적’을 특정한 자료는 없습니다.</li>
            <li><b>구성의 약 86%가 대형 목재류</b>(진우도 전면해역 ~444 t/㎢, 목재 85.9%·폐어구 5.1%·플라스틱 4.8%) → 붐 설계는 <b>굵은 유목·대형물 대응</b>이 핵심.</li>
            <li>우기 급증: 전국 하천 부유물 2019년 4.8만 톤 → 2020년 10.5만 톤. 발생원 대부분은 상류 본류에서 내려오는 목재류.</li>
            <li><b>전략적 호재:</b> 5대강 하구 차단막 6개소(한강·금강·영산강·섬진강)는 운영 중이나 <b>낙동강 하구만 미설치</b>이고, 정부가 ‘고위험 지천으로 차단막 확대’를 명문화 → 을숙도는 정부가 채우려는 빈자리.</li>
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

        {/* 규제 경로 — 합법적 신속 실증 */}
        <Section title="🔑 규제 경로 — 합법적 신속 실증(샌드박스·협업)">
          <div style={{ fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.65, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 11px", marginBottom: 10 }}>
            솔직한 전제: 규제샌드박스는 자금·정당성을 주지만 <b>천연기념물 현상변경 허가·공유수면 점용 허가를 자동으로 갈음하지 않습니다(미확인).</b> ‘우회’는 위법이 아니라 <b>합법 특례 활용</b>으로 한정합니다. 가장 빠른 길은 ‘공공 주관 + 사전협의로 필요한 허가를 확정’하는 조합입니다.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {PATHWAYS.map((p) => (
              <div key={p.rank} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#f8fafc" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                  <span style={{ color: "#0e7490" }}>{p.rank}</span> · {p.title}
                </div>
                <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.6, marginTop: 4 }}>
                  <div><b>주체</b> {p.who}</div>
                  <div><b>근거</b> {p.basis}</div>
                  <div style={{ color: "#b45309" }}><b>리스크</b> {p.risk}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#334155", lineHeight: 1.6, background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 10, padding: "9px 11px" }}>
            <b>저비용 첫 수(권장):</b> 시작 전 <b>규제 신속확인</b>(샌드박스, 30일 내 회신) 또는 국가유산청·공유수면관리청 <b>사전 협의</b>로 “정확히 어떤 허가가 필요한가”를 공식 확인 — 추측을 없애는 가장 빠른 합법 출발점.
          </div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 6 }}>
            {SANDBOX_CONTACTS.map((c) => (
              <div key={c.label} style={{ fontSize: 11.5, color: "#475569", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 9px" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.label}</div>
                <div style={{ color: "#64748b", marginTop: 1 }}>{c.detail}</div>
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

const confColor: Record<string, string> = { 상: "#16a34a", 중: "#b45309", 하: "#dc2626" };

function StreamTable({ title, rows }: { title: string; rows: StreamRow[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ color: "#94a3b8", textAlign: "left" }}>
              <th style={thStyle}>명칭</th>
              <th style={thStyle}>법정등급</th>
              <th style={thStyle}>하폭 유형</th>
              <th style={thStyle}>유입처</th>
              <th style={{ ...thStyle, textAlign: "center" }}>신뢰도</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} style={{ borderTop: "1px solid #eef2f6" }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a" }}>{r.name}</td>
                <td style={tdStyle}>{r.grade}</td>
                <td style={tdStyle}>{r.width}</td>
                <td style={tdStyle}>{r.outlet}</td>
                <td style={{ ...tdStyle, textAlign: "center", color: confColor[r.conf], fontWeight: 800 }}>{r.conf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "4px 8px", fontWeight: 700, whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "5px 8px", color: "#475569", verticalAlign: "top" };

function AltTable({ rows }: { rows: typeof ALT_PILOTS }) {
  const fitColor = (f: string) => (f.startsWith("상") ? "#16a34a" : f.startsWith("중상") ? "#0e7490" : f.startsWith("중") ? "#b45309" : "#dc2626");
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr style={{ color: "#94a3b8", textAlign: "left" }}>
            <th style={thStyle}>하천(권역)</th>
            <th style={thStyle}>등급</th>
            <th style={thStyle}>점용허가 주체</th>
            <th style={thStyle}>179호</th>
            <th style={thStyle}>시의성</th>
            <th style={{ ...thStyle, textAlign: "center" }}>적합도</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} style={{ borderTop: "1px solid #eef2f6" }}>
              <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a" }}>{r.name}</td>
              <td style={tdStyle}>{r.grade}</td>
              <td style={tdStyle}>{r.permit}</td>
              <td style={tdStyle}>{r.zone}</td>
              <td style={tdStyle}>{r.timely}</td>
              <td style={{ ...tdStyle, textAlign: "center", color: fitColor(r.fit), fontWeight: 800, whiteSpace: "nowrap" }}>{r.fit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
