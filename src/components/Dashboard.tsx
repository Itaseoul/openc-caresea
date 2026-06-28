"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import {
  PTY_LABEL, SKY_LABEL, pickValue, isRainingNow, groupForecast, pcpText,
  riverStatus, decideAction, LEVEL_BG, LEVEL_CLASS, type ActionLevel,
} from "@/lib/wx";
import dynamic from "next/dynamic";

// 관측 지점 위치 지도 (Leaflet) — 클라이언트 전용, SSR 비활성
const RiverMap = dynamic(() => import("./RiverMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-400">
      지도 불러오는 중…
    </div>
  ),
});

type DSite = {
  id: string; name: string; region: string; stnId: string;
  seoulRiver: string | null; busanArea: string | null; planFlood: number | null;
  lat: number; lon: number;
};
const SITES: DSite[] = [
  { id: "sacheon", name: "홍제천 사천교", region: "서울 서대문", stnId: "109", seoulRiver: "홍제천", busanArea: null, planFlood: 15.3, lat: 37.5835, lon: 126.9182 },
  { id: "hakjang", name: "학장천 엄궁동", region: "부산 사상", stnId: "159", seoulRiver: null, busanArea: "사상구", planFlood: null, lat: 35.138, lon: 128.969 },
];

export default function Dashboard() {
  const [siteId, setSiteId] = useState("sacheon");
  const site = SITES.find((s) => s.id === siteId)!;

  const ncst = useApi(`/api/kma?site=${site.id}&type=ncst`);
  const fcst = useApi(`/api/kma?site=${site.id}&type=fcst`);
  const wrn = useApi(`/api/wrn?stnId=${site.stnId}`);
  const river = useApi(site.seoulRiver ? `/api/seoul?river=${encodeURIComponent(site.seoulRiver)}` : null);
  const busanRain = useApi(site.busanArea ? `/api/busan-rain?area=${encodeURIComponent(site.busanArea)}` : null);

  const ncstItems = ncst.data?.items;
  const fcstItems = fcst.data?.items;
  const heavyRain = !!wrn.data?.heavyRainWarning;
  const hje = river.data?.items?.[0];
  const riverLevel = hje?.level ?? null;
  const planFlood = hje?.planFloodLevel ?? site.planFlood;
  const demo = !!(ncst.data?.demo || river.data?.demo);

  const action = decideAction({ ncst: ncstItems, fcst: fcstItems, heavyRainWarning: heavyRain, riverLevel, planFlood });

  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-3 sm:p-4" aria-label="우기 모니터링 대시보드">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SiteSwitcher value={siteId} onChange={setSiteId} />
        {demo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-watch/15 px-2.5 py-1 text-xs font-medium text-watch">
            <span className="h-1.5 w-1.5 rounded-full bg-watch" aria-hidden /> 데모 데이터
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {heavyRain && (
          <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            <WarnIcon className="h-5 w-5 shrink-0" />
            호우특보 발효 — 붐 비상 철거 절차
          </div>
        )}

        <ActionAlert level={action.level} label={action.label} detail={action.detail} />

        <div className="grid gap-3 sm:grid-cols-2">
          <NowcastCard items={ncstItems} base={ncst.data?.base} loading={ncst.loading} demo={ncst.data?.demo} />
          <RiverGauge site={site} hje={hje} loading={river.loading} demo={river.data?.demo} busanRain={busanRain.data} />
        </div>

        <SiteMapCard site={site} />

        <ForecastCard items={fcstItems} loading={fcst.loading} />
        <WarningCard wrn={wrn.data} loading={wrn.loading} />
        <RainEventTimeline />

        <Sources />
      </div>
    </section>
  );
}

function SiteSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm" role="tablist" aria-label="관측 지점 선택">
      {SITES.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-brand-700 text-white shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

const DOT: Record<ActionLevel, string> = {
  danger: "bg-danger",
  watch: "bg-watch",
  ok: "bg-ok",
  neutral: "bg-neutral-400",
};

function ActionAlert({ level, label, detail }: { level: ActionLevel; label: string; detail: string }) {
  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${LEVEL_BG[level]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${DOT[level]}`} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">현재 의사결정</span>
      </div>
      <div className={`mt-1.5 text-2xl font-bold sm:text-3xl ${LEVEL_CLASS[level]}`}>{label}</div>
      <p className="mt-1.5 text-sm leading-6 text-neutral-600">{detail}</p>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-700">{title}</h3>
        {hint && <span className="text-xs text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function NowcastCard({ items, base, loading, demo }: any) {
  if (loading) return <Card title="지금 강수"><Skeleton /></Card>;
  const pty = pickValue(items, "PTY");
  const rn1 = pickValue(items, "RN1");
  const t1h = pickValue(items, "T1H");
  const reh = pickValue(items, "REH");
  const raining = isRainingNow(items);
  return (
    <Card title="지금 강수" hint="초단기실황">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            raining ? "bg-brand-50 text-brand-600" : "bg-neutral-100 text-neutral-400"
          }`}
          aria-hidden
        >
          <DropIcon className="h-6 w-6" />
        </span>
        <div className={`text-3xl font-bold ${raining ? "text-brand-700" : "text-neutral-800"}`}>
          {pty != null ? PTY_LABEL[pty] ?? pty : "—"}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="1시간 강수" value={rn1 != null ? `${rn1}mm` : "—"} accent={raining} />
        <Stat label="기온" value={t1h != null ? `${t1h}°` : "—"} />
        <Stat label="습도" value={reh != null ? `${reh}%` : "—"} />
      </dl>
      <p className="mt-3 text-xs text-neutral-400">기준 {base?.base_date ?? "—"} {base?.base_time ?? ""}{demo ? " · 데모" : ""}</p>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-neutral-50 py-2">
      <div className={`text-base font-semibold ${accent ? "text-brand-700" : "text-neutral-800"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-neutral-400">{label}</div>
    </div>
  );
}

function ForecastCard({ items, loading }: any) {
  if (loading) return <Card title="시간별 예보"><Skeleton /></Card>;
  const rows = groupForecast(items);
  return (
    <Card title="시간별 예보" hint="단기예보 · 가로 스크롤">
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">데이터 없음</p>
      ) : (
        <div className="scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {rows.map((r) => {
            const rain = r.PTY && r.PTY !== "0";
            return (
              <div
                key={r.time}
                className={`min-w-[4.25rem] rounded-xl border p-2.5 text-center text-xs ${
                  rain ? "border-brand-100 bg-brand-50" : "border-neutral-100 bg-neutral-50"
                }`}
              >
                <div className="font-semibold text-neutral-700">{r.time?.slice(0, 2)}시</div>
                <div className="mt-0.5 text-neutral-400">{SKY_LABEL[r.SKY ?? ""] ?? ""}</div>
                <div className={`mt-1 font-medium ${rain ? "text-brand-700" : "text-neutral-500"}`}>{PTY_LABEL[r.PTY ?? "0"]}</div>
                <div className="mt-1 text-sm font-bold text-neutral-800">{r.POP ?? "0"}%</div>
                <div className="mt-0.5 text-[11px] text-neutral-500">{pcpText(r.PCP)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function WarningCard({ wrn, loading }: any) {
  if (loading) return null;
  const heavy = !!wrn?.heavyRainWarning;
  return (
    <Card title="기상특보" hint="호우특보 = 철거 트리거">
      {heavy ? (
        <div className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-semibold text-danger">
          <WarnIcon className="h-4 w-4 shrink-0" />
          호우특보 발효 — 철거 절차 진행
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-3 py-1.5 text-sm font-medium text-ok">
          <CheckIcon className="h-4 w-4" /> 현재 특보 없음
        </span>
      )}
    </Card>
  );
}

function RiverGauge({ site, hje, loading, demo, busanRain }: any) {
  if (loading) return <Card title="하천 수위"><Skeleton /></Card>;
  // 부산(학장천): 공공 수위 없음 → 강우 + 자체계측 안내
  if (!site.seoulRiver) {
    const r = busanRain?.items?.[0];
    return (
      <Card title="하천 수위" hint="학장천">
        <p className="text-sm text-neutral-600">공공 실시간 수위 없음 (소하천 사각지대)</p>
        <p className="mt-1.5 text-xs text-neutral-500">자체 IoT 수위계측 예정.{r ? ` 사상구 강우 ${r.rainfall ?? "—"}mm` : ""}</p>
      </Card>
    );
  }
  const level = hje?.level;
  const plan = hje?.planFloodLevel ?? site.planFlood;
  const st = riverStatus(level, plan);
  const pct = level && plan ? Math.min(100, Math.round((level / plan) * 100)) : 0;
  const barColor = st === "danger" ? "bg-danger" : st === "watch" ? "bg-watch" : "bg-brand-500";
  return (
    <Card title="하천 수위" hint="홍제천 성산2교">
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${LEVEL_CLASS[st]}`}>{level ?? "—"}</span>
        <span className="text-sm font-medium text-neutral-400">m</span>
      </div>

      {/* 게이지: 현재 수위 + 주의/위험 라인 */}
      <div className="relative mt-3 h-3 w-full rounded-full bg-neutral-100">
        <div className={`h-3 rounded-full ${barColor} transition-[width]`} style={{ width: `${pct}%` }} />
        {/* 주의선(계획홍수위 90%) */}
        <span className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded bg-watch" style={{ left: "90%" }} aria-hidden />
        {/* 위험선(계획홍수위) */}
        <span className="absolute top-1/2 right-0 h-5 w-0.5 -translate-y-1/2 rounded bg-danger" aria-hidden />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1 text-watch"><span className="h-2 w-0.5 rounded bg-watch" />주의 {plan ? (plan * 0.9).toFixed(1) : "—"}m</span>
        <span className="inline-flex items-center gap-1 text-danger"><span className="h-2 w-0.5 rounded bg-danger" />위험 {plan ?? "—"}m</span>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        계획홍수위 {plan ?? "—"}m · 통제수위 {hje?.controlLevel ? `${hje.controlLevel}m` : "미설정"} · {hje?.collectedAt ?? ""}{demo ? " · 데모" : ""}
      </p>
      <p className="mt-1 text-xs text-neutral-400">사천교 게이지 없음 → 하류 성산2교 대체</p>
    </Card>
  );
}

