"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { SOHA_DATA } from "./sohaData";

function colorFor(pct: number | null): string {
  if (pct == null) return "#cbd5e1";
  if (pct < 30) return "#dc2626";
  if (pct < 40) return "#f97316";
  if (pct < 50) return "#eab308";
  if (pct < 70) return "#0ea5e9";
  return "#1d4ed8";
}

const LEGEND = [
  { label: "30% 미만", color: "#dc2626" },
  { label: "30~39%", color: "#f97316" },
  { label: "40~49%", color: "#eab308" },
  { label: "50~69%", color: "#0ea5e9" },
  { label: "70% 이상", color: "#1d4ed8" },
  { label: "확인 중", color: "#cbd5e1" },
];

export default function SohaChoropleth() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    (async () => {
      const Lmod: any = await import("leaflet");
      const L = Lmod.default ?? Lmod;
      const topoMod: any = await import("topojson-client");
      const featureFn = topoMod.feature ?? topoMod.default?.feature;
      const topoRes = await fetch("/skorea-provinces.topo.json");
      const topo: any = await topoRes.json();
      if (cancelled || !elRef.current) return;
      const objKey = Object.keys(topo.objects)[0];
      const geo: any = featureFn(topo, topo.objects[objKey]);

      const dataMap = new Map(SOHA_DATA.map((d) => [d.name_eng, d]));

      map = L.map(elRef.current, {
        center: [36.3, 127.8],
        zoom: 7,
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      // 강이 잘 보이는 CARTO Voyager 베이스맵
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a> · GeoJSON southkorea-maps',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const layer = L.geoJSON(geo, {
        style: (f: any) => {
          const d = dataMap.get(f.properties.name_eng);
          return {
            fillColor: colorFor(d?.pct ?? null),
            color: "#ffffff",
            weight: 1.6,
            fillOpacity: 0.72,
          };
        },
        onEachFeature: (f: any, lyr: any) => {
          const d = dataMap.get(f.properties.name_eng);
          const pctTxt = d?.pct == null ? "확인 중" : `${d.pct}%`;
          const label = d?.label ?? f.properties.name_eng;
          lyr.bindTooltip(`<strong>${label}</strong><br/>소하천 정비율 ${pctTxt}`, {
            sticky: true,
            direction: "auto",
            className: "soha-tt",
          });
          lyr.on({
            mouseover: (e: any) => e.target.setStyle({ weight: 2.4, fillOpacity: 0.88 }),
            mouseout: (e: any) => layer.resetStyle(e.target),
          });
        },
      }).addTo(map);

      try {
        map.fitBounds(layer.getBounds(), { padding: [10, 10] });
      } catch {
        /* noop */
      }
      setTimeout(() => {
        if (!cancelled && map) map.invalidateSize();
      }, 0);
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
        aria-label="전국 시도별 소하천 정비율 지도"
        style={{
          height: 520,
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          background: "#f1f5f9",
        }}
      />
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {LEGEND.map((b) => (
          <span
            key={b.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#475569",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
