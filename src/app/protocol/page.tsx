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

// 현장 네 그룹 분업 — 4번째가 '검증(사진)'. 우리 사진 검증 게이트의 원형.
// 근거: Horizon Magazine 기사(2026-06-25) "강둑에서 데이터베이스까지".
const GROUPS = [
  { n: "1", role: "기록", desc: "강의 특정 구간을 맡아 발견되는 플라스틱의 양을 기록" },
  { n: "2", role: "수거·분류", desc: "발견된 플라스틱 쓰레기를 수거하고 카테고리로 분류" },
  { n: "3", role: "미세플라스틱", desc: "미세 그물로 채집 → 연구실로 보내 입자 수 정량 분석" },
  { n: "4", role: "검증 (사진)", desc: "전 과정을 사진으로 기록 → 연구원이 이 사진으로 학생 판단을 재확인·검증", hi: true },
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
  { label: "프로젝트 소개 영상 (YouTube)", url: "https://www.youtube.com/watch?v=Jvi7yeCbbyI" },
  { label: "Zenodo 데이터셋 — Riverbank 대형쓰레기 v2.0.0 (직접 분석)", url: "https://doi.org/10.5281/zenodo.15535434" },
  { label: "Zenodo 데이터셋 — 플로팅 매크로·메소·마이크로", url: "https://doi.org/10.5281/zenodo.15535538" },
  { label: "데이터셋 발행 안내 (Plastic Pirates news)", url: "https://www.plastic-pirates.eu/en/news/milestone-achieved-plastic-pirates-datasets-published-zenodo" },
  { label: "동료심사 논문 — 프랑스 강변·해변 시민과학 비교 (ESPR 2024)", url: "https://link.springer.com/article/10.1007/s11356-024-35506-w" },
];

// 해안·해변 부클릿(원문 프로토콜) 다섯 그룹.
// 근거: docs/PP-해안해변-부클릿-번역분석-심층스터디.md (PP_coastal booklet_EN_final.pdf 전문 분석).
const BOOK_GROUPS = [
  { g: "A", name: "해변 위 쓰레기", size: "4~6", task: "트랜섹트·3해변대(조간대·상조대·식생대) 3×3m 방형구, 담배꽁초 크기 이상 계수, m²당 환산" },
  { g: "B", name: "쓰레기 다양성", size: "6~8", task: "분류 스테이션에서 ~25개 카테고리 분류·계수·무게, 일회용 플라스틱 비율 산출" },
  { g: "C", name: "리터 포렌식", size: "3~4", task: "문자 있는 품목 촬영 → 언어·통화·브랜드로 원산지·제조사 식별, 열화도 기록" },
  { g: "D", name: "리포터 팀 (검증)", size: "4~6", task: "전 과정 사진·영상, 발생원·기상·좌표(십진도) 기록, 총괄 대조·기사 작성", hi: true },
  { g: "＋", name: "미세플라스틱", size: "4~6", task: "만조선 1×1m 방형구 5cm 굴착, 체(망목 1mm)로 분리·계수, m²당 환산" },
];

// 폐기물 카테고리(그룹 B) — 우리 관측 스키마로 직접 채용 가능한 국제 정합 분류.
const CATEGORIES = [
  "비닐봉투", "음료 페트병", "페트병 뚜껑", "테이크아웃·패스트푸드 포장", "일회용 수저·접시·빨대",
  "과자·칩 포장", "면봉", "물티슈·위생용품", "스티로폼", "소형 플라스틱 <2.5cm",
  "음료캔", "병뚜껑", "알루미늄 포일", "유리병", "담배꽁초", "종이", "섬유", "고무", "풍선", "지역 쓰레기",
];

// 핵심 사실 스트립 — CINEA 종합(2025-12-09) + 교사 설문(120명).
const KEY_FACTS = [
  { v: "3 → 14개국", l: "독일 단독(2016) → 트리오(2020) → EU 14개국" },
  { v: "14개 언어", l: "교재·과학 프로토콜 제공" },
  { v: "26개+ 기관", l: "데이터 처리·검증(IMIS·MDA 통합)" },
  { v: "91 / 88 / 99%", l: "교사 설문: 내년 지속 / 타 교사 추천 / 인식효과" },
];

