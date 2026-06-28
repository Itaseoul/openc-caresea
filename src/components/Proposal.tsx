import Dashboard from "@/components/Dashboard";

// SEA:CUT 로그프레임 제안 페이지. 콘텐츠 출처 docs/CHANGEX_PAGE_CONTENT.md.
// 서버 컴포넌트(정적) + 근거3 섹션에 클라이언트 Dashboard 임베드.

const LOGFRAME: { k: string; t: string; d: string }[] = [
  { k: "Mission", t: "사명", d: "도시 하천 병목의 부유 쓰레기가 바다로 유입되는 것을 시민 참여로 줄이고, 작은 하천의 데이터 사각지대를 공개 데이터로 메운다." },
  { k: "Outcomes", t: "영향", d: "학장천 한 병목에서 부유 쓰레기 흐름이 활동 전후로 달라지는지를 측정 가능한 숫자로 보인다. 도시 소하천은 저수기에도 부유물이 늘 흐르므로 연중 측정하며, 비 직후 폭증 구간은 보너스 고신호 측정창으로 본다. 차단율은 보수적으로 약 팔 퍼센트로 본다. 시민의 책임감 변화를 함께 기록한다." },
  { k: "Outputs", t: "산출", d: "OpenBoom 한 기의 실증, 운영·안전 알리미와 데이터 인프라, 활동 전후 부유 쓰레기 흐름 곡선, 누구나 복제하는 공개 도면과 데이터." },
  { k: "Activities", t: "활동", d: "구청 사전 협의와 점용 허가, 단기·무동력 거치(연중 가능), 주 일 회 시민 수거와 품목 분류, 영상과 수위 기록, 수위 단계에 따른 철거와 원상 복구." },
  { k: "Inputs", t: "투입", d: "삼천만 원을 자재와 설치와 안전과 보험과 수거 운영과 데이터에 배분. 시민과 학교, 공공 데이터 네 종, 작은 하천은 자체 사물인터넷 계측으로 보완." },
  { k: "Governance", t: "거버넌스", d: "운영은 사단법인 이타서울, 점용 허가는 관할 구청, 거버넌스 우산은 글로벌 반려해변 협력체와 부산시, 데이터 백본은 이타시티. OpenBoom 이름과 인증은 안전 기준 충족 복제본에만 부여." },
];

function Section({
  id, eyebrow, title, children,
}: { id?: string; eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-neutral-100 py-12 sm:py-14">
      {eyebrow && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</div>
      )}
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-neutral-700">{children}</div>
    </section>
  );
}

