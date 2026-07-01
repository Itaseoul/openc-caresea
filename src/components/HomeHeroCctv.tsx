"use client";
import { useEffect, useState } from "react";
import CctvPlayer from "@/components/CctvPlayer";

// 홈 최상단 히어로 — 낙동강 하구 인근 도로·교량 CCTV 라이브 1채널을 크게.
// "제안서"가 아니라 "지금 살아 움직이는 현장"으로 첫인상을 만든다.
// 데이터는 /api/cctv(ITS) → stream 프록시. 실패 시 조용히 접힘(레이아웃 깨짐 없음).

type Cam = { cctvname?: string; stream?: string; cctvurl?: string };

export default function HomeHeroCctv() {
  const [cams, setCams] = useState<Cam[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/cctv")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.ok || !Array.isArray(d.content)) return;
        const list = d.content.filter((c: Cam) => c.stream || c.cctvurl);
        setCams(list.slice(0, 6));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (cams.length === 0) return null;
  const cur = cams[Math.min(idx, cams.length - 1)];

  return (
    <section
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "20px 16px 4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", color: "#dc2626" }}>● 지금, 낙동강 하구 현장</div>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.25 }}>
            도시 하천의 부유 쓰레기, <span style={{ color: "#0e7490" }}>실시간으로 봅니다</span>
          </h2>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", maxWidth: 360, lineHeight: 1.5 }}>
          공공 CCTV(국가교통정보센터·ITS)를 그대로 연동한 라이브 화면입니다. 카메라를 새로 깔지 않고, 이미 열린 공개 데이터를 시민 안전·모니터링으로 잇습니다.
        </div>
      </div>

      <CctvPlayer key={idx} src={cur.stream || cur.cctvurl || ""} name={cur.cctvname} big />

      {cams.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {cams.map((c, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: i === idx ? "1px solid #0e7490" : "1px solid #e2e8f0",
                background: i === idx ? "#0e7490" : "#fff",
                color: i === idx ? "#fff" : "#475569",
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
