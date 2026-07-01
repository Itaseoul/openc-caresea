// 심층 페이지: EU Plastic Pirates 벤치마크 → SEA:CUT "시민 수거를 표준 관측·라벨로 승격"
// 팀 참고용 근거 페이지. 인라인 스타일(=/streams·/permit 독립 컨텍스트 페이지 컨벤션).
// 근거 메모: memory/plastic-pirates-benchmark.md (사실은 원문 확증분만, 프레이밍은 정직 경계 표기).

const STATS = [
  { label: "참여국", value: "14개국", color: "#1d4ed8" },
  { label: "청소년", value: "2.5만+", color: "#0e7490" },
  { label: "측정 지점", value: "390개", color: "#0f766e", sub: "강·하천·해변" },
  { label: "데이터셋", value: "1,200+", color: "#b45309", sub: "미세플라스틱" },
];

// 4단 파이프라인 — Plastic Pirates가 검증한 "시민 수거 → 오픈데이터" 흐름.
const PIPELINE = [
  {
    n: "01",
    title: "공통 과학 프로토콜",
    body: "전 지역이 동일한 방법으로 표본 채취·분류. 교재·방법론을 14개 언어로 배포해 데이터 비교가능성(comparability)을 확보. 이게 없으면 지역 데이터는 서로 비교 불가.",
    take: "정화 참여자용 1페이지 표준 관측 카드(위치·시각·품목 카테고리 고정)",
  },
  {
    n: "02",
    title: "카메라 = 표준 장비",
    body: "현장 장비 목록이 “그물·장갑·노트·카메라”. 사진 기록이 채집 프로토콜에 내장되어, 수거물이 곧 관측 증거가 됨.",
    take: "사진을 관측 스키마의 필수 필드로 (photo hash + geo + timestamp)",
  },
  {
    n: "03",
    title: "전문가 검증·조화",
    body: "26개+ 연구기관이 수집 데이터를 harmonise·verify하고 metadata를 통합한 뒤 발행. 시민 수집물이 그냥 쌓이지 않고 과학 파이프라인을 통과.",
    take: "우리의 “사진 검증 게이트”: 업로드 → 자동 EXIF/geo 체크 → 분류 검토 → 라벨 승격",
  },
  {
    n: "04",
    title: "오픈데이터 발행",
    body: "Zenodo(DOI 부여 2건)·EMODnet·IMIS·MDA 등 권위 저장소에 공개. 자체 인터랙티브 맵에도 업로드가 표시됨.",
    take: "우리 관측을 DOI 붙는 오픈데이터로 발행 → 공공기관이 인용 가능한 권위 확보",
  },
];

// SEA:CUT 이식 대응표.
const MAP_ROWS = [
  ["공통 프로토콜 14개 언어", "정화 참여자용 1페이지 표준 관측 카드 (위치·시각·품목 카테고리 고정)"],
  ["카메라 = 표준 장비", "사진을 관측 스키마 필수 필드로 결합 (photo hash + geo + timestamp)"],
  ["연구기관 사후 검증·조화", "사진 검증 게이트 = 라벨0을 라벨1로 올리는 유일 합법 경로"],
  ["Zenodo DOI + EMODnet 공개", "관측을 DOI 붙는 오픈데이터로 발행 → 공공기관 인용 권위"],
  ["“12 Lessons” 확산 가이드", "소하천 CCTV 협력모델에 동일 프로토콜 채택 제안 → EU 선례로 정당화"],
];

// 사진 검증 게이트 — 라벨0→라벨1 승격 단계(우리 스키마 기준).
const GATE = [
  { step: "업로드", desc: "수거 참여자가 사진 + 위치 + 품목 카테고리를 표준 관측 카드로 제출" },
  { step: "자동 체크", desc: "EXIF·geo·timestamp 정합성 검사 (위·경도 유효, 촬영시각 창 내)" },
  { step: "분류 검토", desc: "사람 또는 약지도 모델이 품목 카테고리 확인 — 여기까지 통과해야 라벨" },
  { step: "라벨 승격", desc: "검증 통과분만 라벨0 → 라벨1로 승격, 오픈데이터로 발행" },
];

