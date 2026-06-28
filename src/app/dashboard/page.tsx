import Dashboard from "@/components/Dashboard";

// 대시보드 단독 페이지 (운영용). 메인(/)에도 근거 섹션으로 임베드됨.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">SEA:CUT · 우기 모니터링</div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">오는 비를 놓치지 않는다</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">openc.caresea.kr · 촬영 윈도우 포착과 비상 철거 트리거</p>
      <Dashboard />
    </main>
  );
}
