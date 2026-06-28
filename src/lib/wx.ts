// 기상/수위 코드 매핑 + ActionAlert 의사결정 로직. COMPONENT_SPEC.md §0 기준.

export const PTY_LABEL: Record<string, string> = {
  "0": "없음", "1": "비", "2": "비/눈", "3": "눈", "4": "소나기",
  "5": "빗방울", "6": "빗방울/눈날림", "7": "눈날림",
};
export const SKY_LABEL: Record<string, string> = { "1": "맑음", "3": "구름많음", "4": "흐림" };

type KmaItem = { category: string; obsrValue?: string; fcstValue?: string; fcstTime?: string };

export function pickValue(items: KmaItem[] | undefined, category: string): string | null {
  if (!Array.isArray(items)) return null;
  const hit = items.find((i) => i.category === category);
  return hit?.obsrValue ?? hit?.fcstValue ?? null;
}

// 초단기실황 → 지금 비 오는가
export function isRainingNow(ncstItems: KmaItem[] | undefined): boolean {
  const pty = pickValue(ncstItems, "PTY");
  const rn1 = Number(pickValue(ncstItems, "RN1") ?? "0");
  return (pty != null && pty !== "0") || rn1 > 0;
}

// 단기예보 items → fcstTime별 그룹(시간순)
export function groupForecast(fcstItems: KmaItem[] | undefined): Array<{ time: string; [k: string]: string }> {
  if (!Array.isArray(fcstItems)) return [];
  const byTime = new Map<string, Record<string, string>>();
  for (const it of fcstItems) {
    if (!it.fcstTime) continue;
    const slot = byTime.get(it.fcstTime) ?? {};
    if (it.fcstValue != null) slot[it.category] = it.fcstValue;
    byTime.set(it.fcstTime, slot);
  }
  return [...byTime.entries()]
    .map(([time, v]) => ({ time, ...v }))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 12);
}

// PCP 문자열 그대로 표시(파싱하지 않음)
export function pcpText(v?: string): string {
  return !v || v === "강수없음" ? "강수없음" : v;
}

export type RiverStatus = "ok" | "watch" | "danger" | "unknown";
// 위험=계획홍수위, 주의=계획홍수위의 90%. 통제수위 0=미설정→사용 안 함.
export function riverStatus(level?: number | null, planFlood?: number | null): RiverStatus {
  if (level == null || !planFlood) return "unknown";
  const danger = planFlood;
  const watch = planFlood * 0.9;
  if (level >= danger) return "danger";
  if (level >= watch) return "watch";
  return "ok";
}

export type ActionLevel = "danger" | "watch" | "ok" | "neutral";
export interface Action {
  level: ActionLevel;
  label: string;
  detail: string;
}

// ActionAlert 판정. 우선순위 철거 > 주의 > 촬영적기 > 평상.
export function decideAction(input: {
  ncst?: KmaItem[];
  fcst?: KmaItem[];
  heavyRainWarning?: boolean;
  riverLevel?: number | null;
  planFlood?: number | null;
}): Action {
  const rv = riverStatus(input.riverLevel, input.planFlood);
  const raining = isRainingNow(input.ncst);

  if (input.heavyRainWarning || rv === "danger") {
    return { level: "danger", label: "철거 권고", detail: "호우특보 또는 수위 위험. 붐 비상 철거와 둔치 진입 금지." };
  }
  if (raining || rv === "watch") {
    return { level: "watch", label: "주의", detail: "강우 또는 증수 진행. 둔치 진입을 피하고 다리 위에서만 관찰." };
  }
  // 촬영 적기: 비 없음 + 특보 없음 + 수위 안전 + 단기 예보 강수확률 낮음
  const fc = groupForecast(input.fcst);
  const soonRain = fc.slice(0, 3).some((s) => Number(s.POP ?? "0") >= 50 || (s.PTY && s.PTY !== "0"));
  if (!raining && (rv === "ok" || rv === "unknown") && !soonRain) {
    return { level: "ok", label: "촬영 적기", detail: "비 그친 표층 부유물 베이스라인 촬영에 적합. 정밀 윈도우는 강우 이벤트 기록 연동 예정." };
  }
  return { level: "neutral", label: "평상", detail: "특이사항 없음." };
}

export const LEVEL_CLASS: Record<ActionLevel | RiverStatus, string> = {
  danger: "text-danger",
  watch: "text-watch",
  ok: "text-ok",
  neutral: "text-neutral-600",
  unknown: "text-neutral-400",
};
export const LEVEL_BG: Record<ActionLevel, string> = {
  danger: "bg-danger/10 border-danger/30",
  watch: "bg-watch/10 border-watch/30",
  ok: "bg-ok/10 border-ok/30",
  neutral: "bg-neutral-100 border-neutral-200",
};
