"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import CctvPlayer from "@/components/CctvPlayer";

// 홈 최상단 히어로 — 대상 하천 하류(낙동강·장수천·한강·금강 등)의 라이브 CCTV.
// "계획서"가 아니라 "이미 굴러가는 자산"으로 첫인상을 만든다.
// 지역 탭 전환 + 지역 내 하천 카메라 자동 선택(실패하면 다음 카메라로 스킵).

type Cam = { cctvname?: string; stream?: string; cctvurl?: string; water?: boolean };
type Region = { key: string; label: string; river: string };
type Rain = { key: string; raining: boolean; rain_mm: number | null };

export default function HomeHeroCctv() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionKey, setRegionKey] = useState<string>("");
  const [cams, setCams] = useState<Cam[]>([]);
  const [idx, setIdx] = useState(0);
  const [dead, setDead] = useState<Set<number>>(new Set()); // 재생 실패한 카메라 인덱스
  const [rain, setRain] = useState<Record<string, Rain>>({}); // 지역별 강수(우기 관측 적기)

  // 지역별 "지금 비" 상태 — first-flush 관측 적기 배지·정렬용
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

  // 지역 카메라 로드
  const loadRegion = useCallback((key: string) => {
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
        // 하천(물길) 카메라 우선(API가 이미 water-first 정렬) → 스트림 있는 것만
        const list = d.content.filter((c: Cam) => c.stream || c.cctvurl);
        setCams(list.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRegion("");
  }, [loadRegion]);

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
        // 다음 후보 탐색
        for (let step = 1; step <= cams.length; step++) {
          const cand = (failedIdx + step) % cams.length;
          if (!dead.has(cand) && cand !== failedIdx) return cand;
        }
        return cur;
      });
    },
    [cams.length, dead]
  );

  // 최초 1회: 대상지(부산)가 비 안 오고 다른 지역이 비 오면 그 지역으로 자동 전환(우기 관측 우선)
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

  if (cams.length === 0) return null;
  const safeIdx = Math.min(idx, cams.length - 1);
  const cur = cams[safeIdx];

  // 비 오는 지역을 앞으로 정렬(우기 관측 적기 우선 노출)
  const sortedRegions = [...regions].sort((a, b) => Number(!!rain[b.key]?.raining) - Number(!!rain[a.key]?.raining));
  const curRaining = rain[regionKey]?.raining;
  const curMm = rain[regionKey]?.rain_mm;

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 16px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", color: "#dc2626" }}>● 지금, 현장</div>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.25 }}>
            계획서가 아니라, <span style={{ color: "#0e7490" }}>이미 굴러가는 자산</span>
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
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

      <CctvPlayer key={`${regionKey}-${safeIdx}`} src={cur.stream || cur.cctvurl || ""} name={cur.cctvname} big onFail={() => handleFail(safeIdx)} />

      {/* 지역 내 카메라 전환 */}
      {cams.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {cams.map((c, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              disabled={dead.has(i)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 999,
                cursor: dead.has(i) ? "not-allowed" : "pointer",
                border: i === safeIdx ? "1px solid #0e7490" : "1px solid #e2e8f0",
                background: i === safeIdx ? "#0e7490" : "#fff",
                color: dead.has(i) ? "#cbd5e1" : i === safeIdx ? "#fff" : "#475569",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textDecoration: dead.has(i) ? "line-through" : "none",
              }}
              title={c.cctvname}
            >
              {c.cctvname || `채널 ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
