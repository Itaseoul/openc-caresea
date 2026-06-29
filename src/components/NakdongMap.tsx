"use client";

import { useEffect, useRef, useState } from "react";
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
  { id: "gamjeon", name: "감전천 합류부", gu: "사상구", lat: 35.1326, lon: 128.9706, track: "data", grade: "지방하천",
    note: "감전천이 엄궁동에서 학장천에 합류 · 낙동강 유입 직전 마지막 마디 · 처분청 사상구청 · 부산시 협력 데이터 실증(우선)" },
  { id: "hakjang", name: "학장천 엄궁동", gu: "사상구", lat: 35.1299, lon: 128.9695, track: "obs", grade: "지방하천",
    note: "감전천 합류 뒤 엄궁동에서 낙동강 본류로 유입 · 운영·안전 대시보드 관측 · 자체 IoT 수위 계측 후보" },
  { id: "goejeong", name: "괴정천", gu: "사하구", lat: 35.1028, lon: 128.9716, track: "boom", grade: "지방하천",
    note: "OpenBoom 무동력 붐 물리 실증 트랙(마이크로소프트 기금 응모 중)" },
  { id: "eulsukdo", name: "을숙도 하구", gu: "사하구", lat: 35.097, lon: 128.940, track: "estuary", grade: "국가하천 하구",
    note: "4중 중첩 규제(천연기념물 제179호 등) · 단계적 확장 검토" },
];

// 낙동강 본류 흐름(북→남, 바다로) — 방향 상징용 폴리라인
const NAKDONG: [number, number][] = [
  [35.205, 128.962], [35.168, 128.955], [35.128, 128.947], [35.092, 128.940], [35.058, 128.948], [35.038, 128.957],
];
const SEA = { lat: 35.036, lon: 128.958, label: "남해 · 다대포 연안" };

// 클라이언트 지도 타일 키(공개 전제). 없으면 해당 베이스맵은 컨트롤에서 생략.
const VKEY = process.env.NEXT_PUBLIC_VWORLD_KEY;
const MTOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const TRACK: Record<Track, { color: string; fill: string; label: string; r: number }> = {
  data: { color: "#0e7490", fill: "#06b6d4", label: "데이터 실증 (우선)", r: 11 },
  boom: { color: "#b45309", fill: "#f59e0b", label: "OpenBoom 물리 실증", r: 11 },
  obs: { color: "#475569", fill: "#94a3b8", label: "관측 지점", r: 9 },
  estuary: { color: "#1d4ed8", fill: "#93c5fd", label: "하구 (확장 검토)", r: 9 },
};

// 지점(SPOT) → 퇴적 위험 핫스팟(litterRisk.ts) id 매핑
const RISK_ID: Record<string, string> = {
  gamjeon: "gamjeon-confluence",
  hakjang: "hakjang-nakdong",
  goejeong: "goejeong-culvert",
  eulsukdo: "eulsukdo-estuary",
};
// 위험 등급 색(후광 링)
const RISK_COLOR: Record<string, string> = {
  낮음: "#94a3b8", 관심: "#eab308", 주의: "#f97316", 높음: "#dc2626",
};