// 실측 오픈데이터셋 검증 로그 — 그룹 단위 실격 사유(사진 관련이 압도적).
// 근거: Zenodo DOI 10.5281/zenodo.15535434 Riverbank v2.0.0 (771건) 직접 분석.
const DISQUAL = [
  { reason: "사진 없음 (‘no photos available’)", n: 30, photo: true },
  { reason: "쓰레기 수와 재질 불일치", n: 26, photo: false },
  { reason: "사진 없음 (‘no photos’)", n: 25, photo: true },
  { reason: "쓰레기는 있으나 사진 0장", n: 19, photo: true },
  { reason: "사진 없음 (‘no photo’)", n: 17, photo: true },
  { reason: "사진 미제출로 반려", n: 15, photo: true },
  { reason: "사진↔데이터 시트 불일치", n: 13, photo: true },
  { reason: "사진 속 품목이 겹침", n: 12, photo: true },
  { reason: "방법 미준수", n: 11, photo: false },
];

// 데이터 수집의 한계(문서화·실측 근거) ↔ 그래도 성립하는 활용사례.
const LIMITS = [
  {
    lim: "면적·무게는 전문가 미검증",
    ev: "README 명시: 그룹 B의 강변 길이·너비, 플라스틱·전체 무게는 전문가가 검증할 수 없었음.",
    use: "밀도(개/㎡)·질량 플럭스의 분모가 불확실 → 절대량 추정에 쓰지 말 것. 무게는 우리 수거 중량 앵커(/api/observations/anchor)로 독립 확보.",
  },
  {
    lim: "입지는 무작위가 아닌 편의표집",
    ev: "학교가 접근 가능한 지점을 선택. 방형구는 국소 무작위지만 지점 자체는 대표성 없음.",
    use: "‘한 나라 강의 평균’으로 일반화 금지. 상대적 구성·핫스팟 순위·발생원 신호로만 사용.",
  },
  {
    lim: "계수 주관·잔차 오류",
    ev: "사진 검증 후에도 ‘사진↔데이터 불일치’·‘품목 겹침’ 실격이 존재. 아동 분류의 잔차 오류.",
    use: "개별 표본은 약라벨(라벨0)로. 대량 평균으로 개별 오류 상쇄(Ackermann) — 집계 패턴만 신뢰.",
  },
  {
    lim: "시공간 편중·연도 모호",
    ev: "캠페인 쏠림(가을 2022 251 vs 봄 2022 1건). ‘캠페인 연도 ≠ 실제 채취 연도’ 주석, 좌표는 학생이 지도로 추정.",
    use: "계절·연도 비교는 캠페인 메타로 보정. 추세는 다수 캠페인 누적 후에만.",
  },
];

