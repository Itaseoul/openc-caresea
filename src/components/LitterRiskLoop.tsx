"use client";

import { useApi } from "@/lib/useApi";

// litter-risk 예측-실측 폐루프 시각화 — physical AI 0단계 데이터 루프가 실제로 도는 증거.
//  · 예측: /api/litter-risk (부산 강우 실값 → 물리 휴리스틱 핫스팟 순위). 라이브 작동.
//  · 검증: /api/litter-risk/validate (드리프터 궤적 종점 ↔ 핫스팟 매칭). 궤적 적재 시 라이브 리포트,
//    없으면 "캘리브레이션 캠페인 전" 정직 표시 + 검증 메서드 다이어그램.
// 정직 경계: 휴리스틱·약지도 단계(라벨 0). 학습형 모델이 아니다.

type Hotspot = {
  id: string;
  name: string;
  gu: string;
  river: string;
  score: number;
  level: string;
  why: string;
  rainfall_mm: number | null;
};
type RiskResp = {
  ok: boolean;
  generatedAt: string;
  model: string;
  signals: { area: string; rainfall_mm: number | null }[];
  hotspots: Hotspot[];
};
type Match = {
  track_id: string;
  nearest_id: string;
  nearest_name: string;
  distance_m: number;
  predicted_rank: number;
  within_radius: boolean;
  hit: boolean;
};
type Validation = {
  tracks: number;
  matched: number;
  hits: number;
  match_rate: number;
  hit_rate: number;
  mean_distance_m: number | null;
  radius_m: number;
  top_n: number;
  matches: Match[];
};
type ValResp = { ok: boolean; reason?: string; validation?: Validation };