export default function Proposal() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Hero — 물빛 그라데이션 위 깔끔한 헤드라인 */}
      <header className="relative overflow-hidden border-b border-neutral-100 bg-gradient-to-b from-brand-50 via-white to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            SEA:CUT · source to sea
          </div>
          <h1 className="mt-5 text-[1.9rem] font-bold leading-[1.25] tracking-tight text-neutral-900 sm:text-[2.6rem]">
            도시의 작은 하천 병목에서 바다로 흘러가는 부유 쓰레기를,{" "}
            <span className="text-brand-700">시민이 직접 막고 기록하고 공개합니다.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            강이 바다로 쓰레기를 넘기는 그 지점을 시민의 손으로 가로채는 실증 사업입니다. 사단법인 이타서울은 유엔환경계획 글로벌 플라스틱 허브의 등록 회원입니다.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5">
        <Section eyebrow="문제" title="정부도 상시 측정하지 않는 사각지대">
          <p>해양 쓰레기의 팔할 이상은 육지에서 강을 타고 들어옵니다. 그런데 그 통로인 작은 하천은 실시간 감시의 사각지대입니다.</p>
          <p>국가하천과 지방하천은 실시간 수위 관측망이 있지만, 작은 하천은 별도 법으로 관리되고 전국 이만 이천여 곳에 이릅니다. 일부에 자동 계측이 설치되고 있으나 목표는 전체의 십분의 일이며 그 데이터도 기관 내부에서만 흐릅니다. 공개된 실시간 수위 자료는 사실상 없습니다.</p>
        </Section>

        <Section eyebrow="접근" title="같은 원리, 그러나 오픈소스">
          <p>세계에는 이미 작은 하천의 부유 쓰레기를 막는 검증된 장치가 있습니다. 미국 Osprey Initiative의 Litter Gitter는 특허 장치이며 설치와 유지와 수거를 회사가 대행하는 상용 서비스입니다. 효과는 분명하지만 한 회사가 소유하고 운영하므로 다른 지역이 스스로 재현하기 어렵습니다.</p>
          <p>SEA:CUT의 OpenBoom은 같은 수리 원리를 따르되 도면과 자재 명세와 운영 절차를 모두 공개합니다. 한 곳에서 검증한 설계를 다른 마을이 추가 비용을 거의 들이지 않고 그대로 세울 수 있습니다. 우리의 성공 지표는 우리가 몇 킬로그램을 건졌는가가 아니라, 제삼의 시민 단체가 우리 도움 없이 다른 하천에 같은 붐을 세웠는가입니다.</p>
        </Section>

        <Section eyebrow="설계" title="로그프레임">
          <div className="grid gap-3 sm:grid-cols-2">
            {LOGFRAME.map((r) => (
              <div
                key={r.k}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-brand-700">{r.k}</span>
                  <span className="text-sm text-neutral-500">{r.t}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{r.d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="핵심 산출" title="OpenBoom — 오픈소스 차단 붐">
          <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 sm:p-6">
            <p className="text-neutral-700">작은 하천 전용의 오픈소스 표층 부유 쓰레기 차단 붐입니다. 밀폐형 재생 고밀도 폴리에틸렌 부체를 쓰며 폐스티로폼은 쓰지 않습니다. 표층만 막아 어류와 새는 통과시키고, 홍수 시 한쪽 연결이 끊어지는 안전 장치를 둡니다. 하상을 굴착하지 않습니다.</p>
            <p className="text-neutral-700">물리 설계만이 아니라 자재 조달과 교육과 진입 단계와 데이터 표준과 행정 협의 방법까지 하나의 생태계로 공개합니다. 폭 삼사 미터 작은 하천 한 칸을 최소 복제 단위로 표준화하여 한두 사람이 하루 안에 설치하고 철거합니다. 시민이 병목 지점을 사진과 위치로 제보하는 기능을 두되 안전신문고와 중복되지 않게 범위를 한정합니다.</p>
          </div>
        </Section>

        <Section eyebrow="근거" title="source to sea 국제 정합">
          <p>SEA:CUT은 우리의 비유가 아니라 국제 공식 관리 프레임 위에 있습니다. 사단법인 이타서울은 유엔환경계획 글로벌 플라스틱 허브의 등록 회원이며, 육지 기원 오염을 출발지에서 차단한다는 source to sea 원칙을 따릅니다.</p>
        </Section>

        <Section id="dashboard" eyebrow="사전 검증 · 작동하는 증거" title="이미 작동하는 실증 운영·안전 알리미">
          <p>우리는 계획만 제출하지 않습니다. 아래는 공개 데이터로 지금 작동하는 운영·안전 대시보드입니다. 강수와 하천 수위를 한 화면에서 보고, 무동력 차단 붐을 언제 거치·수거·철거할지 판단합니다. 이 시스템·시민 참여·데이터 파이프라인은 계절과 무관하게 연중 굴러가며, 비 직후는 부유물이 폭증하는 보너스 고신호 측정창입니다. 작은 하천의 실시간 수위는 공개 자료가 없어 자체 계측으로 메웁니다.</p>
          <div className="not-prose mt-5">
            <Dashboard />
          </div>
        </Section>

        <Section eyebrow="원칙" title="정직 경계">
          <p className="text-sm leading-7 text-neutral-500">수면 붐은 떠 있는 쓰레기만 잡습니다. 홍수 시 안전이 가장 큰 관문이므로 소형과 탈착과 비굴착으로 대응하고 수위 단계에 따라 철거합니다. 영상 분석은 존재와 추세를 보여주는 보조 수단이며 자동 정확 집계를 약속하지 않습니다. 첫 시도는 학습으로 봅니다. 시 청소를 대체하지 않고 보완하며, 주민에게 무급 노동을 전가하지 않도록 사례비를 예산에 반영합니다.</p>
        </Section>

        <Section eyebrow="확장" title="두 번째 병목의 비용">
          <p>첫 한 기의 한계는 분명합니다. 그러나 OpenBoom의 가치는 두 번째 병목을 세우는 비용이 얼마나 낮아지는가에 있습니다. 한 곳에서 검증한 도면과 데이터와 운영 절차는 공개되어 있어 다른 하천이 처음부터 다시 설계할 필요가 없습니다. 부산 학장천에서 검증한 방법을 다른 도시 하천이 그대로 가져다 쓰는 것이 이 사업의 끝그림입니다.</p>
        </Section>

        <footer className="border-t border-neutral-200 py-10 text-xs leading-6 text-neutral-400">
          출처: 기상청, 한강홍수통제소, 서울특별시(공공누리 제2유형, 비상업), 부산광역시.
          <br />
          powered by 이타시티 · SEA:CUT · openc.caresea.kr
        </footer>
      </div>
    </main>
  );
}
