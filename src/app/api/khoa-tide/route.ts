import { NextRequest, NextResponse } from "next/server";

// 국립해양조사원(KHOA) 바다누리 해양정보 OpenAPI 프록시 — 실시간 조위.
// 키: www.khoa.go.kr → 오픈API 신청 후 .env.local 과 Vercel 환경변수 KHOA_KEY 설정.
// ObsCode 기본=가덕도(DT_0063, 35.024/128.811) — 낙동강 하구·을숙도 최근접 조위관측소(KHOA 검증).
//   ⚠️ DT_0001은 인천이므로 쓰지 않는다. 부산항 조위관측소는 별도 코드(동측, 하구 대표성 낮음).
//   하굿둑 영향이 있어 가덕도 개방연안 조위는 외력 기준 근사다(0단계 휴리스틱엔 충분).
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
      { ok: false, reason: "NO_KEY", hint: "KHOA_KEY 설정(www.khoa.go.kr 오픈API). ObsCode 기본=가덕도 DT_0063(낙동강 하구 최근접)." },
      { status: 200 }
    );
  }
  const sp = req.nextUrl.searchParams;
  const obs = sp.get("obs") ?? "DT_0063"; // 가덕도(낙동강 하구 최근접). DT_0001=인천이라 쓰지 않음.
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
