"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CctvPlayer from "@/components/CctvPlayer";

// 히어로 우측 "라이브 증거 패널" — 대상 하천 하류 CCTV.
// 다크 히어로 배경 위에 얹히는 패널: 지역 탭(가로스크롤) → 메인 플레이어 → 썸네일 스트립(가로스크롤).
// 스트림이 죽어도 스켈레톤/폴백/빈상태로 우아하게. "비 오는 지역"은 first-flush 관측 적기(🌧) 우선.

type Cam = { cctvname?: string; stream?: string; cctvurl?: string; water?: boolean; thumb?: string | null };
type Region = { key: string; label: string; river: string };
type Rain = { key: string; raining: boolean; rain_mm: number | null };

export default function HomeHeroCctv() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionKey, setRegionKey] = useState<string>("");
  const [regionLabel, setRegionLabel] = useState<string>("");
  const [cams, setCams] = useState<Cam[]>([]);
  const [idx, setIdx] = useState(0); // 선택(즉시 하이라이트)
  const [playIdx, setPlayIdx] = useState(0); // 실제 재생(디바운스) — 빠른 연속 클릭이 스트림을 버스트로 쏘지 않게
  const [dead, setDead] = useState<Set<number>>(new Set());
  const [rain, setRain] = useState<Record<string, Rain>>({});
  const [loadingRegion, setLoadingRegion] = useState(true);

  const loadRegion = useCallback((key: string) => {
    setLoadingRegion(true);
    setIdx(0);
    setPlayIdx(0);
    setDead(new Set());
    const q = key ? `?region=${encodeURIComponent(key)}` : "";
    fetch(`/api/cctv${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.content)) {
          setCams([]);
          return;
        }
        if (Array.isArray(d.regions) && d.regions.length) setRegions(d.regions);
        if (d.region?.key) setRegionKey(d.region.key);
        if (d.region?.label) setRegionLabel(d.region.label);
        setCams(d.content.filter((c: Cam) => c.stream || c.cctvurl).slice(0, 12));
      })
      .catch(() => setCams([]))
      .finally(() => setLoadingRegion(false));
  }, []);

  useEffect(() => {
    loadRegion("");
  }, [loadRegion]);

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
      next.delete(i);
      return next;
    });
    setIdx(i);
  };

  // 선택(idx)을 350ms 디바운스 후에만 실제 재생(playIdx)에 반영 — 연속 클릭 시 마지막 채널만 스트림 로드.
  const safeIdx = Math.min(idx, Math.max(0, cams.length - 1));
  useEffect(() => {
    const t = setTimeout(() => setPlayIdx(safeIdx), 350);
    return () => clearTimeout(t);
  }, [safeIdx]);

  const sortedRegions = [...regions].sort((a, b) => Number(!!rain[b.key]?.raining) - Number(!!rain[a.key]?.raining));
  const curRaining = rain[regionKey]?.raining;
  const curMm = rain[regionKey]?.rain_mm;
  const allDead = cams.length > 0 && dead.size >= cams.length;
  const noCams = !loadingRegion && cams.length === 0; // 빈 상태(무한 스켈레톤 버그 방지)
  const playSafe = Math.min(playIdx, Math.max(0, cams.length - 1));
  const cur = cams[playSafe];

  return (
    <div style={{ width: "100%" }}>
      {/* 패널 헤더: 지금·지역 + 우기 배지 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#34d399", boxShadow: "0 0 0 4px rgba(52,211,153,.2)", animation: "cctvpulse 1.6s infinite" }} />
          지금 · {regionLabel || "현장"}
        </div>
        {curRaining && (
          <span title="비 직후엔 소하천 부유물이 폭증(first-flush)합니다 — 지금이 관측 가치가 가장 큰 순간입니다." style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: "rgba(14,116,144,.9)", color: "#fff", fontSize: 11, fontWeight: 800 }}>
            🌧 관측 적기{typeof curMm === "number" && curMm > 0 ? ` ${curMm}mm/h` : ""}
          </span>
        )}
      </div>

      {/* 지역 탭 — 가로 스크롤(비 오는 지역 우선) */}
      {regions.length > 1 && (
        <div className="scroll-x" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8 }}>
          {sortedRegions.map((r) => {
            const wet = rain[r.key]?.raining;
            const active = r.key === regionKey;
            return (
              <button
                key={r.key}
                onClick={() => loadRegion(r.key)}
                aria-pressed={active}
                style={{
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "5px 10px",
                  borderRadius: 999,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: active ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,.2)",
                  background: active ? "rgba(34,211,238,.18)" : "rgba(255,255,255,.06)",
                  color: active ? "#a5f3fc" : wet ? "#bae6fd" : "#cbd5e1",
                }}
              >
                {wet && <span aria-hidden>🌧</span>}
                {r.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 메인 플레이어 / 상태 */}
      {loadingRegion ? (
        <SkeletonPlayer />
      ) : noCams ? (
        <EmptyPanel onOther={() => sortedRegions[0] && loadRegion(sortedRegions[0].key)} />
      ) : allDead ? (
        <FallbackPanel onRetry={retryAll} poster={cams[0]?.thumb} />
      ) : cur ? (
        <CctvPlayer key={`${regionKey}-${playSafe}`} src={cur.stream || cur.cctvurl || ""} name={cur.cctvname} big poster={cur.thumb} onFail={() => handleFail(playSafe)} />
      ) : (
        <SkeletonPlayer />
      )}

      {/* 썸네일 스트립 — 가로 스크롤 */}
      {!noCams && (
        <div className="scroll-x" style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 8, paddingBottom: 4 }}>
          {(loadingRegion ? Array.from({ length: 6 }) : cams).map((c: any, i: number) => {
            if (loadingRegion) return <div key={i} style={{ flex: "none", width: 104, height: 58, borderRadius: 8, background: "linear-gradient(100deg,#1e293b 30%,#334155 50%,#1e293b 70%)", backgroundSize: "200% 100%", animation: "cctvshimmer 1.3s linear infinite" }} />;
            const active = i === safeIdx && !allDead;
            const isDead = dead.has(i);
            return (
              <button
                key={i}
                onClick={() => pickCam(i)}
                title={isDead ? "일시 오프라인 — 다시 시도" : c.cctvname}
                aria-pressed={active}
                style={{ flex: "none", width: 104, cursor: "pointer", background: "transparent", border: "none", padding: 0, textAlign: "left" }}
              >
                <span style={{ position: "relative", display: "block", width: 104, height: 58, borderRadius: 8, overflow: "hidden", background: "#0f172a", border: active ? "2px solid #22d3ee" : "2px solid transparent" }}>
                  {c.thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.thumb} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isDead ? 0.35 : 1 }} />
                  ) : (
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📷</span>
                  )}
                  {active && <span style={{ position: "absolute", top: 3, left: 3, fontSize: 8, fontWeight: 800, color: "#fff", background: "rgba(16,185,129,.92)", padding: "1px 4px", borderRadius: 3 }}>LIVE</span>}
                  {isDead && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#e2e8f0", background: "rgba(2,6,23,.55)" }}>오프라인</span>}
                </span>
                <span style={{ display: "block", marginTop: 3, fontSize: 10.5, fontWeight: active ? 800 : 600, color: active ? "#a5f3fc" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.cctvname || `채널 ${i + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkeletonPlayer() {
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", background: "linear-gradient(100deg,#0f172a 30%,#1e293b 50%,#0f172a 70%)", backgroundSize: "200% 100%", animation: "cctvshimmer 1.3s linear infinite" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, gap: 8 }}>
        <span style={{ width: 15, height: 15, border: "2px solid rgba(148,163,184,.35)", borderTopColor: "#e2e8f0", borderRadius: 999, animation: "cctvspin .8s linear infinite" }} />
        현장 영상 연결 중…
      </div>
    </div>
  );
}

function EmptyPanel({ onOther }: { onOther: () => void }) {
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "radial-gradient(120% 120% at 50% 0%,#1e293b,#0b1220)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 18 }}>
      <div style={{ fontSize: 26 }}>🗺️</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>이 지역은 공개 CCTV가 없습니다</div>
      <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, maxWidth: 300 }}>소하천 자체는 공개 스트림이 없어, 대상 하천 하류의 공공 CCTV로 대신 봅니다.</div>
      <button onClick={onOther} style={{ marginTop: 2, padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.2)", background: "rgba(14,116,144,.9)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>다른 지역 보기</button>
    </div>
  );
}

function FallbackPanel({ onRetry, poster }: { onRetry: () => void; poster?: string | null }) {
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", background: "radial-gradient(120% 120% at 50% 0%,#1e293b,#0b1220)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 18 }}>
      {poster && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.4)" }} />
      )}
      <div style={{ position: "relative", fontSize: 28 }}>{poster ? "🖼" : "🌊"}</div>
      <div style={{ position: "relative", fontSize: 13.5, fontWeight: 800, color: "#e2e8f0" }}>{poster ? "실시간 영상이 잠시 끊겼습니다" : "현장 영상이 일시적으로 연결되지 않습니다"}</div>
      <div style={{ position: "relative", fontSize: 11.5, color: "#cbd5e1", lineHeight: 1.5, maxWidth: 320 }}>
        {poster ? "최근 정지영상을 보여드리고 있어요. 공공 CCTV 스트림이 곧 복구됩니다." : "공공 CCTV(ITS) 스트림 서버가 잠시 응답하지 않고 있습니다."}
      </div>
      <button onClick={onRetry} style={{ position: "relative", marginTop: 2, padding: "7px 15px", borderRadius: 999, border: "none", background: "#0e7490", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>↻ 실시간 다시 시도</button>
    </div>
  );
}
