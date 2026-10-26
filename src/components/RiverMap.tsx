"use client";

import { useEffect, useRef } from "react";
import { simpleLight, osmStandard, placeLabels } from "./basemaps";
import "leaflet/dist/leaflet.css";

type Props = { lat: number; lng: number; label: string; sub?: string };

// 관측 지점 위치 지도 — 심플 라이트(채도 낮춘 OSM) 베이스맵 + 지점 마커.
// 부모(Dashboard)에서 next/dynamic ssr:false로 import → leaflet은 클라이언트에서만 로드.
export default function RiverMap({ lat, lng, label, sub }: Props) {
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
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false, // 긴 페이지 스크롤을 가로채지 않도록
      });
      mapRef.current = map;

      simpleLight(L).addTo(map);

      // 관측·거치 후보 지점 마커 (브랜드 청록 원형 — 아이콘 에셋 의존 없음)
      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#1f5290",
        weight: 3,
        fillColor: "#3772b7",
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(label, { permanent: true, direction: "top", offset: [0, -8] })
        .bindPopup(sub ? `<strong>${label}</strong><br/><span style="color:#475569">${sub}</span>` : `<strong>${label}</strong>`);

      // 카드 안에서 컨테이너 크기가 늦게 잡히는 경우 보정
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
  }, [lat, lng, label, sub]);

  return (
    <div
      ref={elRef}
      role="img"
      aria-label={`${label} 위치 지도`}
      className="h-64 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
    />
  );
}
