import Dashboard from "@/components/Dashboard";

// 대시보드 단독 페이지 (운영용). 메인(/)에도 근거 섹션으로 임베드됨.
// 디자인(CareseaDashboard)에 자체 헤더·푸터가 있어 래퍼는 배경만 제공.
export default function DashboardPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#eef2f6" }}>
      <Dashboard />
    </main>
  );
}
