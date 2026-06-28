import dynamic from "next/dynamic";
import { SOHA_DATA, colorFor } from "@/components/sohaData";

const Choro = dynamic(() => import("@/components/SohaChoropleth"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 520, background: "#f1f5f9", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
      지도 불러오는 중…
    </div>
  ),
});

const STATS = [
  { label: "평균", value: "46.5%", color: "#475569" },
  { label: "최고 (서울)", value: "79.1%", color: "#1d4ed8" },
  { label: "최저 (광주)", value: "11.5%", color: "#dc2626" },
  { label: "피해 (2020~22)", value: "2,499억", color: "#b45309" },
];

export const metadata = {
  title: "전국 소하천 정비율 — SEA:CUT 정책 컨텍스트",
  description:
    "전국 22,099곳 소하천의 시도별 정비율 지도. 평균 46.5%, 서울 79.1% ~ 광주 11.5% — 재정력에 따른 '빈익빈 부익부'.",
};

export default function StreamsPage() {
  const filled = SOHA_DATA.filter((d) => d.pct != null).length;
  const pending = SOHA_DATA.length - filled;
  const ranked = SOHA_DATA.filter((d) => d.pct != null).sort((a, b) => (b.pct! - a.pct!));

  return (
    <main style={{ minHeight: "100vh", background: "#eef2f6", color: "#0f172a" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#64748b", fontWeight: 700 }}>SEA:CUT · 정책 컨텍스트</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.25 }}>
          전국 소하천 정비율 — <span style={{ color: "#dc2626" }}>"빈익빈 부익부"</span>
        </h1>
        <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, marginTop: 8, maxWidth: 720 }}>
          전국 소하천 <b>22,099곳</b>, 총연장 <b>55,679km</b>. 평균 정비율은 <b>46.5%</b>로,
          서울(79.1%)과 광주(11.5%)의 격차가 7배에 이릅니다. 2020년 소하천 정비사업이 지자체 자체 사업으로 전환된 뒤,
          재정력에 따라 정비 격차가 벌어졌습니다. SEA:CUT은 이 사각지대에 시민·오픈소스로 메우는 실증입니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, margin: "16px 0 18px" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", color: s.color, marginTop: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <Choro />

        <div style={{ marginTop: 18, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>시도별 정비율 (확보값, 내림차순)</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>전국 평균 46.5%</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
            {ranked.map((r) => (
              <div key={r.name_eng} style={{ display: "grid", gridTemplateColumns: "38px 1fr 48px", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>{r.label}</span>
                <div style={{ position: "relative", height: 18, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${r.pct}%`,
                      background: colorFor(r.pct),
                      borderRadius: 5,
                    }}
                  />
                  {/* 전국 평균(46.5%) 기준선 */}
                  <div style={{ position: "absolute", left: "46.5%", top: 0, bottom: 0, width: 1.5, background: "#0f172a", opacity: 0.45 }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", textAlign: "right" }}>{r.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
            <span style={{ width: 10, height: 0, borderTop: "1.5px solid #0f172a", opacity: 0.55, display: "inline-block" }} />
            세로선 = 전국 평균 46.5%
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            확보값 {filled}곳 · 확인 중 {pending}곳 (부산·대구·경기·경북·경남·제주·세종 — 공개 기사·자료에 시도별 수치 명시 안 됨, 행안부 통계 보강 예정)
          </div>
        </div>

        <div style={{ marginTop: 16, padding: "13px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, fontSize: 13, color: "#92400e", lineHeight: 1.65 }}>
          하천정비 사업 예산의 지방 이양(2020) 이후 3년간 소하천 피해 규모 <b>2,499억원</b>. 재정이 열악한 지자체엔 큰 부담이라는 지적. 도시 소하천 병목의 부유 쓰레기·홍수 위험은 데이터·도면을 <b>공개</b>해 누구나 복제하는 SEA:CUT의 OpenBoom으로 보완할 수 있습니다.
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: "#94a3b8", lineHeight: 1.75 }}>
          출처: 행정안전부 · 더불어민주당 한병도 의원실 (2024). 지도 GeoJSON southkorea-maps (kostat 2018) · 베이스맵 OpenTopoMap(CC-BY-SA) · CARTO · OpenStreetMap. 본 페이지는 공공데이터 기반 정책 컨텍스트이며 안전·정책 자문이 아닙니다.
        </div>

        <div style={{ marginTop: 22, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          ← <a href="/" style={{ color: "#0e7490", textDecoration: "underline" }}>openc 메인 (제안서)</a> · <a href="/dashboard" style={{ color: "#0e7490", textDecoration: "underline" }}>운영·안전 대시보드</a>
        </div>
      </div>
    </main>
  );
}
