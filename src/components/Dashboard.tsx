"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { pickValue, isRainingNow, groupForecast } from "@/lib/wx";
import dynamic from "next/dynamic";

// 관측 지점 위치 지도 (Leaflet) — 클라이언트 전용
const RiverMap = dynamic(() => import("./RiverMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 220, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
      지도 불러오는 중…
    </div>
  ),
});

type DSite = {
  id: string; label: string; region: string; stnId: string;
  seoulRiver: string | null; busanArea: string | null; planFlood: number; lat: number; lon: number;
};
const SITES: DSite[] = [
  { id: "sacheon", label: "홍제천 사천교", region: "서울", stnId: "109", seoulRiver: "홍제천", busanArea: null, planFlood: 15.3, lat: 37.5835, lon: 126.9182 },
  { id: "hakjang", label: "학장천 엄궁동", region: "부산 사상구", stnId: "159", seoulRiver: null, busanArea: "사상구", planFlood: 15.3, lat: 35.138, lon: 128.969 },
];

const PTY_TXT = ["강수 없음", "비", "비/눈", "눈", "소나기", "빗방울", "빗방울/눈날림", "눈날림"];

type Theme = { tag: string; solid: string; tint: string; border: string; text: string; icon: string };
const THEME: Record<string, Theme> = {
  danger: { tag: "철거 권고", solid: "#dc2626", tint: "#fef2f2", border: "#fecaca", text: "#b91c1c", icon: "alert" },
  watch: { tag: "주의", solid: "#f59e0b", tint: "#fffbeb", border: "#fde68a", text: "#b45309", icon: "rain" },
  ok: { tag: "촬영 적기", solid: "#16a34a", tint: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "camera" },
  neutral: { tag: "평상", solid: "#64748b", tint: "#f8fafc", border: "#e2e8f0", text: "#475569", icon: "sun" },
};

