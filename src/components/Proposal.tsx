import Dashboard from "@/components/Dashboard";
import NakdongMap from "@/components/NakdongMap";
import LitterRiskLoop from "@/components/LitterRiskLoop";

// SEA:CUT 로그프레임 제안 페이지. 콘텐츠 출처 docs/CHANGEX_PAGE_CONTENT.md.
// 서버 컴포넌트(정적) + 근거3 섹션에 클라이언트 Dashboard 임베드.
// ★ 텍스트(카피)는 원문 그대로 보존하고, 이미지·지도·다이어그램·지표로 "보여주는 방식"만 고도화한다.
//   이미지는 전부 공공·공개 라이선스(Wikimedia Commons, public/img/). 출처·라이선스는 푸터에 명시.

const LOGFRAME: { k: string; t: string; d: string; tag: string }[] = [
  { k: "Mission", t: "사명", tag: "왜", d: "도시 하천 병목의 부유 쓰레기가 바다로 유입되는 것을 시민 참여로 줄이고, 작은 하천의 데이터 사각지대를 공개 데이터로 메운다." },
  { k: "Outcomes", t: "영향", tag: "무엇이 달라지나", d: "학장천 한 병목에서 부유 쓰레기 흐름이 활동 전후로 달라지는지를 측정 가능한 숫자로 보인다. 도시 소하천은 저수기에도 부유물이 늘 흐르므로 연중 측정하며, 비 직후 폭증 구간은 보너스 고신호 측정창으로 본다. 차단율은 보수적으로 약 팔 퍼센트로 본다. 시민의 책임감 변화를 함께 기록한다." },
  { k: "Outputs", t: "산출", tag: "만드는 것", d: "OpenBoom 한 기의 실증, 운영·안전 알리미와 데이터 인프라, 활동 전후 부유 쓰레기 흐름 곡선, 누구나 복제하는 공개 도면과 데이터." },
  { k: "Activities", t: "활동", tag: "하는 일", d: "구청 사전 협의와 점용 허가, 단기·무동력 거치(연중 가능), 주 일 회 시민 수거와 품목 분류, 영상과 수위 기록, 수위 단계에 따른 철거와 원상 복구." },
  { k: "Inputs", t: "투입", tag: "넣는 것", d: "삼천만 원을 자재와 설치와 안전과 보험과 수거 운영과 데이터에 배분. 시민과 학교, 공공 데이터 네 종, 작은 하천은 자체 사물인터넷 계측으로 보완." },
  { k: "Governance", t: "거버넌스", tag: "누가 받치나", d: "운영은 사단법인 이타서울, 점용 허가는 관할 구청, 거버넌스 우산은 글로벌 반려해변 협력체와 부산시, 데이터 백본은 이타시티. OpenBoom 이름과 인증은 안전 기준 충족 복제본에만 부여." },
];