// 출처 URL.
const SOURCES: { label: string; url: string }[] = [
  { label: "Plastic Pirates 공식", url: "https://www.plastic-pirates.eu/en" },
  { label: "프로토콜·교재 다운로드", url: "https://www.plastic-pirates.eu/en/material/download" },
  { label: "인터랙티브 맵", url: "https://www.plastic-pirates.eu/en/results/map" },
  { label: "CINEA 성과 요약", url: "https://cinea.ec.europa.eu/featured-projects/plasticpirates-empowering-citizen-science-tackle-plastic-pollution_en" },
  { label: "CINEA 종합 뉴스", url: "https://cinea.ec.europa.eu/news-events/news/pirates-who-took-plastic-tide-2025-12-09_en" },
  { label: "CORDIS 프로젝트 팩트시트 (ID 101088822)", url: "https://cordis.europa.eu/project/id/101088822" },
  { label: "CORDIS 결과 요약", url: "https://cordis.europa.eu/article/id/449183-young-europeans-investigate-plastic-pollution-in-rivers-and-the-ocean" },
  { label: "UNESCO IHP-WINS 등재", url: "https://ihp-wins.unesco.org/citizens4water/project/8" },
  { label: "Horizon Magazine (2026-06)", url: "https://scienceblog.com/horizon/3542/teen-scientists-are-tracking-plastic-pollution-across-europes-rivers/" },
];

export const metadata = {
  title: "시민 수거를 표준 관측·라벨로 — Plastic Pirates 벤치마크",
  description:
    "EU Plastic Pirates: 청소년 2.5만 명이 14개국 390개 강을 공통 프로토콜·사진·전문가 검증으로 측정해 오픈데이터로 공개. SEA:CUT의 '사진 검증 게이트' 정당화 선례.",
};

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14 };

