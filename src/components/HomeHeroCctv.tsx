"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CctvPlayer from "@/components/CctvPlayer";

// 홈 최상단 히어로 — 대상 하천 하류(낙동강·장수천·한강·금강 등)의 라이브 CCTV.
// 유튜브식 레이아웃: 좌측 큰 메인 플레이어 + 우측 채널 목록. 항상 16:9 자리를 유지(레이아웃 안 깨짐).
// 스트림이 죽어도 스켈레톤/폴백으로 우아하게 처리하고, 다음 카메라로 자동 스킵한다.
// "비 오는 지역"은 first-flush 관측 적기 → 배지·우선 정렬·자동 전환.

type Cam = { cctvname?: string; stream?: string; cctvurl?: string; water?: boolean; thumb?: string | null };
type Region = { key: string; label: string; river: string };
type Rain = { key: string; raining: boolean; rain_mm: number | null };

export default function HomeHeroCctv() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionKey, setRegionKey] = useState<string>("");
  const [cams, setCams] = useState<Cam[]>([]);
  const [idx, setIdx] = useState(0);
  const [dead, setDead] = useState<Set<number>>(new Set());
  const [rain, setRain] = useState<Record<string, Rain>>({});
  const [loadingRegion, setLoadingRegion] = useState(true);

  const loadRegion = useCallback((key: string) => {
    setLoadingRegion(true);
    setCams([]);
    setIdx(0);
    setDead(new Set());
    const q = key ? `?region=${encodeURIComponent(key)}` : "";
    fetch(`/api/cctv${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.content)) return;
        if (Array.isArray(d.regions) && d.regions.length) setRegions(d.regions);
        if (d.region?.key) setRegionKey(d.region.key);
        setCams(d.content.filter((c: Cam) => c.stream || c.cctvurl).slice(0, 12));
      })
      .catch(() => {})
      .finally(() => setLoadingRegion(false));
  }, []);

  useEffect(() => {
    loadRegion("");
  }, [loadRegion]);

  // 지역별 강수(우기 관측 적기)
  useEffect(() => {
    let alive = true;
    fetch("/api/rain-regions")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.ok || !Array.isArray(d.regions)) return;
        const map: Record<string, Rain> = {};
        for (const r of d.regions) map[r.key] = { key: r.key, raining: !!r.raining, rain_mm: r.rain_mm };
        setRain(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 현재 카메라가 죽으면 다음 살아있는 카메라로
  const handleFail = useCallback(
    (failedIdx: number) => {
      setDead((prev) => {
        const next = new Set(prev);
        next.add(failedIdx);
        return next;
      });
      setIdx((cur) => {
        if (cur !== failedIdx) return cur;
        for (let step = 1; step < cams.length; step++) {
          const cand = (failedIdx + step) % cams.length;
          if (!dead.has(cand)) return cand;
        }
        return cur;
      });
    },
    [cams.length, dead]
  );

  // 최초 1회: 대상지(부산)가 비 안 오고 다른 지역이 비 오면 그 지역으로 자동 전환
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current || !regionKey || !Object.keys(rain).length) return;
    if (rain[regionKey]?.raining) {
      autoRef.current = true;
      return;
    }
    const wet = regions.find((r) => rain[r.key]?.raining);
    autoRef.current = true;
    if (wet && wet.key !== regionKey) loadRegion(wet.key);
  }, [rain, regions, regionKey, loadRegion]);

  const retryAll = () => {
    setDead(new Set());
    setIdx(0);
  };
  const pickCam = (i: number) => {
    setDead((prev) => {
      if (!prev.has(i)) return prev;
      const next = new Set(prev);
      next.delete(i); // 죽은 카메라 다시 시도 허용
      return next;
    });
    setIdx(i);
  };

  const sortedRegions = [...regions].sort((a, b) => Number(!!rain[b.key]?.raining) - Number(!!rain[a.key]?.raining));
  const curRaining = rain[regionKey]?.raining;
  const curMm = rain[regionKey]?.rain_mm;
  const allDead = cams.length > 0 && dead.size >= cams.length;
  const safeIdx = Math.min(idx, Math.max(0, cams.length - 1));
  const cur = cams[safeIdx];

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 16px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", color: "#dc2626" }}>● 지금, 현장</div>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.25 }}>
            지금 이 순간에도 <span style={{ color: "#0e7490" }}>현장은 흐르고 있습니다</span>
          </h2>
        </div>
        {curRaining && (
          <span
            title="비 직후엔 소하천 부유물이 폭증(first-flush)합니다 — 지금이 관측 가치가 가장 큰 순간입니다."
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: "#0e7490", color: "#fff", fontSize: 12, fontWeight: 800 }}
          >
            🌧 지금 비 · 부유물 급증 관측 적기{typeof curMm === "number" && curMm > 0 ? ` (${curMm}mm/h)` : ""}
          </span>
        )}
      </div>

      {/* 지역(하천) 탭 — 비 오는 지역 우선 */}
      {regions.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {sortedRegions.map((r) => {
            const wet = rain[r.key]?.raining;
            const active = r.key === regionKey;
            return (
              <button
                key={r.key}
                onClick={() => loadRegion(r.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 11px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: active ? "1px solid #0e7490" : wet ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
                  background: active ? "#0e7490" : wet ? "#f0f9ff" : "#fff",
                  color: active ? "#fff" : wet ? "#0369a1" : "#475569",
                }}
              >
                {wet && <span aria-hidden>🌧</span>}
                {r.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 유튜브식: 좌 메인 크게 + 우 목록 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 460px", minWidth: 0 }}>
          {loadingRegion ? (
            <SkeletonPlayer />
          ) : allDead ? (
            <FallbackPanel onRetry={retryAll} poster={cams[0]?.thumb} />
          ) : cur ? (
            <CctvPlayer key={`${regionKey}-${safeIdx}`} src={cur.stream || cur.cctvurl || ""} name={cur.cctvname} big poster={cur.thumb} onFail={() => handleFail(safeIdx)} />
          ) : (
            <SkeletonPlayer />
          )}
        </div>

        {/* 우측 채널 목록 */}
        <div style={{ flex: "1 1 230px", minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".05em", marginBottom: 6 }}>
            채널 {cams.length ? `· ${cams.length}` : ""}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
            {loadingRegion
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : cams.map((c, i) => {
                  const active = i === safeIdx && !allDead;
                  const isDead = dead.has(i);
                  return (
                    <li key={i}>
                      <button
                        onClick={() => pickCam(i)}
                        title={isDead ? "일시 오프라인 — 다시 시도" : c.cctvname}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "5px 7px",
                          borderRadius: 8,
                          cursor: "pointer",
                          border: active ? "1px solid #0e7490" : "1px solid #eef2f6",
                          background: active ? "#ecfeff" : "#fff",
                          color: isDead ? "#94a3b8" : "#334155",
                        }}
                      >
                        {/* 유튜브식 썸네일 */}
                        <span style={{ position: "relative", width: 64, height: 36, flex: "none", borderRadius: 5, overflow: "hidden", background: "#0f172a" }}>
                          {c.thumb ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={c.thumb} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isDead ? 0.4 : 1 }} />
                          ) : (
                            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📷</span>
                          )}
                          {active && <span style={{ position: "absolute", top: 2, left: 2, fontSize: 8, fontWeight: 800, color: "#fff", background: "rgba(220,38,38,.9)", padding: "1px 4px", borderRadius: 3 }}>LIVE</span>}
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: active ? 800 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.cctvname || `채널 ${i + 1}`}
                          </span>
                          <span style={{ fontSize: 10, color: isDead ? "#cbd5e1" : c.water ? "#0369a1" : "#94a3b8", fontWeight: 700 }}>
                            {isDead ? "오프라인 · 다시 시도" : c.water ? "하천 · LIVE" : "LIVE"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// 16:9 스켈레톤
function SkeletonPlayer() {
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", background: "linear-gradient(100deg,#0f172a 30%,#1e293b 50%,#0f172a 70%)", backgroundSize: "200% 100%", animation: "cctvshimmer 1.3s linear infinite" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, gap: 8 }}>
        <span style={{ width: 15, height: 15, border: "2px solid rgba(148,163,184,.35)", borderTopColor: "#e2e8f0", borderRadius: 999, animation: "cctvspin .8s linear infinite" }} />
        현장 영상 연결 중…
      </div>
      <style>{`@keyframes cctvspin{to{transform:rotate(360deg)}}@keyframes cctvshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

function SkeletonRow() {
  return <div style={{ height: 34, borderRadius: 8, background: "linear-gradient(100deg,#f1f5f9 30%,#e2e8f0 50%,#f1f5f9 70%)", backgroundSize: "200% 100%", animation: "cctvshimmer 1.3s linear infinite" }} />;
}

// 전 카메라 연결 불가 시 폴백(레이아웃 유지) — 정지영상이 있으면 배경으로
function FallbackPanel({ onRetry, poster }: { onRetry: () => void; poster?: string | null }) {
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", background: "radial-gradient(120% 120% at 50% 0%,#1e293b,#0b1220)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 11, textAlign: "center", padding: 20 }}>
      {poster && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.4)" }} />
      )}
      <div style={{ position: "relative", fontSize: 30 }}>{poster ? "🖼" : "🌊"}</div>
      <div style={{ position: "relative", fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>
        {poster ? "실시간 영상이 잠시 끊겼습니다" : "현장 영상이 일시적으로 연결되지 않습니다"}
      </div>
      <div style={{ position: "relative", fontSize: 12, color: "#cbd5e1", lineHeight: 1.6, maxWidth: 380 }}>
        {poster
          ? "최근 정지영상을 보여드리고 있어요. 공공 CCTV 스트림이 곧 복구됩니다 — 지금 바로 다시 시도할 수도 있습니다."
          : "공공 CCTV(ITS) 스트림 서버가 잠시 응답하지 않고 있습니다. 잠시 후 자동으로 복구됩니다."}
      </div>
      <button onClick={onRetry} style={{ position: "relative", marginTop: 2, padding: "8px 16px", borderRadius: 999, border: "none", background: "#0e7490", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
        ↻ 실시간 다시 시도
      </button>
    </div>
  );
}