// 공개 이미지 메타(출처·라이선스) — public/img/, 원본 Wikimedia Commons.
type ImgMeta = { src: string; place: string; by: string; lic: string; href: string };
const IMG: Record<string, ImgMeta> = {
  eulsukdo: { src: "/img/eulsukdo.jpg", place: "부산 낙동강 하구·을숙도", by: "FriedC", lic: "CC BY-SA 3.0", href: "https://commons.wikimedia.org/wiki/File:Saha-gu_eulsuk-do.jpg" },
  seoul: { src: "/img/seoul-stream.jpg", place: "서울 도심 소하천(은평구)", by: "Huntsmanleader", lic: "CC0", href: "https://commons.wikimedia.org/wiki/File:Eunpyeong-gu_2023-11-07.jpg" },
  thames: { src: "/img/thames-litter.jpg", place: "영국 템스강 부유 쓰레기 트랩", by: "Camster2", lic: "CC BY-SA 3.0", href: "https://commons.wikimedia.org/wiki/File:I_eat_rubbish_-_river_Thames.JPG" },
  bubble: { src: "/img/bubble-barrier.jpg", place: "네덜란드 암스테르담 Great Bubble Barrier", by: "The Great Bubble Barrier", lic: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Bubble_Barrier_Amsterdam.jpg" },
  wheel: { src: "/img/trash-wheel.jpg", place: "미국 볼티모어 Inner Harbor Water Wheel", by: "U.S. Army Corps of Engineers", lic: "Public domain", href: "https://commons.wikimedia.org/wiki/File:Army_Corps_of_Engineers_-_Inner_Harbor_Water_Wheel_-_26723076854.jpg" },
  cleanup: { src: "/img/river-cleanup.jpg", place: "시민 하천 참여·모니터링", by: "U.S. Fish and Wildlife Service", lic: "Public domain", href: "https://commons.wikimedia.org/wiki/File:River_cleanup_(53625668820).jpg" },
  satellite: { src: "/img/sat-sentinel2.jpg", place: "Copernicus Sentinel-2 위성의 해안 관측", by: "European Space Agency", lic: "CC BY-SA 3.0 IGO", href: "https://commons.wikimedia.org/wiki/File:South_Georgia_Island_as_seen_by_Sentinel-2.jpg" },
  drifter: { src: "/img/gps-drifter.jpg", place: "GPS 드리프터(추적 부표) 투하 — NOAA 표류 실측", by: "U.S. Navy / Lt. Cmdr. C. M. Bell", lic: "Public domain", href: "https://commons.wikimedia.org/wiki/File:US_Navy_080120-N-0493B-005_Mineman_2nd_Class_Matthew_Rishovd,_left,_works_with_an_unidentified_Sailor_to_deploy_a_National_Oceanic_and_Atmospheric_Administration_drifter_buoy_off_the_coast_of_Senegal.jpg" },
  edgeShip: { src: "/img/edge-ship.jpg", place: "상업선 기반 해양 모니터링(흑해)", by: "HopsonRoad", lic: "CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Container_ship_Reecon_Whale_on_Black_Sea_near_Constan%C8%9Ba_Romania.jpg" },
  debris: { src: "/img/marine-debris.jpg", place: "수상 부유 쓰레기 집적 — NOAA Marine Debris", by: "NOAA Marine Debris Program", lic: "Public domain", href: "https://commons.wikimedia.org/wiki/File:A_trash-laden_marina_(8009117813).jpg" },
};

// 상단 "지금 바로 확인 가능한 준비" — 사이트가 실제로 보유한 자산을 한 곳에 모은 인덱스(전부 실재 페이지·앵커).
const READY: { href: string; tag: string; title: string; desc: string; icon: IconName }[] = [
  { href: "#dashboard", tag: "가동 중", title: "라이브 운영·안전 대시보드", desc: "강수·하천 수위·호우특보를 한 화면에서 보고 거치·수거·철거를 판단합니다.", icon: "monitor" },
  { href: "#dashboard", tag: "공개데이터 4종", title: "데이터 파이프라인 연동", desc: "기상청·한강홍수통제소·서울특별시·부산광역시를 프록시로 안전 연동.", icon: "data" },
  { href: "/streams", tag: "전국 지도", title: "소하천 정비율 지도", desc: "서울 79.1% ~ 광주 11.5% · 전국 평균 46.5%의 정책 사각지대를 시각화.", icon: "map" },
  { href: "/permit", tag: "문서팩", title: "하천 점용허가 생성기", desc: "거치 스팟별 행정 사전 협의·점용 허가 문서를 자동 구성합니다.", icon: "doc" },
  { href: "/eulsukdo", tag: "실증 후보지", title: "부산 낙동강 하구 입지 검토", desc: "을숙도·학장천 거치 후보와 규제·허가 선결 조건을 사전 분석.", icon: "pin" },
  { href: "https://www.unep.org/", tag: "국제 정합", title: "UNEP 글로벌 플라스틱 허브 회원", desc: "사단법인 이타서울은 등록 회원으로 source to sea 원칙 위에서 활동합니다.", icon: "globe" },
];

// 문제 섹션 지표 — 본문 카피에서 추출한 사실만(새 수치 없음).
const PROBLEM_STATS: { v: string; l: string }[] = [
  { v: "80%+", l: "해양 쓰레기 중 육지·강 기원" },
  { v: "22,000+", l: "전국 작은 하천(소하천) 수" },
  { v: "1/10", l: "자동 계측 설치 목표 비율" },
  { v: "사실상 0", l: "공개된 실시간 수위 자료" },
];

// OpenBoom 설계 스펙 — 본문 카피 기반.
const BOOM_SPECS = [
  "재생 HDPE 밀폐 부체", "폐스티로폼 미사용", "표층만 차단", "어류·조류 통과",
  "홍수 시 한쪽 분리 안전", "비굴착 고정", "폭 3~4m 최소 복제 단위", "1~2인 하루 설치·철거",
];

// 글로벌 AI·데이터 정화 동향 — 검증 사례(원문 직접 확인).
// 근거: docs/글로벌-AI-정화사례-벤치마킹-심층스터디.md, docs/GPS-드리프터-표류실측-심층스터디.md.
// world=세계가 하는 것, take=SEA:CUT이 소하천·시민 규모로 가져오는 것.
const GLOBAL_CASES: { tag: string; title: string; who: string; world: string; take: string }[] = [
  { tag: "시민과학·데이터", title: "유럽 14개국 청소년의 강 플라스틱 추적", who: "PlasticPiratesEU · DLR",
    world: "공통 과학 프로토콜과 사진 검증으로 청소년 2.5만 명이 390개 강을 측정해 오픈데이터로 공개.",
    take: "시민 수거를 표준 관측·라벨로 승격(사진 검증 게이트)." },
  { tag: "엣지 AI", title: "상업선의 저전력 AI 카메라 부유물 탐지", who: "ADIS · The Ocean Cleanup",
    world: "약 6W NPU 카메라가 배 위에서 직접 탐지하고, 원본 영상 대신 잘린 탐지·메타데이터만 전송.",
    take: "OpenBoom 엣지 카메라도 영상 미전송·메타데이터만(비식별·저전력)." },
  { tag: "위성 탐지·예측", title: "위성으로 부유물 탐지하고 표류를 예측", who: "ADOPT · ESA·EPFL",
    world: "Sentinel-2 위성 영상에 머신러닝을 얹어 24시간 표류를 예측하고 정화팀을 그 지점으로 보낸다.",
    take: "위성 대신 근접 카메라가 cm급으로 본다 — 우리는 발생원에 더 가깝다." },
  { tag: "탐지→표류", title: "위성 분할 + 표류 모델로 누적 구역 식별", who: "DEEP-PLAST · 흑해",
    world: "U-Net++ 분할과 Lagrangian 표류 모델로 쓰레기가 쌓이는 곳을 짚는다.",
    take: "하류 퇴적 위험 예측(litter-risk)의 아키텍처 참조." },
  { tag: "경로 최적화", title: "수거선 동선 최적화로 회수 효율 향상", who: "INFORMS · Operations Research",
    world: "비선형 경로 최적화로 같은 비용에 더 많이, 더 짧은 시간에 걷어낸다.",
    take: "시민 수거 동선·붐 비움 출동의 우선순위 최적화." },
  { tag: "표류 실측 (ground truth)", title: "GPS 추적 부표로 쓰레기 경로를 실측", who: "NOAA · 제주 하구 · 갠지스",
    world: "GPS 드리프터를 흘려 실제 표류 경로를 좌표로 기록 — 예측의 정답지를 만든다.",
    take: "고정 붐이 드리프터의 종점 — 발생원→붐 전 경로를 라벨로(회수·재사용)." },
];

function Section({
  id, eyebrow, title, children,
}: { id?: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-neutral-100 py-12 sm:py-14">
      {eyebrow && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</div>
      )}
      <h2 className="mb-4 text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-neutral-700">{children}</div>
    </section>
  );
}