export default function NakdongMap() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [riskInfo, setRiskInfo] = useState<{ at: string; top: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    (async () => {
      const mod: any = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelled || !elRef.current) return;

      map = L.map(elRef.current, {
        center: [35.114, 128.958],
        zoom: 12,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      // 베이스맵 비교 — 우측 상단 컨트롤에서 전환(VWorld 한글 하천 / Mapbox / 심플 / 지형)
      const bases: Record<string, any> = {
        "심플 라이트 (CARTO)": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
          subdomains: "abcd", maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }),
        "하천·지형 (OpenTopoMap)": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          subdomains: "abc", maxZoom: 17,
          attribution: '&copy; OSM · SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        }),
      };
      if (VKEY) {
        bases["VWorld 일반 (한글 하천)"] = L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${VKEY}/Base/{z}/{y}/{x}.png`, {
          maxZoom: 19, attribution: '&copy; <a href="https://www.vworld.kr">VWorld</a> (국토교통부)',
        });
        bases["VWorld 하이브리드 (위성+라벨)"] = L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${VKEY}/Hybrid/{z}/{y}/{x}.png`, {
          maxZoom: 19, attribution: '&copy; <a href="https://www.vworld.kr">VWorld</a> (국토교통부)',
        });
      }
      if (MTOKEN) {
        bases["Mapbox 거리 (하천 강조)"] = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MTOKEN}`, {
          tileSize: 512, zoomOffset: -1, maxZoom: 19, attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OSM',
        });
        bases["Mapbox 라이트"] = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${MTOKEN}`, {
          tileSize: 512, zoomOffset: -1, maxZoom: 19, attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OSM',
        });
      }
      // 기본은 심플 라이트 — 하천망을 직접 얹으므로 베이스는 깔끔하게(Ocean Cleanup 느낌)
      const defaultBase = bases["심플 라이트 (CARTO)"];
      defaultBase.addTo(map);
      L.control.layers(bases, {}, { collapsed: false, position: "topright" }).addTo(map);

      // 하천망 오버레이 — OSM 추출(감전천·학장천 수면 폴리곤, 괴정천 선/복개). 베이스맵과 무관하게 물길을 또렷이.
      try {
        const res = await fetch("/data/busan-streams.geojson");
        const gj = await res.json();
        if (!cancelled && map) {
          L.geoJSON(gj, {
            style: (f: any) => {
              const p = f.properties || {};
              if (p.tunnel === "culvert" || p.covered === "yes")
                return { color: "#38bdf8", weight: 2.5, opacity: 0.55, dashArray: "3 5", fill: false }; // 복개=점선
              if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
                return { color: "#0ea5e9", weight: 1, fillColor: "#7dd3fc", fillOpacity: 0.6 }; // 수면
              return { color: "#0ea5e9", weight: 3.5, opacity: 0.85 }; // 개방 물길
            },
            onEachFeature: (f: any, lyr: any) => {
              const nm = f.properties?.name;
              if (nm) lyr.bindTooltip(nm, { sticky: true, direction: "top", className: "nak-river-tt", opacity: 0.95 });
            },
          }).addTo(map);
        }
      } catch {
        /* 하천망 로드 실패 시 베이스맵만 — 치명적 아님 */
      }

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

      // 지점 마커 (실제 물길은 OSM 오버레이로 표시 — 합성 직선 점선은 혼란을 줘 제거)
      const markersById: Record<string, { marker: any; base: string }> = {};
      SPOTS.forEach((s) => {
        const tk = TRACK[s.track];
        const base =
          `<div style="font-weight:800;color:#0f172a">${s.name} <span style="font-weight:600;color:#64748b">· ${s.gu}</span></div>` +
          `<div style="margin-top:2px;font-size:11px;color:${tk.color};font-weight:700">${tk.label} · ${s.grade}</div>` +
          `<div style="margin-top:4px;font-size:12px;color:#475569;line-height:1.5;max-width:220px">${s.note}</div>`;
        const marker = L.circleMarker([s.lat, s.lon], {
          radius: tk.r, color: "#ffffff", weight: 2.5, fillColor: tk.fill, fillOpacity: 0.95,
        })
          .addTo(map)
          .bindTooltip(s.name, {
            permanent: true, direction: "right", offset: [10, 0], className: "nak-tt",
          })
          .bindPopup(base);
        markersById[s.id] = { marker, base };
      });

      // 지금 이 시간 퇴적 위험 — /api/litter-risk 실데이터 오버레이(후광 링 + 팝업 보강)
      try {
        const rr = await fetch("/api/litter-risk");
        const rj = await rr.json();
        if (!cancelled && map && rj?.ok && Array.isArray(rj.hotspots)) {
          rj.hotspots.forEach((h: any) => {
            const color = RISK_COLOR[h.level as string] ?? "#94a3b8";
            // 점수로 크기 조절한 위험 후광 링(클릭은 지점 마커로 통과)
            L.circleMarker([h.lat, h.lon], {
              radius: 12 + (Number(h.score) || 0) * 22,
              color, weight: 3, opacity: 0.9, fill: false, interactive: false,
            }).addTo(map);
            const spotId = Object.keys(RISK_ID).find((k) => RISK_ID[k] === h.id);
            if (spotId && markersById[spotId]) {
              const { marker, base } = markersById[spotId];
              const rain = h.rainfall_mm != null ? `강우 ${h.rainfall_mm}mm` : "강우 정보 없음";
              marker.bindPopup(
                base +
                  `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:12px">` +
                  `<b style="color:${color}">지금 퇴적 위험 ${h.level} · ${h.score}</b>` +
                  `<div style="color:#64748b;margin-top:2px">${rain} · ${h.why ?? ""}</div></div>`
              );
            }
          });
          const top = rj.hotspots[0];
          setRiskInfo({
            at: typeof rj.generatedAt === "string" ? rj.generatedAt.slice(11, 16) : "",
            top: top ? `${top.name} · ${top.level} ${top.score}` : "",
          });
        }
      } catch {
        /* 위험 오버레이 실패 — 베이스 지도는 정상, 치명적 아님 */
      }

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
          <span className="inline-block h-1 w-4 rounded bg-sky-400" /> 소하천 물길·수면 <span className="text-neutral-400">(점선=복개)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-orange-500" /> 지금 퇴적 위험 후광 <span className="text-neutral-400">(관심·주의·높음)</span>
        </span>
      </div>
      {riskInfo && (
        <div className="mt-2 rounded-lg bg-rose-50/70 px-3 py-2 text-xs text-rose-900">
          <b>지금 이 시간 퇴적 위험</b> · {riskInfo.top || "데이터 없음"}{" "}
          <span className="text-rose-400">({riskInfo.at} 기준 · 강우 first-flush 반영, 추정)</span>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-5 text-neutral-400">
        우측 상단에서 베이스맵을 바꿔 비교하세요 — <b className="font-semibold text-neutral-500">VWorld 일반</b>(한글 하천명·소하천), VWorld 하이브리드(위성), Mapbox, 심플, 지형.
        지점 위치는 합류부 길목 기준 검토 단계 근사이며, 정확한 지점·하천구역은 부산시·관할 구청 협의로 확정합니다.
        베이스맵 © VWorld · Mapbox · OpenStreetMap · CARTO.
      </p>
    </div>
  );
}