// 우리가 직접 집계한 결과 — Riverbank v2.0.0 그룹B 채택 545건·79,947점.
const COMPUTED_CATS = [
  { ko: "담배꽁초", pct: 16.0 }, { ko: "유리 조각", pct: 11.7 }, { ko: "식별불가 플라스틱", pct: 8.2 },
  { ko: "물티슈·위생용품", pct: 8.2 }, { ko: "종이", pct: 7.3 }, { ko: "과자 포장", pct: 6.8 },
  { ko: "소형 플라스틱 <2.5cm", pct: 6.3 }, { ko: "비닐봉투", pct: 5.1 }, { ko: "스티로폼", pct: 4.5 }, { ko: "음료 페트병", pct: 4.3 },
];
// 그룹D 채택 607건 — 발생원 지목(yes+possibly) 비율.
const COMPUTED_SOURCES = [
  { ko: "방문객", pct: 90 }, { ko: "주민", pct: 77 }, { ko: "무단투기", pct: 48 },
  { ko: "어업", pct: 38 }, { ko: "농업", pct: 28 }, { ko: "산업", pct: 24 }, { ko: "해운", pct: 13 },
];
// PP 필드 → SEA:CUT 관측 스키마 매핑.
const SCHEMA_MAP = [
  ["SamplingRiver / RiverSystem", "river / river_system"],
  ["SamplingCoordinates Lat·Lng (십진도)", "geo.lat / geo.lng"],
  ["SamplingDate (ISO 8601) · Campaign", "observed_at · campaign(계절+연도)"],
  ["…_Results_* 카테고리 카운트 ×20", "items[] (category, count)"],
  ["ProportionSingleUsePlastic %", "single_use_ratio"],
  ["Source{Residents…Fishing}", "sources[] (yes/possibly/no)"],
  ["Weather{Rain·Storm·Heat}", "weather[]"],
  ["DatasetQualified · DisqualifiedReason", "label_status(0/1) · reject_reason"],
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

        {/* 인터랙티브 맵 + 영상 CTA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8, marginBottom: 10 }}>
          <a href="https://www.plastic-pirates.eu/en/results/map" target="_blank" rel="noopener noreferrer"
            style={{ ...card, padding: "12px 14px", textDecoration: "none", background: "linear-gradient(135deg,#ecfeff,#fff)", borderColor: "#a5f3fc" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0e7490" }}>🗺 인터랙티브 맵</div>
            <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5, marginTop: 3 }}>업로드된 각 그룹의 표본이 유럽 지도에 표시 — 자국·유럽 평균과 실시간 비교.</div>
          </a>
          <a href="https://www.youtube.com/watch?v=Jvi7yeCbbyI" target="_blank" rel="noopener noreferrer"
            style={{ ...card, padding: "12px 14px", textDecoration: "none" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#b91c1c" }}>▶ 프로젝트 소개 영상</div>
            <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5, marginTop: 3 }}>Plastic Pirates 활동·방법론을 담은 공식 설명 영상(YouTube).</div>
          </a>
        </div>

        {/* 핵심 사실 스트립 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 18 }}>
          {KEY_FACTS.map((f) => (
            <div key={f.l} style={{ ...card, padding: "9px 12px" }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.02em", color: "#0e7490" }}>{f.v}</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1, lineHeight: 1.4 }}>{f.l}</div>
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

        {/* 현장 네 그룹 분업 */}
        <div style={{ marginTop: 18, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>현장 네 그룹 분업 — 4번째가 “검증”</div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            참여 청소년은 임무별 <b>네 그룹</b>으로 나뉩니다. 마지막 그룹의 임무가 바로 <b>검증</b> — 전 과정을 사진으로 찍고,
            연구원이 그 사진으로 학생의 판단을 재확인합니다. SEA:CUT “사진 검증 게이트”의 원형이 이미 프로토콜에 있습니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
            {GROUPS.map((g) => (
              <div key={g.n} style={{
                background: g.hi ? "#ecfeff" : "#f8fafc",
                border: `1px solid ${g.hi ? "#a5f3fc" : "#e2e8f0"}`,
                borderRadius: 10, padding: "10px 11px",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: g.hi ? "#0e7490" : "#94a3b8" }}>그룹 {g.n}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{g.role}</div>
                <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.55, marginTop: 3 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 신뢰성·비용 논거 */}
        <div style={{ marginTop: 12, ...card, padding: "14px 16px", borderLeft: "3px solid #0e7490" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>데이터는 믿을 만한가 — 코디네이터의 답</div>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
            “샘플을 많이 추출하면 개별 오류의 중요성이 줄어듭니다. 게다가 <b>사진을 통해 모든 결과를 검증</b>합니다.
            어떤 면에서는 아이들의 데이터가 전문 연구자들이 수집한 데이터보다 더 신뢰할 만한 것으로 드러났습니다.”
          </p>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 8, lineHeight: 1.6 }}>
            — Philipp Ackermann, PlasticPiratesEU 코디네이터(독일 DLR 프로젝트 관리기관). 강 플라스틱 데이터가 희소한 이유는
            <b> 조사 비용이 막대</b>하기 때문 — 시민과학이 이를 비용효율적으로 메웁니다. “바다로 흘러드는 플라스틱의 <b>70%가 강</b>에서 발생.”
          </div>
        </div>

        {/* 지역 패턴 */}
        <div style={{ marginTop: 12, ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>드러난 지역 패턴 (정책 훅)</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.7 }}>
            <li><b>일회용 플라스틱</b>(빨대·음식 용기·비닐봉투)이 모든 국가에서 쓰레기의 대부분 — 발생원은 강·해변 인근 <b>주민·방문객</b>.</li>
            <li>스페인은 예외적으로 <b>물티슈</b> 오염이 두드러짐 → 향후 정책 변화의 근거가 될 수 있는 통찰.</li>
            <li>담수 생태학자 Meritxell Abril Cuevas(스페인 Vic 대학 BETA Tech Center, FECYT 지원) 등 연구자가 학생을 지도·검증.</li>
          </ul>
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

        {/* 원문 프로토콜 심층 — 해안·해변 부클릿 */}
        <div style={{ marginTop: 18, ...card, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>원문 프로토콜 심층 — 해안·해변 부클릿</div>
            <code style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", borderRadius: 6, padding: "2px 7px" }}>docs/PP-해안해변-부클릿-번역분석-심층스터디.md</code>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            공개 부클릿(<i>Coasts and Beaches</i>, DLR 2024) 전문을 번역·분석했습니다. 10–16세 청소년이
            과학 훈련 없이도 <b>비교가능한 데이터</b>를 생산하는 완성형 프로토콜 — SEA:CUT이 이식할 관측 카드·카테고리·게이트의 원형입니다.
          </p>

          {/* 킬러 인용 — 사진이 표본 채택의 전제조건 */}
          <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 10, padding: "11px 13px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0e7490", marginBottom: 3 }}>⭐ 프로토콜 레벨의 강제 사진 게이트</div>
            <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
              “쓰레기가 없어도 각 표본점을 반드시 촬영하라. <b>그러지 않으면 여러분의 결과는 과학 연구에 포함될 수 없다.</b>”
            </p>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 5 }}>
              — 그룹 A 방법. 사진은 기록이 아니라 <b>표본 채택의 전제조건</b>. 우리 “사진 검증 게이트”는 이걸 자동 EXIF/geo 검사로 자동화·엄격화한 것.
            </div>
          </div>

          {/* 다섯 그룹 */}
          <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>표본 채취 — 다섯 그룹 분업</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {BOOK_GROUPS.map((b) => (
              <div key={b.g} style={{
                display: "grid", gridTemplateColumns: "26px 1fr", gap: 9, alignItems: "start",
                background: b.hi ? "#ecfeff" : "#f8fafc", border: `1px solid ${b.hi ? "#a5f3fc" : "#e2e8f0"}`,
                borderRadius: 9, padding: "8px 10px",
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: b.hi ? "#0e7490" : "#cbd5e1", textAlign: "center" }}>{b.g}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>{b.name} <span style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8" }}>· {b.size}명</span></div>
                  <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginTop: 1 }}>{b.task}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 카테고리 칩 */}
          <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, margin: "12px 0 6px" }}>폐기물 카테고리 ~20종 (→ 관측 스키마로 채용)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {CATEGORIES.map((c) => (
              <span key={c} style={{ fontSize: 11, color: "#334155", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "3px 9px" }}>{c}</span>
            ))}
          </div>

          {/* 관측 카드 필드 */}
          <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
            <b style={{ color: "#0f172a" }}>표준 관측 카드 필드</b>(업로드 폼): 그룹명 · 참여자 수 · <b>표본 채취일</b> · <b>강/하천 이름</b> · <b>위치·좌표(십진도)</b> · 사진 · 발생원(주민·방문객·산업·농업·해운·어업) · 최근 7일 기상. 캠페인 종료 <b>2주 내</b> 제출.
          </div>
        </div>

        {/* 실측 오픈데이터셋 — 사진 게이트가 실제로 작동 */}
        <div style={{ marginTop: 18, ...card, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>실측 오픈데이터셋 — 사진 게이트는 실제로 작동한다</div>
            <a href="https://doi.org/10.5281/zenodo.15535434" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: "#0e7490", fontWeight: 600 }}>Zenodo DOI →</a>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            공개된 <b>Riverbank 대형쓰레기 데이터셋 v2.0.0</b>(12개국·2022~2024·5개 캠페인, <b>771건</b>)을 직접 분석했습니다.
            각 표본에 <code>DatasetQualified</code>·<code>DisqualifiedReason</code> 검증 필드가 붙어 있고 —
            <b> 그룹 단위 실격 사유의 압도적 다수가 “사진” 관련</b>입니다(사진 언급 371건). 사진이 없으면 표본은 데이터로 채택되지 않습니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 5 }}>
            {DISQUAL.map((d) => {
              const max = 30;
              return (
                <div key={d.reason} style={{ display: "grid", gridTemplateColumns: "1fr 34px", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", height: 20, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(d.n / max) * 100}%`, background: d.photo ? "#0891b2" : "#cbd5e1", borderRadius: 5 }} />
                    <span style={{ position: "absolute", left: 8, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{d.reason}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textAlign: "right" }}>{d.n}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8" }}>
            <span style={{ width: 10, height: 10, background: "#0891b2", borderRadius: 3, display: "inline-block" }} /> 사진 관련 실격
            <span style={{ width: 10, height: 10, background: "#cbd5e1", borderRadius: 3, display: "inline-block", marginLeft: 8 }} /> 기타
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#334155", lineHeight: 1.65, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px" }}>
            데이터셋 단위로는 727건 채택 / 31건 실격 / 13건 na. 검증은 파트너 기관 → VLIZ·NIB 2차 품질관리 → VLIZ 조화·표준화·발행.
            스키마의 <code>Source*</code>(주민·방문객·산업·농업·해운·어업)·<code>Weather_*</code>·좌표·강명 필드는 우리 관측 스키마로 직접 이식 가능.
          </div>
        </div>

        {/* 우리가 직접 집계한 결과 */}
        <div style={{ marginTop: 12, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>우리가 직접 집계한 결과 — 재인용이 아닌 독립 분석</div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            보도자료를 인용한 게 아니라, 공개 CSV를 직접 집계했습니다(그룹B 채택 <b>545건·79,947점</b>). 강변 대형쓰레기 1위는
            <b> 담배꽁초(16.0%)</b> — 일회용 포장이 아니라 흡연·위생·파편류가 상위. 일회용 플라스틱 비율은 평균 <b>31.3%</b>(중앙값 27.6%).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>품목 구성 상위 10 (비중)</div>
              <div style={{ display: "grid", gap: 4 }}>
                {COMPUTED_CATS.map((c) => (
                  <div key={c.ko} style={{ display: "grid", gridTemplateColumns: "94px 1fr 34px", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10.5, color: "#334155", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.ko}</span>
                    <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${c.pct / 16 * 100}%`, background: "#0891b2", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", textAlign: "right" }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>발생원 지목률 (그룹D, yes+possibly)</div>
              <div style={{ display: "grid", gap: 4 }}>
                {COMPUTED_SOURCES.map((s) => (
                  <div key={s.ko} style={{ display: "grid", gridTemplateColumns: "52px 1fr 34px", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10.5, color: "#334155", fontWeight: 600 }}>{s.ko}</span>
                    <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: s.pct >= 70 ? "#0e7490" : "#94a3b8", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", textAlign: "right" }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 7, lineHeight: 1.5 }}>
                발생원 1·2위 = <b>방문객·주민</b>(육상 생활계). 그룹A 밀도 평균 0.88개/㎡(중앙값 0.48). → 소하천 발생원 라벨 우선순위와 정렬.
              </div>
            </div>
          </div>
        </div>

        {/* PP → SEA:CUT 스키마 매핑 */}
        <div style={{ marginTop: 12, ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 10 }}>스키마 매핑 — PP 데이터 필드 → SEA:CUT 관측 스키마</div>
          <div style={{ display: "grid", gap: 1, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <div style={{ background: "#f8fafc", padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>Plastic Pirates (Zenodo)</div>
              <div style={{ background: "#f8fafc", padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#0e7490" }}>/api/observations</div>
            </div>
            {SCHEMA_MAP.map(([a, b]) => (
              <div key={a} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <div style={{ background: "#fff", padding: "7px 10px", fontSize: 11, color: "#334155", fontFamily: "ui-monospace,monospace" }}>{a}</div>
                <div style={{ background: "#fff", padding: "7px 10px", fontSize: 11, color: "#0f172a", fontWeight: 600, fontFamily: "ui-monospace,monospace" }}>{b}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 8, lineHeight: 1.55 }}>
            공개 데이터셋 2종: <b>강변 대형쓰레기</b>(DOI 15535434, 위 분석) + <b>플로팅 매크로·메소·마이크로</b>(DOI 15535538). 둘 다 12/10개국·5개 캠페인·동일 검증 파이프라인.
          </div>
        </div>

        {/* 정직성 경계 */}
        <div style={{ marginTop: 16, padding: "13px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, fontSize: 12.5, color: "#92400e", lineHeight: 1.7 }}>
          <b>정직성 경계(정정).</b> 원문 부클릿은 <b>사진을 표본 채택의 전제조건으로 명문화</b>합니다 —
          “사진이 없으면 결과가 과학 연구에 포함될 수 없다”. 즉 강제 사진 게이트가 프로토콜 레벨에 이미 존재합니다.
          다만 검증 판정은 <b>연구 파트너의 사후 과학 평가</b>로 이뤄지며, SEA:CUT이 더하는 것은 <b>업로드 시점의 자동 EXIF/geo 검사</b>입니다.
          “EU 프로토콜이 채택한 강제 사진 게이트를 SEA:CUT은 업로드 단계에서 자동화·엄격화한다”가 정확한 프레이밍입니다.
        </div>

        {/* 데이터 수집의 한계 ↔ 활용사례 심층 */}
        <div style={{ marginTop: 18, ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>데이터 수집의 한계 ↔ 그래도 성립하는 활용사례</div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.65, margin: "5px 0 12px", maxWidth: 720 }}>
            시민과학 데이터에는 분명한 한계가 있습니다. 중요한 건 <b>한계를 숨기지 않고, 그 한계 안에서 성립하는 용도로만 쓰는 것</b>입니다.
            아래는 문서·실측으로 확인된 한계와, 그럼에도 정당한 활용사례입니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {LIMITS.map((l) => (
              <div key={l.lim} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#fef2f2", padding: "8px 11px", fontSize: 12.5, fontWeight: 800, color: "#b91c1c" }}>⚠ {l.lim}</div>
                <div style={{ padding: "8px 11px", fontSize: 11.5, color: "#64748b", lineHeight: 1.55, borderBottom: "1px solid #f1f5f9" }}>
                  <b style={{ color: "#94a3b8" }}>근거:</b> {l.ev}
                </div>
                <div style={{ padding: "8px 11px", fontSize: 12, color: "#0f172a", lineHeight: 1.6, background: "#ecfeff" }}>
                  <b style={{ color: "#0e7490" }}>→ 활용:</b> {l.use}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 11, fontSize: 12, color: "#334155", lineHeight: 1.7, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 11px" }}>
            <b style={{ color: "#0f172a" }}>SEA:CUT 사용 원칙.</b> 시민 수거 데이터는 <b>절대량(플럭스)</b>이 아니라 <b>상대적 구성·발생원·핫스팟</b> 신호로 쓴다.
            개별 카운트는 <b>약라벨(라벨0)</b>로 취급하고, 사진 게이트 통과분만 라벨1로 승격. 절대 질량은 우리 <b>수거 중량 앵커</b>로 독립 확보(<code>/api/observations/anchor</code>),
            표류 예측은 드리프터 실측으로 폐루프 검증(<code>/api/litter-risk/validate</code>). 즉 <b>한계를 앵커·검증으로 감싸는</b> 설계.
          </div>
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