export default function Dashboard() {
  const [siteId, setSiteId] = useState("sacheon");
  const [minsAgo, setMinsAgo] = useState(0);
  const [nonce, setNonce] = useState(0);
  const site = SITES.find((s) => s.id === siteId)!;
  const bust = `&_=${nonce}`;

  const ncst = useApi(`/api/kma?site=${site.id}&type=ncst${bust}`);
  const fcst = useApi(`/api/kma?site=${site.id}&type=fcst${bust}`);
  const wrn = useApi(`/api/wrn?stnId=${site.stnId}${bust}`);
  const river = useApi(site.seoulRiver ? `/api/seoul?river=${encodeURIComponent(site.seoulRiver)}${bust}` : null);
  const busanRain = useApi(site.busanArea ? `/api/busan-rain?area=${encodeURIComponent(site.busanArea)}${bust}` : null);

  useEffect(() => {
    const t = setInterval(() => setMinsAgo((m) => m + 1), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setMinsAgo(0); }, [ncst.data, fcst.data, river.data, siteId]);

  const refresh = () => { setNonce((n) => n + 1); setMinsAgo(0); };
  const lastUpdated = minsAgo === 0 ? "방금 갱신" : `${minsAgo}분 전`;

  // ---- 실데이터 추출 ----
  const ncstItems = ncst.data?.items;
  const fcstItems = fcst.data?.items;
  const pty = Number(pickValue(ncstItems, "PTY") ?? 0);
  const sky = Number(pickValue(ncstItems, "SKY") ?? 0);
  const rn1raw = pickValue(ncstItems, "RN1");
  const rn1 = rn1raw ?? "0";
  const rn1num = Number(rn1raw ?? 0) || 0;
  const t1h = pickValue(ncstItems, "T1H") ?? "—";
  const reh = pickValue(ncstItems, "REH") ?? "—";
  const rehNum = Number(reh) || 0;
  const raining = isRainingNow(ncstItems);
  const ncstDemo = !!ncst.data?.demo;
  const baseTimeRaw = ncst.data?.base?.base_time as string | undefined;
  const baseTime = baseTimeRaw && baseTimeRaw.length >= 4 ? `${baseTimeRaw.slice(0, 2)}:${baseTimeRaw.slice(2, 4)}` : "—";

  const heavyRain = !!wrn.data?.heavyRainWarning;
  const hje = river.data?.items?.[0];
  const level: number | null = hje?.level ?? null;
  const planFlood = hje?.planFloodLevel ?? site.planFlood;
  const watchLine = +(planFlood * 0.9).toFixed(1);
  const riverAvailable = !!site.seoulRiver;
  const levelDanger = riverAvailable && level != null && level >= planFlood;
  const levelWatch = riverAvailable && level != null && level >= watchLine;
  const riverDemo = !!river.data?.demo;
  const busanItem = busanRain.data?.items?.[0];

  // ---- ActionAlert 판정 (철거 > 주의 > 촬영적기 > 평상) ----
  let key = "neutral", title = "평상 — 특이사항 없음", sub = "", note = "";
  if (heavyRain || levelDanger) {
    key = "danger"; title = "붐 비상 철거 — 둔치 장비 철수";
    sub = heavyRain && levelDanger ? "호우특보 발효 · 수위 위험선 도달" : heavyRain ? "호우특보 발효 — 철거 절차 가동" : "수위 위험선 도달 — 즉시 철수";
  } else if (raining || levelWatch) {
    key = "watch"; title = "둔치 진입 주의 — 다리 위만";
    sub = raining ? `강우 진행 중 (${rn1}mm) · 증수 가능` : "수위 주의선 접근 · 둔치 주의";
  } else if (rehNum >= 60) {
    key = "ok"; title = "촬영 윈도우 — 지금 진입 가능";
    sub = "비 직후 베이스라인 적기 · 강수·특보 없음";
    note = "정밀 윈도우 판정은 강우 이벤트 기록(M2) 연동 예정 — 현재는 강수·예보·습도 근사";
  } else {
    key = "neutral"; title = "평상 — 특이사항 없음";
    sub = "맑음 · 강수/특보 없음" + (riverAvailable ? " · 수위 안전" : "");
  }
  const tk = THEME[key];

  // ---- 근거 칩 ----
  const CC = { ok: "#16a34a", watch: "#f59e0b", danger: "#dc2626", gray: "#94a3b8" };
  const rainEv = !raining ? { v: "없음", c: CC.ok } : rn1num >= 15 ? { v: `비 ${rn1}mm`, c: CC.danger } : { v: rn1num > 0 ? `비 ${rn1}mm` : "비", c: CC.watch };
  const warnEv = heavyRain ? { v: "호우경보", c: CC.danger } : { v: "없음", c: CC.ok };
  const lvlEv = !riverAvailable ? { v: "해당없음", c: CC.gray } : level == null ? { v: "수신 대기", c: CC.gray } : levelDanger ? { v: `위험 ${level}m`, c: CC.danger } : levelWatch ? { v: `주의 ${level}m`, c: CC.watch } : { v: `안전 ${level}m`, c: CC.ok };
  const evidence = [
    { label: "강수", value: rainEv.v, color: rainEv.c },
    { label: "특보", value: warnEv.v, color: warnEv.c },
    { label: "수위", value: lvlEv.v, color: lvlEv.c },
  ];

  // ---- nowcast ----
  const nIconColor = raining ? "#2563eb" : "#64748b";
  const nowcast = {
    bg: raining ? "#eff6ff" : "#ffffff",
    borderC: raining ? "#bfdbfe" : "#e2e8f0",
    iconBg: raining ? "#dbeafe" : "#f1f5f9",
    accent: raining ? "#1d4ed8" : "#0f172a",
  };

  // ---- river gauge ----
  const fillPct = level != null && planFlood ? Math.max(2, Math.min(100, (level / planFlood) * 100)) : 0;
  const riverColor = levelDanger ? "#dc2626" : levelWatch ? "#f59e0b" : "#16a34a";
  const watchPct = +Math.min(100, (watchLine / planFlood) * 100).toFixed(1);
  const statusLabel = levelDanger ? "위험 — 계획홍수위 초과" : levelWatch ? "주의 — 증수 진행" : "안전권";
  const statusTint = levelDanger ? "#fef2f2" : levelWatch ? "#fffbeb" : "#f0fdf4";
  const statusBorder = levelDanger ? "#fecaca" : levelWatch ? "#fde68a" : "#bbf7d0";
  const collectedAt = (hje?.collectedAt as string) ?? `${baseTime} 수집`;

  // ---- forecast ----
  const forecast = groupForecast(fcstItems).slice(0, 8).map((r) => {
    const fpty = Number(r.PTY ?? 0);
    const fsky = Number(r.SKY ?? 0);
    const pop = Number(r.POP ?? 0);
    const isRain = fpty !== 0;
    return {
      time: r.time ? `${Number(r.time.slice(0, 2))}시` : "",
      pop,
      pcp: r.PCP && r.PCP !== "강수없음" ? r.PCP : "",
      iconName: weatherIconName(fpty, fsky),
      isRain,
      bg: isRain ? "#eff6ff" : "#ffffff",
      borderC: isRain ? "#bfdbfe" : "#f1f5f9",
      popColor: pop >= 50 ? "#1d4ed8" : "#94a3b8",
      barH: Math.max(2, Math.round((pop / 100) * 32)),
      barColor: isRain ? "#3b82f6" : pop >= 50 ? "#93c5fd" : "#e2e8f0",
      iconColor: isRain ? "#2563eb" : "#94a3b8",
    };
  });

  const card: React.CSSProperties = { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16 };
  const chip = (txt: string, color: string, bg: string, border: string) => (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}`, borderRadius: 999, padding: "2px 7px" }}>{txt}</span>
  );

  return (
    <div style={{ background: "#eef2f6", borderRadius: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 36px", color: "#0f172a" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".1em", color: "#64748b", fontWeight: 700 }}>SEA:CUT · 촬영 윈도우 모니터</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em", marginTop: 2 }}>openc.caresea.kr</div>
          </div>
          <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "8px 11px", cursor: "pointer", color: "#475569", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            <Icon name="refresh" size={14} color="#64748b" />
            {lastUpdated}
          </button>
        </div>

        {/* 사이트 토글 */}
        <div style={{ display: "flex", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 5, marginBottom: 12 }}>
          {SITES.map((s) => {
            const active = s.id === siteId;
            return (
              <button key={s.id} onClick={() => setSiteId(s.id)} style={{ flex: 1, border: "none", borderRadius: 10, cursor: "pointer", padding: "8px 6px", background: active ? "#0f172a" : "transparent", color: active ? "#fff" : "#475569", textAlign: "center", transition: "background .15s" }}>
                <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, letterSpacing: "-.01em" }}>{s.label}</div>
                <div style={{ fontSize: 11, opacity: 0.62, marginTop: 1, fontWeight: 500 }}>{s.region}</div>
              </button>
            );
          })}
        </div>

        {/* 호우특보 배너 */}
        {heavyRain && (
          <div style={{ background: "#dc2626", color: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 10px 24px -10px rgba(220,38,38,.65)" }}>
            <span style={{ flex: "0 0 auto", marginTop: 1 }}><Icon name="alert" size={22} color="#fff" /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>호우특보 발효 — 철거 절차 가동</div>
              <div style={{ opacity: 0.92, fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>하천변·둔치 출입을 통제하고 무동력 붐 비상 철거 절차를 가동하세요.</div>
            </div>
          </div>
        )}

        {/* ActionAlert */}
        <div style={{ background: tk.tint, border: `1.5px solid ${tk.border}`, borderRadius: 20, padding: 18, display: "flex", gap: 15, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 62, height: 62, borderRadius: 17, background: tk.solid, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", boxShadow: `0 10px 22px -10px ${tk.solid}` }}>
            <Icon name={tk.icon} size={31} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: tk.text }}>{tk.tag}</div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.18, color: "#0f172a", marginTop: 2 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 1.45 }}>{sub}</div>
            {note && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, lineHeight: 1.45 }}>* {note}</div>}
          </div>
        </div>

        {/* 근거 칩 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {evidence.map((ev) => (
            <div key={ev.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "9px 11px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{ev.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flex: "0 0 auto" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-.01em", whiteSpace: "nowrap" }}>{ev.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 지금 비? + 하천 수위 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(232px,1fr))", gap: 12, marginBottom: 12 }}>

          <div style={{ background: nowcast.bg, border: `1px solid ${nowcast.borderC}`, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>지금 비?</div>
              {ncstDemo ? chip("데모", "#b45309", "#fffbeb", "#fde68a") : chip("실시간", "#15803d", "#f0fdf4", "#bbf7d0")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 13, margin: "10px 0 13px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: nowcast.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                <Icon name={weatherIconName(pty, sky)} size={28} color={nIconColor} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", color: nowcast.accent, lineHeight: 1.1 }}>{PTY_TXT[pty] ?? "강수 없음"}</div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2, whiteSpace: "nowrap" }}>최근 1시간 {rn1} mm</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,.55)", border: "1px solid #e8edf2", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>기온</div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em", marginTop: 1 }}>{t1h}°</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.55)", border: "1px solid #e8edf2", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>습도</div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.02em", marginTop: 1 }}>{reh}%</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 11 }}>{baseTime} 기준</div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>하천 수위</div>
              {riverAvailable && (riverDemo ? chip("데모", "#b45309", "#fffbeb", "#fde68a") : chip("실시간", "#15803d", "#f0fdf4", "#bbf7d0"))}
            </div>

            {riverAvailable ? (
              <>
                <div style={{ display: "flex", gap: 15, marginTop: 12 }}>
                  <div style={{ position: "relative", width: 30, height: 148, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9, flex: "0 0 auto", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fillPct}%`, background: riverColor, transition: "height .45s ease" }} />
                    <div style={{ position: "absolute", left: -1, right: -1, bottom: "100%", borderTop: "2px dashed #dc2626" }} />
                    <div style={{ position: "absolute", left: -1, right: -1, bottom: `${watchPct}%`, borderTop: "2px dashed #f59e0b" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>현재 수위</div>
                    <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.03em", color: level == null ? "#94a3b8" : riverColor, lineHeight: 1, marginTop: 1 }}>
                      {level ?? "—"}<span style={{ fontSize: 14, fontWeight: 700, marginLeft: 1 }}>m</span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 7, background: level == null ? "#f1f5f9" : statusTint, border: `1px solid ${level == null ? "#e2e8f0" : statusBorder}`, color: level == null ? "#64748b" : riverColor, borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {level == null ? "수위 데이터 수신 대기" : statusLabel}
                    </div>
                    <div style={{ marginTop: 11, fontSize: 11, lineHeight: 1.7, color: "#64748b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, borderTop: "2px dashed #dc2626" }} />위험 {planFlood}m</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, borderTop: "2px dashed #f59e0b" }} />주의 {watchLine}m</div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 13, lineHeight: 1.55 }}>성산2교 · {collectedAt}<br />사천교 게이지 없음 → 하류 성산2교 대체</div>
              </>
            ) : (
              <div style={{ marginTop: 12, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 12, padding: 14, fontSize: 12.5, color: "#64748b", lineHeight: 1.65 }}>
                학장천은 하천 수위 데이터가 제공되지 않습니다. <b style={{ color: "#475569" }}>강우(사상구) + 현장 자체계측</b>으로 판단하세요.
                <div style={{ marginTop: 9, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>현재 강우</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "#1d4ed8", lineHeight: 1.1, marginTop: 1 }}>
                  {busanItem?.rainfall ?? "—"}<span style={{ fontSize: 13, marginLeft: 2 }}>mm</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 시간별 예보 */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>시간별 예보</div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>향후 8시간 · POP 강수확률</span>
          </div>
          {forecast.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 2px" }}>예보 데이터 수신 대기</div>
          ) : (
            <div className="scroll-x" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 2px 4px" }}>
              {forecast.map((f, i) => (
                <div key={i} style={{ flex: "0 0 auto", width: 64, background: f.bg, border: `1px solid ${f.borderC}`, borderRadius: 13, padding: "9px 6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{f.time}</div>
                  <div style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", margin: "5px 0 3px" }}>
                    <Icon name={f.iconName} size={24} color={f.iconColor} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-.02em", color: f.popColor }}>{f.pop}%</div>
                  <div style={{ height: 32, display: "flex", alignItems: "flex-end", justifyContent: "center", marginTop: 5 }}>
                    <div style={{ width: 8, borderRadius: 4, height: f.barH, background: f.barColor }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 5, lineHeight: 1.25, minHeight: 12 }}>{f.pcp}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 관측 지점 지도 (추가) */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>관측 지점 · 하천 위치</div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{site.region}</span>
          </div>
          <RiverMap lat={site.lat} lng={site.lon} label={site.label} sub={riverAvailable ? `계획홍수위 ${planFlood}m · 무동력 붐 거치 후보` : "자체 IoT 수위 계측 예정 · 거치 후보"} />
        </div>

        {/* 강우 이벤트 (M2) */}
        <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 18, padding: 17, marginBottom: 16, background: "#fafbfc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 6, padding: "2px 7px" }}>M2 예정</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#475569", letterSpacing: "-.01em" }}>강우 이벤트 · 촬영 윈도우 카운터</div>
          </div>
          <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.65 }}>비 시작·종료 시각, 누적 강수량, 지속시간을 기록하고 <b style={{ color: "#64748b" }}>마지막 비 종료 후 경과시간</b>으로 촬영 적기를 정밀 판정합니다. 현재는 자리만 잡아둔 상태입니다.</div>
        </div>

        {/* 출처 */}
        <div style={{ paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>출처</div>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>기상청 · 한강홍수통제소 · 서울특별시(공공누리 제2유형, 비상업) · 부산광역시</div>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, marginTop: 11 }}>예보·관측 보조 정보이며 안전을 보증하지 않습니다. 호우특보·현장 판단과 병행하세요.</div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginTop: 11 }}>powered by 이타시티 · SEA:CUT — openc.caresea.kr</div>
        </div>

      </div>
    </div>
  );
}

function weatherIconName(pty: number, sky: number): string {
  if (pty === 1 || pty === 5) return "rain";
  if (pty === 2 || pty === 6) return "sleet";
  if (pty === 3 || pty === 7) return "snow";
  if (pty === 4) return "shower";
  if (sky === 1) return "sun";
  return "cloud";
}

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const cloud = "M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25";
  switch (name) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.6" y1="4.6" x2="6" y2="6" /><line x1="18" y1="18" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6" y2="18" /><line x1="18" y1="6" x2="19.4" y2="4.6" />
        </svg>
      );
    case "cloud":
      return <svg {...common}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>;
    case "rain":
      return <svg {...common}><path d={cloud} /><line x1="16" y1="13" x2="16" y2="18" /><line x1="8" y1="13" x2="8" y2="18" /><line x1="12" y1="15" x2="12" y2="20" /></svg>;
    case "shower":
      return <svg {...common}><path d={cloud} /><line x1="8.5" y1="14" x2="7" y2="17" /><line x1="12.5" y1="16" x2="11" y2="19" /><line x1="16.5" y1="14" x2="15" y2="17" /></svg>;
    case "snow":
      return <svg {...common}><path d={cloud} /><circle cx="8" cy="19" r="0.6" /><circle cx="12" cy="21" r="0.6" /><circle cx="16" cy="19" r="0.6" /></svg>;
    case "sleet":
      return <svg {...common}><path d={cloud} /><line x1="8" y1="14" x2="8" y2="17" /><circle cx="12" cy="20" r="0.6" /><line x1="16" y1="14" x2="16" y2="17" /></svg>;
    case "camera":
      return <svg {...common}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case "alert":
      return <svg {...common}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></svg>;
    case "refresh":
      return <svg {...common} strokeWidth={2}><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
