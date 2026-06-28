"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { SITES, CANDIDATES } from "./eulsukdoData";

export default function EulsukdoMap() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    (async () => {
      const Lmod: any = await import("leaflet");
      const L = Lmod.default ?? Lmod;
      if (cancelled || !elRef.current) return;

      map = L.map(elRef.current, {
        center: [35.088, 128.94],
        zoom: 13,
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      // 베이스맵 — 위성(현장 파악 최적)을 기본, 하천·지형/기본 토글
      const imagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      );
      const topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        subdomains: "abc",
        maxZoom: 17,
      });
      const voyager = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );
      // 위성 위에 지명 라벨(투명 오버레이) — 위치 식별 도움
      const labels = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
        { subdomains: "abcd", maxZoom: 19, pane: "shadowPane", opacity: 0.9 }
      );
      imagery.addTo(map);
      labels.addTo(map);

      const pin = (txt: string, bg: string) =>
        L.divIcon({
          className: "eul-pin",
          html: `<div style="background:${bg};color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)">${txt}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

      const markers: any[] = [];
      [...SITES, ...CANDIDATES].forEach((s) => {
        const m = L.marker([s.lat, s.lng], { icon: pin(s.id, s.color) }).addTo(map);
        const tag = s.approx
          ? '<span style="color:#b45309">· 대략 위치</span>'
          : '<span style="color:#16a34a">· 검증 좌표</span>';
        m.bindTooltip(
          `<strong>${s.id}. ${s.name}</strong> ${tag}<br/><span style="color:#475569">${s.desc}</span>`,
          { direction: "top", offset: [0, -12], className: "eul-tt" }
        );
        markers.push(m);
      });

      // 라벨 토글 컨트롤
      L.control
        .layers(
          {
            "위성 (Esri Imagery)": imagery,
            "하천·지형 (OpenTopoMap)": topoMap,
            "기본 (Voyager)": voyager,
          },
          { "지명 라벨": labels },
          { collapsed: false, position: "topright" }
        )
        .addTo(map);

      try {
        const grp = L.featureGroup(markers);
        map.fitBounds(grp.getBounds(), { padding: [40, 40], maxZoom: 14 });
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
    <div
      ref={elRef}
      role="img"
      aria-label="을숙도 낙동강 하구 설치 후보지 지도"
      style={{
        height: 520,
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#0b1f33",
      }}
    />
  );
}
