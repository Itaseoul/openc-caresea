import PermitGenerator from "@/components/PermitGenerator";

export const metadata = {
  title: "행정 허가 에이전트 — 스팟별 점용허가 문서팩",
  description:
    "실증 스팟을 고르면 하천 등급·관할·보호구역에 따라 필요한 허가·협의 순서·요건 체크리스트와 사전채움 문서팩(사업계획서·정보공개청구·사전협의 공문)을 생성합니다.",
};

export default function PermitPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#eef2f6", color: "#0f172a" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#64748b", fontWeight: 700 }}>SEA:CUT · 행정 허가 에이전트</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.25 }}>
          스팟을 고르면 <span style={{ color: "#0e7490" }}>허가 경로·문서팩</span>이 달라집니다
        </h1>
        <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, marginTop: 8, maxWidth: 720 }}>
          실증 후보 하천을 선택하면 그 스팟의 <b>등급·점용허가 처분청·보호구역 여부</b>에 따라 필요한 허가와 협의 순서,
          「하천점용허가 세부기준」 요건 체크리스트, 그리고 <b>사전채움 문서팩</b>(사업계획서·정보공개청구·사전협의 공문)을 생성합니다.
        </p>

        {/* 결정형 안내 */}
        <div style={{ marginTop: 14, padding: "11px 13px", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 12, fontSize: 12, color: "#334155", lineHeight: 1.65 }}>
          이 도구는 <b>검증된 조문·처분청만 인용하는 결정형</b>입니다. 법문을 지어내지 않고, 보호구역 경계처럼 불확실한 항목은 <b>‘확인 필요’</b>로 표시합니다.
          생성물은 <b>초안</b>이며 제출 전 사람이 검수하고 최신 판본·처분청을 확인해야 합니다.
        </div>

        <div style={{ marginTop: 16 }}>
          <PermitGenerator />
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: "#94a3b8", lineHeight: 1.75 }}>
          근거: 하천법 제33조 · 「하천점용허가 세부기준」(환경부) · 하천법 시행령 제44조 · 자연유산법 제17조 · 부산시 사무위임 조례.
          상세 검토는 docs/하천점용허가-적합성검토.md, 정보공개청구서-초안.md 참조. 본 페이지는 공개자료 기반 실무 보조 도구이며 인허가·법률 자문이 아닙니다.
        </div>

        <div style={{ marginTop: 22, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          ← <a href="/" style={{ color: "#0e7490", textDecoration: "underline" }}>openc 메인 (제안서)</a> ·{" "}
          <a href="/eulsukdo" style={{ color: "#0e7490", textDecoration: "underline" }}>을숙도 하구 후보지</a> ·{" "}
          <a href="/streams" style={{ color: "#0e7490", textDecoration: "underline" }}>전국 소하천 정비율</a>
        </div>
      </div>
    </main>
  );
}
