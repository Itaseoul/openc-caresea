"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// 낙동강 하구 소하천 실증 지도 — Ocean Cleanup식 심플 라이트(CARTO Positron) 베이스 위에
// 지류 소하천 길목(감전천·학장천·괴정천)과 하구(을숙도)를 트랙 색으로, 낙동강→남해 흐름을 화살표로.
// "use client" + useEffect 내 동적 import(leaflet) → 서버 컴포넌트(Proposal)에서 일반 import 가능.

type Track = "data" | "boom" | "obs" | "estuary";

type Spot = {
  id: string; name: string; gu: string; lat: number; lon: number;
  track: Track; grade: string; note: string;
};

// 좌표는 합류부 길목 기준 검토 단계 근사 — 정확한 지점·하천구역은 부산시·관할 구청 협의로 확정.
const SPOTS: Spot[] = [
  { id: "gamjeon", name: "감전천", gu: "사상구", lat: 35.158, lon: 128.969, track: "data", grade: "지방하천",
    note: "낙동강 본류 직결 · 처분청 사상구청 · 부산시 협력 데이터 실증(우선)" },
  { id: "hakjang", name: "학장천 엄궁동", gu: "사상구", lat: 35.138, lon: 128.969, track: "obs", grade: "지방하천",
    note: "운영·안전 대시보드 관측 지점 · 자체 IoT 수위 계측 후보" },
  { id: "goejeong", name: "괴정천", gu: "사하구", lat: 35.102, lon: 128.966, track: "boom", grade: "지방하천",
    note: "OpenBoom 무동력 붐 물리 실증 트랙(마이크로소프트 기금 응모 중)" },
  { id: "eulsukdo", name: "을숙도 하구", gu: "사하구", lat: 35.097, lon: 128.940, track: "estuary", grade: "국가하천 하구",
    note: "4중 중첩 규제(천연기념물 제179호 등) · 단계적 확장 검토" },
];

// 낙동강 본류 흐름(북→남, 바다로) — 방향 상징용 폴리라인
const NAKDONG: [number, number][] = [
  [35.205, 128.962], [35.168, 128.955], [35.128, 128.947], [35.092, 128.940], [35.058, 128.948], [35.038, 128.957],
];
const SEA = { lat: 35.036, lon: 128.958, label: "남해 · 다대포 연안" };

const TRACK: Record<Track, { color: string; fill: string; label: string; r: number }> = {
  data: { color: "#0e7490", fill: "#06b6d4", label: "데이터 실증 (우선)", r: 11 },
  boom: { color: "#b45309", fill: "#f59e0b", label: "OpenBoom 물리 실증", r: 11 },
  obs: { color: "#475569", fill: "#94a3b8", label: "관측 지점", r: 9 },
  estuary: { color: "#1d4ed8", fill: "#93c5fd", label: "하구 (확장 검토)", r: 9 },
};

export default function NakdongMap() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    (async () => {
      const mod: any = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelled || !elRef.current) return;

      map = L.map(elRef.current, {
        center: [35.118, 128.952],
        zoom: 12,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      // 심플 라이트 베이스맵 (Ocean Cleanup 라이트 느낌)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // 낙동강 본류 흐름 — 굵고 옅은 청록 라인
      L.polyline(NAKDONG, { color: "#38bdf8", weight: 8, opacity: 0.45, lineCap: "round" }).addTo(map);
      L.polyline(NAKDONG, { color: "#0ea5e9", weight: 2, opacity: 0.55, dashArray: "1 10", lineCap: "round" }).addTo(map);

      // 흐름 방향 화살표(남향 ▼) — 본류 중간 지점들
      const arrow = (label = "") =>
        L.divIcon({
          className: "",
          html: `<div style="color:#0284c7;font-size:18px;font-weight:700;line-height:1;text-shadow:0 1px 2px #fff,0 -1px 2px #fff">▼</div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        });
      [1, 3].forEach((i) => L.marker(NAKDONG[i] as any, { icon: arrow(), interactive: false }).addTo(map));

      // 남해 라벨
      L.marker([SEA.lat, SEA.lon] as any, {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html: `<div style="white-space:nowrap;font-size:12px;font-weight:800;color:#1d4ed8;text-shadow:0 1px 2px #fff,0 -1px 2px #fff">${SEA.label} ▾</div>`,
          iconSize: [120, 16], iconAnchor: [10, -2],
        }),
      }).addTo(map);

      // 지점 마커 + 합류 전 '가로채는' 유입 흐름 점선
      SPOTS.forEach((s) => {
        const tk = TRACK[s.track];
        // 소하천 → 본류 방향(서남) 유입 흐름 점선
        const toMain: [number, number] = [s.lat - 0.004, s.lon - 0.018];
        L.polyline([[s.lat, s.lon], toMain], {
          color: tk.color, weight: 2, opacity: 0.5, dashArray: "4 4",
        }).addTo(map);

        L.circleMarker([s.lat, s.lon], {
          radius: tk.r, color: "#ffffff", weight: 2.5, fillColor: tk.fill, fillOpacity: 0.95,
        })
          .addTo(map)
          .bindTooltip(s.name, {
            permanent: true, direction: "right", offset: [10, 0], className: "nak-tt",
          })
          .bindPopup(
            `<div style="font-weight:800;color:#0f172a">${s.name} <span style="font-weight:600;color:#64748b">· ${s.gu}</span></div>` +
            `<div style="margin-top:2px;font-size:11px;color:${tk.color};font-weight:700">${tk.label} · ${s.grade}</div>` +
            `<div style="margin-top:4px;font-size:12px;color:#475569;line-height:1.5;max-width:220px">${s.note}</div>`
          );
      });

      setTimeout(() => { if (!cancelled && map) map.invalidateSize(); }, 0);
    })();

    return () => {
      cancelled = true;
      const m = map ?? mapRef.current;
      if (m) m.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div>
      <div
        ref={elRef}
        role="img"
        aria-label="부산 낙동강 하구로 흘러드는 소하천 길목 실증 지도"
        className="h-[440px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
      />
      {/* 범례 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-600">
        {Object.values(TRACK).map((t) => (
          <span key={t.label} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-white" style={{ background: t.fill, boxShadow: `0 0 0 1px ${t.color}` }} />
            {t.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="text-sky-500">▼</span> 낙동강 → 남해 흐름
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-neutral-400">┄</span> 합류 전 가로채는 지점
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-neutral-400">
        지점 위치는 합류부 길목 기준 검토 단계 근사이며, 정확한 지점·하천구역은 부산시·관할 구청 협의로 확정합니다.
        베이스맵 © OpenStreetMap · CARTO.
      </p>
    </div>
  );
}
