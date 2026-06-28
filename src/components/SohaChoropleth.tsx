"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { SOHA_DATA, colorFor, LEGEND } from "./sohaData";

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

      // 베이스맵 프리셋 — 강·하천 가시성 위주로 선택
      // 기본은 깔끔한 CARTO Voyager, "하천·지형"은 OpenTopoMap(강/소하천을 파란 선+지형 음영으로 또렷하게)
      const voyager = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );
      const topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        subdomains: "abc",
        maxZoom: 17,
      });
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
        maxZoom: 19,
      });
      topoMap.addTo(map); // 기본을 '하천·지형'으로 — 페이지 주제(하천)에 맞춤

      const layer = L.geoJSON(geo, {
        style: (f: any) => {
          const d = dataMap.get(f.properties.name_eng);
          return {
            fillColor: colorFor(d?.pct ?? null),
            color: "#ffffff",
            weight: 1.6,
            fillOpacity: 0.5, // 베이스맵 물길이 비쳐 보이도록 낮춤
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
            mouseover: (e: any) => e.target.setStyle({ weight: 2.4, fillOpacity: 0.7 }),
            mouseout: (e: any) => layer.resetStyle(e.target),
          });
        },
      }).addTo(map);

      // 베이스맵 전환 컨트롤 — '하천·지형'(기본)에서 강/소하천이 가장 잘 보임
      L.control
        .layers(
          {
            "하천·지형 (OpenTopoMap)": topoMap,
            "기본 (Voyager)": voyager,
            "OSM 표준": osm,
          },
          {},
          { collapsed: false, position: "topright" }
        )
        .addTo(map);

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
        aria-label="전국 시도별 소하천 정비율 지도 (하천·지형 베이스맵)"
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
      <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
        지도 우측 상단에서 베이스맵을 바꿀 수 있습니다 — <b>하천·지형</b> 모드에서 강·소하천 물길이 가장 또렷하게 보입니다.
      </div>
    </div>
  );
}
