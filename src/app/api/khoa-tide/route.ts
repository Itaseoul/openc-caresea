import { NextRequest, NextResponse } from "next/server";

// 국립해양조사원(KHOA) 바다누리 해양정보 OpenAPI 프록시 — 실시간 조위.
// 키: www.khoa.go.kr → 오픈API 신청 후 .env.local 과 Vercel 환경변수 KHOA_KEY 설정.
// ObsCode: 조위관측소 코드. 낙동강 하구·을숙도 인근은 부산 조위관측소 — ★코드 확인 필요(기본 DT_0001은 미검증).
// 엔드포인트: tideObsRecent(실시간 조위), tideObsPreTab(당일 고/저조). ResultType=json.
// 응답 파싱은 best-effort(스키마는 키 발급 후 실응답으로 확정). factor=당일 고/저조 정규화(0 간조~1 만조).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const BASE = "http://www.khoa.go.kr/api/oceangrid";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function khoa(path: string): Promise<any | null> {
  try {
    const r = await fetch(`${BASE}/${path}`, { next: { revalidate: 300 } });
    return JSON.parse(await r.text());
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.KHOA_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, reason: "NO_KEY", hint: "KHOA_KEY 설정(www.khoa.go.kr 오픈API). ObsCode=부산 조위관측소 코드 확인 필요." },
      { status: 200 }
    );
  }
  const sp = req.nextUrl.searchParams;
  const obs = sp.get("obs") ?? "DT_0001"; // ★부산 조위관측소 코드 — 확인 필요
  const date = sp.get("date"); // yyyymmdd (고/저조 정규화용, 선택)
  const k = encodeURIComponent(key);
  const o = encodeURIComponent(obs);

  const recent = await khoa(`tideObsRecent/search.do?ServiceKey=${k}&ObsCode=${o}&ResultType=json`);
  const rows: any[] = recent?.result?.data ?? [];
  const latest = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
  const level = num(latest?.tide_level ?? latest?.tideLevel);

  // 당일 고/저조로 정규화한 factor(0 간조~1 만조) — date 제공 시.
  let factor: number | null = null;
  let high: number | null = null;
  let low: number | null = null;
  if (date) {
    const pre = await khoa(`tideObsPreTab/search.do?ServiceKey=${k}&ObsCode=${o}&Date=${encodeURIComponent(date)}&ResultType=json`);
    const pr: any[] = pre?.result?.data ?? [];
    const levels = pr.map((x: any) => num(x.tph_level ?? x.tphLevel)).filter((v): v is number => v != null);
    if (levels.length) {
      high = Math.max(...levels);
      low = Math.min(...levels);
    }
    if (level != null && high != null && low != null && high > low) {
      factor = Math.max(0, Math.min(1, (level - low) / (high - low)));
    }
  }

  return NextResponse.json({
    ok: level != null,
    obs,
    level,
    factor,
    high,
    low,
    note: "실시간 조위(best-effort 파싱). factor=당일 고/저조 정규화(date 제공 시), 0 간조~1 만조.",
  });
}
