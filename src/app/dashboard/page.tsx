import Dashboard from "@/components/Dashboard";

// 대시보드 단독 페이지 (운영용). 메인(/)에도 근거 섹션으로 임베드됨.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">SEA:CUT · 실증 운영·안전 알리미</div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">언제 거치하고 언제 철거할지, 한눈에</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">openc.caresea.kr · 연중 단기 실증 운영 · 비·수위 기반 안전 판단 (비 직후는 보너스 측정창)</p>
      <Dashboard />
    </main>
  );
}