const LEVEL: Record<string, { bg: string; text: string; ring: string }> = {
  "높음": { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
  "주의": { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  "관심": { bg: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-200" },
  "낮음": { bg: "bg-neutral-100", text: "text-neutral-500", ring: "ring-neutral-200" },
};

export default function LitterRiskLoop() {
  const risk = useApi<RiskResp>("/api/litter-risk");
  const val = useApi<ValResp>("/api/litter-risk/validate");

  const hotspots = risk.data?.hotspots ?? [];
  const maxScore = Math.max(0.01, ...hotspots.map((h) => h.score));
  const rain = (risk.data?.signals ?? []).filter((s) => (s.rainfall_mm ?? 0) > 0);

  return (
    <div className="not-prose space-y-4">
      {/* ── 예측: 라이브 핫스팟 순위 ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            <span className="text-[13px] font-bold text-neutral-800">하류 퇴적 위험 예측 — 라이브</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {risk.loading ? "불러오는 중…" : risk.data?.generatedAt ? risk.data.generatedAt.slice(5, 16).replace("T", " ") : ""}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-5 text-neutral-500">
          부산 강우 실값 → 물리 휴리스틱(발생원 × 트랩 × first-flush).{" "}
          {rain.length
            ? `강우 감지: ${rain.map((r) => `${r.area} ${r.rainfall_mm}mm`).join(", ")}`
            : "현재 건기 — 평시 정체 퇴적 위주"}
        </p>
        <div className="mt-3 space-y-2">
          {hotspots.map((h, i) => {
            const c = LEVEL[h.level] ?? LEVEL["낮음"];
            return (
              <div key={h.id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-neutral-800 text-[11px] font-bold text-white">{i + 1}</span>
                    <span className="truncate text-[13px] font-semibold text-neutral-800">{h.name}</span>
                    <span className="flex-none text-[11px] text-neutral-400">{h.gu}</span>
                  </div>
                  <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
                    {h.level} {h.score.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${Math.round((h.score / maxScore) * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-[11.5px] leading-4 text-neutral-500">{h.why}</p>
              </div>
            );
          })}
          {!risk.loading && !hotspots.length && (
            <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-[12px] text-neutral-400">
              예측 데이터를 불러오지 못했습니다.
            </div>
          )}
        </div>
      </div>

      {/* ── 검증: 드리프터 실측 폐루프 ── */}
      <ValidationPanel val={val.data} loading={val.loading} />
    </div>
  );
}

function ValidationPanel({ val, loading }: { val: ValResp | null | undefined; loading: boolean }) {
  const v = val?.ok ? val.validation : undefined;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <span className="text-[13px] font-bold text-neutral-800">예측 검증 — GPS 드리프터 실측 폐루프</span>
      {v ? (
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="궤적" v={`${v.tracks}건`} />
            <Stat label={`적중률(상위${v.top_n})`} v={`${Math.round(v.hit_rate * 100)}%`} />
            <Stat label="평균거리" v={v.mean_distance_m != null ? `${v.mean_distance_m}m` : "—"} />
          </div>
          <div className="mt-3 space-y-1.5">
            {v.matches.map((m) => (
              <div key={m.track_id} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-[12px]">
                <span className="truncate text-neutral-600">
                  {m.track_id} <span className="text-neutral-300">→</span> {m.nearest_name}
                </span>
                <span className={`flex-none font-semibold ${m.hit ? "text-emerald-600" : m.within_radius ? "text-amber-600" : "text-neutral-400"}`}>
                  {m.distance_m}m · {m.hit ? "적중" : m.within_radius ? "근접" : "빗나감"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-[12px] leading-5 text-neutral-500">
            {loading
              ? "불러오는 중…"
              : "드리프터 캘리브레이션 캠페인 전 — 적재된 궤적 0건. 아래는 검증이 작동하는 방식입니다. GPS 드리프터를 흘려 실제 표류 종점을 기록하면, 그 종점이 상위 예측 핫스팟 반경 내에 도달했는지로 예측을 검증합니다."}
          </p>
          <ValidationDiagram />
        </div>
      )}
      <p className="mt-3 text-[11px] leading-4 text-neutral-400">
        정직 경계: 라벨 0단계의 휴리스틱·약지도 검증입니다. 학습형 모델이 아니며, 드리프터는 상시 도구가 아니라 간헐 캘리브레이션입니다.
      </p>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-center">
      <div className="text-lg font-extrabold tracking-tight text-brand-700">{v}</div>
      <div className="mt-0.5 text-[11px] leading-3 text-neutral-500">{label}</div>
    </div>
  );
}

// 검증 메서드 개념도: 예측 핫스팟(반경) + 드리프터 궤적(점선) → 종점이 반경 내 도달 = 적중.
function ValidationDiagram() {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <svg viewBox="0 0 420 150" className="h-auto w-full" role="img" aria-label="예측-실측 검증 — 드리프터 종점이 예측 핫스팟 검증 반경 내 도달하면 적중">
        <defs>
          <marker id="dv" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <path d="M0 0 L7 3.5 L0 7 z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* 예측 핫스팟 #1 + 검증 반경 */}
        <circle cx="120" cy="82" r="36" fill="#ecfeff" stroke="#67e8f9" strokeWidth="1.2" strokeDasharray="4 3" />
        <circle cx="120" cy="82" r="7" fill="#0891b2" />
        <text x="120" y="82" dy="-14" textAnchor="middle" fontSize="8.5" fill="#94a3b8">검증 반경</text>
        <text x="120" y="138" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0e7490">예측 핫스팟 #1</text>

        {/* 드리프터 투하 → 궤적(점선) → 종점(반경 내 = 적중) */}
        <circle cx="312" cy="28" r="4" fill="#64748b" />
        <text x="312" y="20" textAnchor="middle" fontSize="9" fill="#64748b">드리프터 투하</text>
        <path d="M308 32 C 250 66, 188 58, 132 80" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" markerEnd="url(#dv)" />
        <circle cx="130" cy="80" r="5" fill="#16a34a" />
        <text x="196" y="104" textAnchor="middle" fontSize="9" fill="#16a34a">종점이 반경 내 도달 = 적중(hit)</text>

        {/* 예측 핫스팟 #2 (빗나감 예시) */}
        <circle cx="360" cy="110" r="6" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="360" y="132" textAnchor="middle" fontSize="9" fill="#94a3b8">핫스팟 #2</text>
      </svg>
    </div>
  );
}