export default function ProtocolPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#eef2f6", color: "#0f172a" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#64748b", fontWeight: 700 }}>SEA:CUT · 시민과학 표준</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.25 }}>
          시민 수거를 <span style={{ color: "#0e7490" }}>표준 관측·라벨</span>로 승격
        </h1>
        <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.65, marginTop: 8, maxWidth: 720 }}>
          유럽 14개국 청소년 <b>2.5만 명</b>이 <b>390개</b> 강·하천·해변을 <b>공통 과학 프로토콜</b>과 <b>사진</b>으로 측정하고,
          연구기관이 검증·조화한 뒤 <b>오픈데이터</b>로 공개했습니다. EU Horizon Europe 미션이 자금을 댄
          <b> Plastic Pirates – Go Europe!</b> 입니다. “시민 수거물 → 사진 + 공통 프로토콜 → 전문가 검증 → 오픈데이터”가
          이미 검증된 파이프라인이라는 뜻 — SEA:CUT은 이 표준을 한국 소하천·하구에 이식합니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, margin: "16px 0 18px" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ ...card, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", color: s.color, marginTop: 1 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* 무엇인가 */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>Plastic Pirates – Go Europe! 이란</div>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, margin: 0 }}>
            2016년 독일에서 시작(<i>Plastik-Piraten</i>)한 청소년 시민과학 캠페인을, EU가 Horizon Europe 미션
            <b> “Restore our Ocean and Waters”</b> 자금으로 <b>2022–2025</b> 유럽 전역으로 확대한 프로젝트(<b>PlasticPiratesEU</b>).
            10–18세 학생 2.5만+ 명, 학급·청소년 그룹 800+ 이 참여해 플라스틱 <b>93,700+ 점</b>(그중 일회용 51,100)을 기록했고,
            미세플라스틱 데이터셋 1,200+ 이 검증·발행됐습니다. 유럽 강 플라스틱에 대한 <b>최초 대규모 오픈데이터셋</b> 중 하나입니다.
          </p>
        </div>

        {/* 4단 파이프라인 */}
        <div style={{ marginTop: 18, fontSize: 12, color: "#64748b", fontWeight: 700 }}>검증된 4단 파이프라인 (→ SEA:CUT 이식 포인트)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 8 }}>
          {PIPELINE.map((p) => (
            <div key={p.n} style={{ ...card, padding: "12px 14px", display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", letterSpacing: "-.02em" }}>{p.n}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>{p.title}</div>
                <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "4px 0 8px" }}>{p.body}</p>
                <div style={{ fontSize: 12, color: "#0e7490", background: "#ecfeff", border: "1px solid #cffafe", borderRadius: 8, padding: "6px 9px", lineHeight: 1.55 }}>
                  <b>→ 이식:</b> {p.take}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 이식 대응표 */}
        <div style={{ marginTop: 18, ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 10 }}>이식 대응표 — Plastic Pirates → SEA:CUT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 1, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <div style={{ background: "#f8fafc", padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#64748b" }}>Plastic Pirates</div>
              <div style={{ background: "#f8fafc", padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#0e7490" }}>SEA:CUT 이식</div>
            </div>
            {MAP_ROWS.map(([a, b], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <div style={{ background: "#fff", padding: "9px 10px", fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{a}</div>
                <div style={{ background: "#fff", padding: "9px 10px", fontSize: 12, color: "#0f172a", fontWeight: 600, lineHeight: 1.5 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 사진 검증 게이트 */}
        <div style={{ marginTop: 18, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>사진 검증 게이트 — 라벨0 → 라벨1</div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            현재 SEA:CUT의 관측 루프는 전부 휴리스틱·약지도(<b>라벨0, 학습형 아님</b>)입니다. 이 게이트가 시민 수거물을
            검증된 <b>라벨1</b>로 올리는 유일한 합법 경로 — 통과분만 오픈데이터로 발행합니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
            {GATE.map((g, i) => (
              <div key={g.step} style={{ position: "relative", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 11px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#0e7490" }}>STEP {i + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{g.step}</div>
                <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.55, marginTop: 3 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 정직성 경계 */}
        <div style={{ marginTop: 16, padding: "13px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, fontSize: 12.5, color: "#92400e", lineHeight: 1.7 }}>
          <b>정직성 경계.</b> “사진 검증 게이트”라는 표현은 SEA:CUT의 프레이밍입니다. 원문이 확증하는 것은
          (a) 카메라가 표준 채집 도구이고 (b) 연구기관이 데이터를 사후 검증·조화한다는 두 사실뿐이며,
          “업로드 시 사진이 자동 통과 게이트가 된다”는 강제 검증 로직은 공개 문서에서 명시적으로 확인되지 않았습니다.
          인용·제안 시 이 구분을 유지해야 합니다.
        </div>

        {/* 출처 */}
        <div style={{ marginTop: 18, ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>출처 (원문)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 5 }}>
            {SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#0e7490", textDecoration: "none", lineHeight: 1.5, display: "flex", gap: 6 }}>
                <span style={{ color: "#cbd5e1" }}>›</span>
                <span><span style={{ fontWeight: 600 }}>{s.label}</span> <span style={{ color: "#94a3b8", wordBreak: "break-all" }}>{s.url}</span></span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "#94a3b8", lineHeight: 1.75 }}>
          수치 표기: 강만 세면 360+, 해변 포함 390(기사별 상이). 본 페이지는 공개 자료 기반 벤치마크 컨텍스트이며 안전·정책 자문이 아닙니다.
          근거 메모: <code>memory/plastic-pirates-benchmark.md</code>.
        </div>

        <div style={{ marginTop: 22, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          ← <a href="/" style={{ color: "#0e7490", textDecoration: "underline" }}>openc 메인 (제안서)</a> ·{" "}
          <a href="/streams" style={{ color: "#0e7490", textDecoration: "underline" }}>전국 소하천 정비율</a> ·{" "}
          <a href="/eulsukdo" style={{ color: "#0e7490", textDecoration: "underline" }}>을숙도 하구 후보지</a> ·{" "}
          <a href="/dashboard" style={{ color: "#0e7490", textDecoration: "underline" }}>운영·안전 대시보드</a>
        </div>
      </div>
    </main>
  );
}
