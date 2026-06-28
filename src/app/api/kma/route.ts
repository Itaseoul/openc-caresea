import { NextRequest, NextResponse } from "next/server";
import { getSite } from "@/lib/sites";
import { demoKma } from "@/lib/demo";

// 기상청 단기예보 조회서비스 프록시 (키 은닉)
// data.go.kr "기상청_단기예보 조회서비스" VilageFcstInfoService_2.0
//  - getUltraSrtNcst : 초단기실황(지금 강수, RN1/PTY/T1H) ~매시 40분 조회가능
//  - getVilageFcst   : 단기예보(POP/PTY/PCP/SKY/TMP) 1일8회 02/05/08/11/14/17/20/23시 발표
//  - getUltraSrtFcst : 초단기예보(+6h, PTY/RN1) 매시 30분 발표
// 브라우저는 이 라우트(동일출처)만 호출 → CORS 무관 + serviceKey는 서버 env에만.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";

function kstNow(): Date {
  // 서버 TZ에 무관하게 KST(UTC+9) 기준 시각 계산
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000);
}
const p2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;

// 초단기실황: 정시 관측, ~40분 후 조회 가능 → 안전하게 45분 기준 한 시간 back-off
function ncstBase(): { base_date: string; base_time: string } {
  const d = kstNow();
  if (d.getMinutes() < 45) d.setHours(d.getHours() - 1);
  return { base_date: ymd(d), base_time: `${p2(d.getHours())}00` };
}

// 단기예보: 02/05/08/11/14/17/20/23시 발표, +10분 후 조회 가능
function vilageBase(): { base_date: string; base_time: string } {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const d = kstNow();
  d.setMinutes(d.getMinutes() - 10); // 발표 지연 보정
  const h = d.getHours();
  let slot = -1;
  for (const s of slots) if (s <= h) slot = s;
  if (slot === -1) {
    // 02시 이전 → 전날 2300
    d.setDate(d.getDate() - 1);
    return { base_date: ymd(d), base_time: "2300" };
  }
  return { base_date: ymd(d), base_time: `${p2(slot)}00` };
}

// 초단기예보: 매시 30분 발표, ~45분 후 조회
function srtFcstBase(): { base_date: string; base_time: string } {
  const d = kstNow();
  if (d.getMinutes() < 45) d.setHours(d.getHours() - 1);
  return { base_date: ymd(d), base_time: `${p2(d.getHours())}30` };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const site = getSite(sp.get("site"));
  const nx = Number(sp.get("nx")) || site.nx;
  const ny = Number(sp.get("ny")) || site.ny;
  const type = sp.get("type") ?? "ncst"; // ncst | fcst | srtfcst

  const key = process.env.KMA_SERVICE_KEY;
  if (!key) {
    // 키 활성화 전: 데모 데이터로 UI 렌더 (키 들어오면 자동 실데이터 전환)
    return NextResponse.json({
      ok: true,
      demo: true,
      site: { id: site.id, name: site.name, river: site.river },
      op: type,
      base: { base_date: "DEMO", base_time: "DEMO" },
      nx,
      ny,
      items: demoKma(type),
    });
  }

  let op: string;
  let base: { base_date: string; base_time: string };
  if (type === "fcst") {
    op = "getVilageFcst";
    base = vilageBase();
  } else if (type === "srtfcst") {
    op = "getUltraSrtFcst";
    base = srtFcstBase();
  } else {
    op = "getUltraSrtNcst";
    base = ncstBase();
  }

  const qs = new URLSearchParams({
    serviceKey: key, // Decoding 키 → URLSearchParams가 인코딩
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: base.base_date,
    base_time: base.base_time,
    nx: String(nx),
    ny: String(ny),
  });
  const url = `${BASE}/${op}?${qs.toString()}`;

  try {
    const r = await fetch(url, {
      next: { revalidate: type === "ncst" ? 300 : 1800 }, // 실황 5분 / 예보 30분 캐시
    });
    const text = await r.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      // 키 미활성/오류 시 data.go.kr이 XML로 응답 → 원문 일부 전달
      return NextResponse.json(
        { ok: false, reason: "NON_JSON", op, base, raw: text.slice(0, 500) },
        { status: 200 }
      );
    }
    const items =
      (json as any)?.response?.body?.items?.item ?? null;
    const header = (json as any)?.response?.header ?? null;
    if (!items) {
      return NextResponse.json({ ok: false, reason: "NO_ITEMS", op, base, header }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      site: { id: site.id, name: site.name, river: site.river },
      op,
      base,
      nx,
      ny,
      items,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: "FETCH_ERROR", message: String(e) },
      { status: 200 }
    );
  }
}
