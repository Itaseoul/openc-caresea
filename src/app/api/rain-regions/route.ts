import { NextResponse } from "next/server";
import { CCTV_REGIONS } from "@/lib/cctvRegions";
import { latLonToGrid } from "@/lib/grid";

// 지역별 "지금 비 오는가" — 기상청 초단기실황(RN1: 1시간 강수량, PTY: 강수형태).
// 소하천 부유물은 비 직후 폭증(first-flush)하므로, 비 오는 지역 = 관측 가치가 가장 큰 순간.
// 히어로가 이 결과로 "우기 관측 적기" 배지를 달고 비 오는 지역을 앞으로 정렬한다.
// KMA_SERVICE_KEY(서버 env)만 사용. 소하천 자체 CCTV는 없으므로, 대상 하천 하류 좌표로 판정.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";

function kstNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000);
}
const p2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;

// 초단기실황: 정시 관측, ~40분 후 조회 → 45분 back-off
function ncstBase() {
  const d = kstNow();
  if (d.getMinutes() < 45) d.setHours(d.getHours() - 1);
  return { base_date: ymd(d), base_time: `${p2(d.getHours())}00` };
}

// Vercel→KMA 간헐 실패로 강수값이 비는 걸 줄이기 위해 짧게 재시도.
async function fetchItems(url: string, tries = 3): Promise<any[]> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch(url, { next: { revalidate: 300 }, signal: ctl.signal });
      const j = await r.json();
      const item = j?.response?.body?.items?.item;
      return Array.isArray(item) ? item : item ? [item] : [];
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((res) => setTimeout(res, 200 + i * 300));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error("kma fetch failed");
}

export async function GET() {
  const key = process.env.KMA_SERVICE_KEY;
  const { base_date, base_time } = ncstBase();

  const regions = await Promise.all(
    CCTV_REGIONS.map(async (rg) => {
      const lat = (rg.bbox.minY + rg.bbox.maxY) / 2;
      const lon = (rg.bbox.minX + rg.bbox.maxX) / 2;
      const { nx, ny } = latLonToGrid(lat, lon);
      const base = { key: rg.key, label: rg.label, river: rg.river, nx, ny };
      if (!key) return { ...base, raining: false, rain_mm: null, unavailable: true };

      const url =
        `${BASE}?serviceKey=${encodeURIComponent(key)}&dataType=JSON&numOfRows=60&pageNo=1` +
        `&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;
      try {
        const items = await fetchItems(url);
        const rn1 = items.find((i) => i.category === "RN1")?.obsrValue;
        const pty = items.find((i) => i.category === "PTY")?.obsrValue;
        const mm = rn1 == null || rn1 === "강수없음" ? 0 : Number(rn1);
        const ptyN = Number(pty ?? 0);
        const raining = (Number.isFinite(mm) && mm > 0) || ptyN > 0;
        return { ...base, raining, rain_mm: Number.isFinite(mm) ? mm : 0, pty: ptyN };
      } catch (e) {
        return { ...base, raining: false, rain_mm: null, error: String(e) };
      }
    })
  );

  return NextResponse.json({
    ok: true,
    base_date,
    base_time,
    rainingCount: regions.filter((r) => r.raining).length,
    regions,
  });
}
