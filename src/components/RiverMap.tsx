"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = { lat: number; lng: number; label: string };

// 관측 지점 위치 지도 — 하천이 잘 보이는 CARTO Voyager 베이스맵 + 지점 마커.
// 부모(Dashboard)에서 next/dynamic ssr:false로 import → leaflet은 클라이언트에서만 로드.
export default function RiverMap({ lat, lng, label }: Props) {
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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // 관측·거치 후보 지점 마커 (브랜드 청록 원형 — 아이콘 에셋 의존 없음)
      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#0e7490",
        weight: 3,
        fillColor: "#06b6d4",
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(label, { direction: "top", offset: [0, -6] });

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
  }, [lat, lng, label]);

  return (
    <div
      ref={elRef}
      role="img"
      aria-label={`${label} 위치 지도`}
      className="h-64 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
    />
  );
}