function SiteMapCard({ site }: { site: DSite }) {
  const sub = site.seoulRiver
    ? `계획홍수위 ${site.planFlood ?? "—"}m · 무동력 차단 붐 거치 후보`
    : "자체 IoT 수위 계측 예정 · 거치 후보";
  return (
    <Card title="관측 지점 · 하천 위치" hint={site.region}>
      <RiverMap lat={site.lat} lng={site.lon} label={site.name} sub={sub} />
      <p className="mt-2 text-xs text-neutral-400">지도 OpenStreetMap · CARTO · 무동력 차단 붐 거치 후보 지점</p>
    </Card>
  );
}

function RainEventTimeline() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-5">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-700">강우 이벤트 타임라인</p>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">M2 연동 예정</span>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-neutral-500">비 시작·종료·누적량·지속시간 기록 → 촬영 윈도우 카운터와 알림 임계값 캘리브레이션.</p>
    </div>
  );
}

function Sources() {
  return (
    <footer className="border-t border-neutral-200 pt-4 text-xs leading-6 text-neutral-400">
      출처: 기상청, 한강홍수통제소, 서울특별시(공공누리 제2유형, 비상업), 부산광역시. powered by 이타시티 · SEA:CUT.
      <br />예보·관측 보조 정보이며 안전을 보증하지 않습니다. 호우특보·현장 판단과 병행하십시오.
    </footer>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-7 w-24 rounded bg-neutral-100" />
      <div className="h-3 w-40 rounded bg-neutral-100" />
    </div>
  );
}

/* ── 인라인 아이콘 (단색 스트로크, 과한 그래픽 지양) ── */
function DropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z" />
    </svg>
  );
}
function WarnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