// 이미지 + 캡션(장소·출처·라이선스). 출처는 새 탭 링크.
function Figure({ img, caption, ratio = "aspect-[16/9]", note }: { img: ImgMeta; caption: string; ratio?: string; note?: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
      <div className={`relative w-full ${ratio} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={caption} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2.5 text-[12px] leading-5">
        <span className="font-medium text-neutral-600">{note ?? caption}</span>
        <a href={img.href} target="_blank" rel="noreferrer noopener" className="text-neutral-400 hover:text-brand-700">
          © {img.by} · {img.lic}
        </a>
      </figcaption>
    </figure>
  );
}

export default function Proposal() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* ───────── Hero — 부산 낙동강 하구 실증 무대 위 헤드라인 ───────── */}
      <header className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.eulsukdo.src} alt={IMG.eulsukdo.place} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/80 via-brand-900/70 to-slate-900/85" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden />
            SEA:CUT · source to sea
          </div>
          <h1 className="mt-5 text-balance text-[1.95rem] font-bold leading-[1.25] tracking-tight text-white sm:text-[2.7rem]">
            도시의 작은 하천 병목에서 바다로 흘러가는 부유 쓰레기를,{" "}
            <span className="text-brand-200">시민이 직접 막고 기록하고 공개합니다.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            강이 바다로 쓰레기를 넘기는 그 지점을 시민의 손으로 가로채는 실증 사업입니다. 사단법인 이타서울은 유엔환경계획 글로벌 플라스틱 허브의 등록 회원입니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["연중 단기·무동력 실증", "오픈소스 도면·데이터 공개", "공개 데이터 기반 운영·안전"].map((t) => (
              <span key={t} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <a href="#dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50">
              <MiniIcon name="monitor" /> 작동하는 대시보드 보기
            </a>
            <a href="#ready" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
              준비 현황 한눈에
            </a>
          </div>
        </div>
        <div className="absolute bottom-2.5 right-3 z-10">
          <a href={IMG.eulsukdo.href} target="_blank" rel="noreferrer noopener" className="rounded bg-black/30 px-2 py-0.5 text-[10.5px] text-white/70 backdrop-blur hover:text-white">
            ▲ {IMG.eulsukdo.place} · © {IMG.eulsukdo.by} {IMG.eulsukdo.lic}
          </a>
        </div>
      </header>

      {/* ───────── 소하천 특화 지도 — 가장 메인 ───────── */}
      <section className="border-b border-neutral-100 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-14">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">실증 무대 · 소하천 길목</div>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">
            낙동강 하구로 흘러드는 소하천 길목에서 가로챈다
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-neutral-600">
            바다로 들어오기 직전, 낙동강 지류 소하천 합류부가 SEA:CUT의 무대입니다. 사상구 감전천(엄궁동에서 학장천에 합류해 낙동강으로 드는 길목)은 부산시 협력 데이터 실증을, 사하구 괴정천은 무동력 붐 물리 실증을 맡고, 학장천 엄궁동은 운영·안전 대시보드의 관측 지점입니다. 을숙도 하구는 4중 중첩 규제를 풀며 단계적으로 확장합니다. 부산시와 한국해양과학기술원이 낙동강 하구의 육상 기인 부유 쓰레기를 위성·드론·AI로 분석하는 가운데, SEA:CUT은 그 상류 발생 지점인 소하천 길목에 집중합니다.
          </p>
          <div className="mt-6">
            <NakdongMap />
          </div>
        </div>
      </section>

      {/* ───────── 준비 현황 스트립 — "이 준비들이 가시적으로 보이는" 핵심 ───────── */}
      <section id="ready" className="border-b border-neutral-100 bg-gradient-to-b from-brand-50/70 to-white">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-14">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">지금 바로 확인 가능한 준비</div>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">계획서가 아니라, 이미 굴러가는 자산</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-neutral-600">
            아래는 심사 시점에 주소를 열어 바로 확인할 수 있는 결과물입니다. 라이브 대시보드, 공개 데이터 연동, 정책 지도, 행정 문서 생성기, 실증지 분석이 모두 작동합니다.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {READY.map((r) => {
              const external = r.href.startsWith("http");
              return (
                <a
                  key={r.title}
                  href={r.href}
                  {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                      <MiniIcon name={r.icon} size={20} />
                    </span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">{r.tag}</span>
                  </div>
                  <div className="mt-3.5 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-neutral-900">
                    {r.title}
                    <span className="text-brand-400 transition group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-neutral-500">{r.desc}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5">
        {/* ───────── 문제 ───────── */}
        <Section eyebrow="문제" title="정부도 상시 측정하지 않는 사각지대">
          <Figure
            img={IMG.seoul}
            caption="도시의 작은 하천 — 콘크리트 고가 아래를 흐르는 도심 소하천"
            note="도시의 작은 하천 병목 — 실시간 감시의 사각지대"
          />
          <p>해양 쓰레기의 팔할 이상은 육지에서 강을 타고 들어옵니다. 그런데 그 통로인 작은 하천은 실시간 감시의 사각지대입니다.</p>
          <p>국가하천과 지방하천은 실시간 수위 관측망이 있지만, 작은 하천은 별도 법으로 관리되고 전국 이만 이천여 곳에 이릅니다. 일부에 자동 계측이 설치되고 있으나 목표는 전체의 십분의 일이며 그 데이터도 기관 내부에서만 흐릅니다. 공개된 실시간 수위 자료는 사실상 없습니다.</p>
          <div className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROBLEM_STATS.map((s) => (
              <div key={s.l} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 text-center">
                <div className="text-2xl font-extrabold tracking-tight text-brand-700 sm:text-[1.7rem]">{s.v}</div>
                <div className="mt-1.5 text-[11.5px] leading-4 text-neutral-500">{s.l}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ───────── 접근 = 오픈소스 ───────── */}
        <Section eyebrow="접근" title="같은 원리, 그러나 오픈소스">
          <p>세계에는 이미 작은 하천의 부유 쓰레기를 막는 검증된 장치가 있습니다. 미국 Osprey Initiative의 Litter Gitter는 특허 장치이며 설치와 유지와 수거를 회사가 대행하는 상용 서비스입니다. 효과는 분명하지만 한 회사가 소유하고 운영하므로 다른 지역이 스스로 재현하기 어렵습니다.</p>
          <p>SEA:CUT의 OpenBoom은 같은 수리 원리를 따르되 도면과 자재 명세와 운영 절차를 모두 공개합니다. 한 곳에서 검증한 설계를 다른 마을이 추가 비용을 거의 들이지 않고 그대로 세울 수 있습니다. 우리의 성공 지표는 우리가 몇 킬로그램을 건졌는가가 아니라, 제삼의 시민 단체가 우리 도움 없이 다른 하천에 같은 붐을 세웠는가입니다.</p>

          {/* 상용(특허) vs 오픈소스 대비 */}
          <div className="not-prose grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">상용 · 특허</div>
              <div className="mt-1 text-base font-bold text-neutral-800">Osprey Litter Gitter</div>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-neutral-600">
                <li className="flex gap-2"><span className="text-neutral-300">—</span> 특허 장치, 한 회사가 소유</li>
                <li className="flex gap-2"><span className="text-neutral-300">—</span> 설치·유지·수거를 회사가 대행</li>
                <li className="flex gap-2"><span className="text-neutral-300">—</span> 비용 지불·의뢰 필요, 자립 재현 어려움</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600">오픈소스 · 공유 설계</div>
              <div className="mt-1 text-base font-bold text-brand-900">SEA:CUT OpenBoom</div>
              <ul className="mt-3 space-y-1.5 text-[13px] leading-5 text-brand-900/80">
                <li className="flex gap-2"><span className="text-brand-500">+</span> 도면·자재 명세·운영 절차 전면 공개</li>
                <li className="flex gap-2"><span className="text-brand-500">+</span> 추가 비용 거의 없이 그대로 복제</li>
                <li className="flex gap-2"><span className="text-brand-500">+</span> 성공 지표 = 제삼자가 스스로 세운 붐</li>
              </ul>
            </div>
          </div>

          {/* 참고: 세계에서 운영 중인 다른 검증 사례 갤러리(보조 비주얼, 정확한 출처) */}
          <div className="not-prose mt-2">
            <div className="mb-2.5 text-[12.5px] font-semibold text-neutral-500">참고 — 세계에서 운영 중인 하천 부유물 차단·수거 장치</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Figure img={IMG.thames} ratio="aspect-[4/3]" caption={IMG.thames.place} note="영국 템스강 · 부유 쓰레기 트랩(연 40톤 수거)" />
              <Figure img={IMG.bubble} ratio="aspect-[4/3]" caption={IMG.bubble.place} note="네덜란드 암스테르담 · 기포막 차단(Bubble Barrier)" />
              <Figure img={IMG.wheel} ratio="aspect-[4/3]" caption={IMG.wheel.place} note="미국 볼티모어 · 수차식 부유물 수거(Trash Wheel)" />
            </div>
          </div>
        </Section>

        {/* ───────── 글로벌 동향 = AI·데이터 정화 루프 ───────── */}
        <Section eyebrow="글로벌 동향" title="세계는 'AI·데이터로 닫는 정화 루프'로 간다">
          <p>세계의 하천·해양 정화는 떠 있는 쓰레기를 막는 물리 장치에서, <b>탐지하고 예측하고 최적 동선으로 걷어내는 데이터 루프</b>로 진화하고 있습니다. 특히 The Ocean Cleanup은 한 조직 안에서 데이터 수집·위성 탐지·표류 예측·수거 경로 최적화를 하나의 열린 스택으로 쌓고 있습니다.</p>
          <p>SEA:CUT은 이 흐름을 외해·위성이 아니라 <b>소하천·하구 규모로, 시민·무동력으로</b> 가져옵니다. OpenBoom은 단순한 차단막이 아니라 그 데이터 루프의 첫 계측점입니다.</p>

          {/* 글로벌 사례 이미지 갤러리(자유 라이선스, 출처 표기) */}
          <div className="not-prose">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Figure img={IMG.satellite} ratio="aspect-[4/3]" caption={IMG.satellite.place} note="위성 탐지 — Sentinel-2(ADOPT·DEEP-PLAST)" />
              <Figure img={IMG.drifter} ratio="aspect-[4/3]" caption={IMG.drifter.place} note="GPS 드리프터 — 표류 실측 라벨" />
              <Figure img={IMG.edgeShip} ratio="aspect-[4/3]" caption={IMG.edgeShip.place} note="상업선 엣지 AI(ADIS)" />
              <Figure img={IMG.debris} ratio="aspect-[4/3]" caption={IMG.debris.place} note="해양 부유 쓰레기 실태" />
            </div>
          </div>

          {/* 사례 카드 — 세계가 하는 것 → SEA:CUT이 가져오는 것 */}
          <div className="not-prose grid gap-3 sm:grid-cols-2">
            {GLOBAL_CASES.map((c) => (
              <div key={c.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">{c.tag}</span>
                  <span className="text-[11px] text-neutral-400">{c.who}</span>
                </div>
                <div className="mt-2.5 text-[14.5px] font-bold tracking-tight text-neutral-900">{c.title}</div>
                <p className="mt-1.5 text-[13px] leading-5 text-neutral-600">{c.world}</p>
                <p className="mt-2 flex gap-1.5 text-[13px] leading-5 text-brand-800">
                  <span className="font-bold text-brand-500">→</span>
                  <span><b>SEA:CUT</b> {c.take}</span>
                </p>
              </div>
            ))}
          </div>

          {/* 정직 경계 — 도메인 갭(타 도메인 수치 직접 인용 금지) */}
          <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">정직 경계 · 도메인 갭</div>
            <p className="mt-1.5 text-[13px] leading-6 text-amber-900/80">위성·외해·대형 선단의 성능 수치(예: 수거효율 60% 향상, 탐지 F1 0.84)는 측정 환경이 달라 <b>우리 소하천 성능으로 직접 인용하지 않습니다.</b> SEA:CUT의 강점은 위성 해상도가 아니라, 발생원에 가까운 <b>상류 차단 위치</b>와 고정 붐의 <b>연속 시계열</b>입니다.</p>
          </div>
        </Section>

        {/* ───────── 데이터 루프 작동 — 예측·검증 폐루프 ───────── */}
        <Section eyebrow="데이터 루프" title="예측하고, 실측으로 검증한다 — 작동하는 폐루프">
          <p>글로벌 동향의 데이터 루프를 우리도 이미 돌리고 있습니다. 아래 <b>하류 퇴적 위험 예측</b>은 부산 강우 실값으로 지금 작동하며(물리 휴리스틱 0단계), <b>GPS 드리프터 실측</b>으로 그 예측이 맞았는지 검증합니다. 수거 중량이 "얼마나"의 정답이라면, 드리프터 궤적은 "어디로"의 정답입니다.</p>
          <LitterRiskLoop />
        </Section>

        {/* ───────── 로그프레임 ───────── */}
        <Section eyebrow="설계" title="로그프레임">
          <p className="not-prose -mt-1 text-[13px] text-neutral-500">투입에서 사명까지, 결과의 사슬(results chain)로 설계했습니다.</p>
          <div className="not-prose space-y-2.5">
            {LOGFRAME.map((r, i) => (
              <div key={r.k} className="relative rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">{i + 1}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-bold text-brand-700">{r.k}</span>
                      <span className="text-sm text-neutral-500">{r.t}</span>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium text-neutral-500">{r.tag}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{r.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ───────── OpenBoom ───────── */}
        <Section eyebrow="핵심 산출" title="OpenBoom — 오픈소스 차단 붐">
          <div className="not-prose">
            <BoomDiagram />
          </div>
          <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 sm:p-6">
            <p className="text-neutral-700">작은 하천 전용의 오픈소스 표층 부유 쓰레기 차단 붐입니다. 밀폐형 재생 고밀도 폴리에틸렌 부체를 쓰며 폐스티로폼은 쓰지 않습니다. 표층만 막아 어류와 새는 통과시키고, 홍수 시 한쪽 연결이 끊어지는 안전 장치를 둡니다. 하상을 굴착하지 않습니다.</p>
            <p className="text-neutral-700">물리 설계만이 아니라 자재 조달과 교육과 진입 단계와 데이터 표준과 행정 협의 방법까지 하나의 생태계로 공개합니다. 폭 삼사 미터 작은 하천 한 칸을 최소 복제 단위로 표준화하여 한두 사람이 하루 안에 설치하고 철거합니다. 시민이 병목 지점을 사진과 위치로 제보하는 기능을 두되 안전신문고와 중복되지 않게 범위를 한정합니다.</p>
            <div className="flex flex-wrap gap-2">
              {BOOM_SPECS.map((s) => (
                <span key={s} className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-800">{s}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* ───────── 근거: source to sea ───────── */}
        <Section eyebrow="근거" title="source to sea 국제 정합">
          <div className="not-prose">
            <SourceToSeaDiagram />
          </div>
          <p>SEA:CUT은 우리의 비유가 아니라 국제 공식 관리 프레임 위에 있습니다. 사단법인 이타서울은 유엔환경계획 글로벌 플라스틱 허브의 등록 회원이며, 육지 기원 오염을 출발지에서 차단한다는 source to sea 원칙을 따릅니다.</p>
        </Section>

        {/* ───────── 라이브 대시보드 ───────── */}
        <Section id="dashboard" eyebrow="사전 검증 · 작동하는 증거" title="이미 작동하는 실증 운영·안전 알리미">
          <div className="not-prose -mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            LIVE · 공개 데이터 실시간 연동
          </div>
          <p>우리는 계획만 제출하지 않습니다. 아래는 공개 데이터로 지금 작동하는 운영·안전 대시보드입니다. 강수와 하천 수위를 한 화면에서 보고, 무동력 차단 붐을 언제 거치·수거·철거할지 판단합니다. 이 시스템·시민 참여·데이터 파이프라인은 계절과 무관하게 연중 굴러가며, 비 직후는 부유물이 폭증하는 보너스 고신호 측정창입니다. 작은 하천의 실시간 수위는 공개 자료가 없어 자체 계측으로 메웁니다.</p>
          <div className="not-prose mt-5">
            <Dashboard />
          </div>
        </Section>

        {/* ───────── 정직 경계 ───────── */}
        <Section eyebrow="원칙" title="정직 경계">
          <p className="text-sm leading-7 text-neutral-500">수면 붐은 떠 있는 쓰레기만 잡습니다. 홍수 시 안전이 가장 큰 관문이므로 소형과 탈착과 비굴착으로 대응하고 수위 단계에 따라 철거합니다. 영상 분석은 존재와 추세를 보여주는 보조 수단이며 자동 정확 집계를 약속하지 않습니다. 첫 시도는 학습으로 봅니다. 시 청소를 대체하지 않고 보완하며, 주민에게 무급 노동을 전가하지 않도록 사례비를 예산에 반영합니다.</p>
        </Section>

        {/* ───────── 확장 ───────── */}
        <Section eyebrow="확장" title="두 번째 병목의 비용">
          <Figure
            img={IMG.cleanup}
            caption="시민이 직접 하천을 돌보고 기록하는 참여 — 복제의 출발점"
            note="시민 참여로 굴러가는 운영 — 다음 병목으로 복제되는 모델"
          />
          <p>첫 한 기의 한계는 분명합니다. 그러나 OpenBoom의 가치는 두 번째 병목을 세우는 비용이 얼마나 낮아지는가에 있습니다. 한 곳에서 검증한 도면과 데이터와 운영 절차는 공개되어 있어 다른 하천이 처음부터 다시 설계할 필요가 없습니다. 부산 학장천에서 검증한 방법을 다른 도시 하천이 그대로 가져다 쓰는 것이 이 사업의 끝그림입니다.</p>
          <div className="not-prose flex items-center gap-2 sm:gap-3">
            <ReplicaCard label="학장천 1기" highlight />
            <span className="text-brand-300">→</span>
            <ReplicaCard label="복제 2기" />
            <span className="text-brand-300">→</span>
            <ReplicaCard label="복제 3기" />
            <span className="text-brand-300">→</span>
            <ReplicaCard label="…" muted />
          </div>
        </Section>

        <footer className="space-y-3 border-t border-neutral-200 py-10 text-xs leading-5 text-neutral-400">
          <div className="space-y-1.5">
            <p>
              <span className="font-medium text-neutral-500">데이터 출처</span> · 기상청 · 한강홍수통제소 · 서울특별시 열린데이터광장 · 부산광역시
            </p>
            <p>서울·부산 공공데이터는 공공누리 제2유형(출처표시 + 상업적 이용금지)에 따라 비영리로 표시합니다.</p>
            <p>powered by 이타시티 · SEA:CUT · openc.caresea.kr</p>
          </div>
          <div className="border-t border-neutral-100 pt-3">
            <p className="mb-1.5 font-medium text-neutral-500">이미지 출처 (공공·공개 라이선스, Wikimedia Commons)</p>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {Object.values(IMG).map((m) => (
                <li key={m.src}>
                  <a href={m.href} target="_blank" rel="noreferrer noopener" className="hover:text-brand-700">
                    {m.place} — © {m.by} · {m.lic}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ───────── 복제 단계 카드 ─────────
function ReplicaCard({ label, highlight, muted }: { label: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div
      className={
        "flex-1 rounded-xl border px-2 py-3 text-center text-[12px] font-semibold sm:text-[13px] " +
        (highlight
          ? "border-brand-300 bg-brand-50 text-brand-800"
          : muted
            ? "border-dashed border-neutral-200 bg-white text-neutral-300"
            : "border-neutral-200 bg-white text-neutral-500")
      }
    >
      {label}
    </div>
  );
}

// ───────── OpenBoom 단면 개념도 (SVG) ─────────
function BoomDiagram() {
  return (
    <div className="mb-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <svg viewBox="0 0 440 230" className="h-auto w-full" role="img" aria-label="OpenBoom 단면 개념도 — 표층 차단·어류 통과·홍수 시 분리·비굴착 고정">
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <path d="M0 0 L7 3.5 L0 7 z" fill="#0891b2" />
          </marker>
        </defs>
        {/* 하늘 / 물 / 하상 */}
        <rect x="0" y="0" width="440" height="104" fill="#f8fbfd" />
        <rect x="0" y="104" width="440" height="104" fill="#e0f2fb" />
        <rect x="0" y="208" width="440" height="22" fill="#cbb893" />
        <text x="14" y="96" fontSize="10.5" fill="#64748b">물 흐름 →</text>

        {/* 떠내려온 부유 쓰레기 — 붐 앞(왼쪽)에 모임 */}
        {[[120, 112], [142, 108], [108, 120], [152, 116], [132, 124], [98, 110]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 3} fill="#94a3b8" opacity="0.85" />
        ))}
        <text x="70" y="92" fontSize="9.5" fill="#94a3b8">떠내려온 부유 쓰레기</text>

        {/* 부체(float) — 수면 캡슐 */}
        <rect x="196" y="97" width="30" height="14" rx="7" fill="#0891b2" stroke="#0e7490" strokeWidth="1.5" />
        <text x="211" y="84" textAnchor="middle" fontSize="9.5" fill="#0e7490">재생 HDPE 부체</text>

        {/* 표층 차단막(skirt) */}
        <rect x="206" y="111" width="10" height="40" fill="#0891b2" opacity="0.2" />
        <line x1="211" y1="111" x2="211" y2="151" stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round" />
        <text x="224" y="138" fontSize="9.5" fill="#334155">표층만 차단</text>

        {/* 어류·조류는 막 아래로 통과 */}
        <path d="M286 176 q-18 -7 -40 0" stroke="#0891b2" strokeWidth="1.3" fill="none" markerEnd="url(#arr)" opacity="0.75" />
        <text x="290" y="180" fontSize="13">🐟</text>
        <text x="246" y="196" fontSize="9.5" fill="#334155">어류·조류는 아래로 통과</text>

        {/* 오른쪽: 홍수 시 한쪽 분리(끊어지는 연결=빨강 점선) */}
        <line x1="226" y1="104" x2="332" y2="104" stroke="#dc2626" strokeWidth="1.7" strokeDasharray="4 3" />
        <circle cx="332" cy="104" r="3.5" fill="#dc2626" />
        <text x="332" y="90" textAnchor="end" fontSize="9.5" fill="#dc2626">홍수 시 한쪽 분리(안전)</text>

        {/* 왼쪽: 비굴착 측면 고정 */}
        <line x1="196" y1="104" x2="96" y2="104" stroke="#475569" strokeWidth="1.7" />
        <rect x="84" y="97" width="13" height="14" rx="2" fill="#475569" />
        <text x="90" y="128" textAnchor="middle" fontSize="9.5" fill="#475569">비굴착 측면 고정</text>
      </svg>
    </div>
  );
}

// ───────── source to sea 흐름 다이어그램 (SVG) ─────────
function SourceToSeaDiagram() {
  return (
    <div className="mb-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4">
      <svg viewBox="0 0 420 96" className="h-auto w-full" role="img" aria-label="source to sea — 육지에서 바다까지">
        <defs>
          <marker id="s2s" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <path d="M0 0 L7 3.5 L0 7 z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* 노드 1: 육지(도시) */}
        <g>
          <rect x="8" y="30" width="96" height="40" rx="10" fill="#f1f5f9" stroke="#e2e8f0" />
          <text x="56" y="48" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">육지 · 도시</text>
          <text x="56" y="62" textAnchor="middle" fontSize="9.5" fill="#64748b">쓰레기 발생원</text>
        </g>
        <line x1="104" y1="50" x2="158" y2="50" stroke="#94a3b8" strokeWidth="1.6" markerEnd="url(#s2s)" />
        {/* 노드 2: 소하천 병목 = SEA:CUT 차단 지점 */}
        <g>
          <rect x="160" y="22" width="100" height="56" rx="10" fill="#ecfeff" stroke="#a5f3fc" strokeWidth="1.6" />
          <text x="210" y="42" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0e7490">소하천 병목</text>
          <text x="210" y="56" textAnchor="middle" fontSize="9.5" fill="#0891b2">SEA:CUT OpenBoom</text>
          <text x="210" y="69" textAnchor="middle" fontSize="9.5" fill="#0891b2">여기서 가로챈다</text>
        </g>
        <line x1="260" y1="50" x2="314" y2="50" stroke="#94a3b8" strokeWidth="1.6" markerEnd="url(#s2s)" />
        {/* 노드 3: 바다 */}
        <g>
          <rect x="316" y="30" width="96" height="40" rx="10" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="364" y="48" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1d4ed8">바다</text>
          <text x="364" y="62" textAnchor="middle" fontSize="9.5" fill="#3b82f6">유입 차단 대상</text>
        </g>
      </svg>
    </div>
  );
}

// ───────── 미니 아이콘 ─────────
type IconName = "monitor" | "data" | "map" | "doc" | "pin" | "globe";
function MiniIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "monitor":
      return <svg {...c}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
    case "data":
      return <svg {...c}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" /></svg>;
    case "map":
      return <svg {...c}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>;
    case "doc":
      return <svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>;
    case "pin":
      return <svg {...c}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "globe":
      return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" /></svg>;
  }
}
