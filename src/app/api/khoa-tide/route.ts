import { NextRequest, NextResponse } from "next/server";

// 국립해양조사원(KHOA) 실시간 조위 — 두 경로 지원(새 키 없이도 가능).
//  경로 ①  KHOA_KEY = 바다누리 해양정보 OpenAPI(khoa.go.kr/oceangrid) 전용 무료 키.
//  경로 ②  새 키 불필요 — 기존 KMA_SERVICE_KEY(data.go.kr 공용 인증키)로
//          data.go.kr #15142507「조위관측소 실측·예측 조위 조회」활용신청 후,
//          가이드의 요청 URL을 KHOA_DATAGO_URL 에 넣는다(치환 토큰 {key}{obs}{date}).
//  ObsCode 기본=가덕도 DT_0063(낙동강 하구 최근접). DT_0001은 인천이라 쓰지 않음.
//  factor=당일 고/저조 정규화(0 간조~1 만조). 응답 파싱은 best-effort(스키마는 발급/활용신청 후 실응답으로 확정).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const BADANURI = "http://www.khoa.go.kr/api/oceangrid";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function getJson(url: string): Promise<any | null> {
  try {
    return JSON.parse(await (await fetch(url, { next: { revalidate: 300 } })).text());
  } catch {
    return null;
  }
}

function factorFrom(level: number | null, levels: number[]): { factor: number | null; high: number | null; low: number | null } {
  if (!levels.length) return { factor: null, high: null, low: null };
  const high = Math.max(...levels);
  const low = Math.min(...levels);
  const factor = level != null && high > low ? Math.max(0, Math.min(1, (level - low) / (high - low))) : null;
  return { factor, high, low };
}

// 경로 ① 바다누리(KHOA_KEY)
async function viaBadanuri(key: string, obs: string, date: string | null) {
  const k = encodeURIComponent(key);
  const o = encodeURIComponent(obs);
  const recent = await getJson(`${BADANURI}/tideObsRecent/search.do?ServiceKey=${k}&ObsCode=${o}&ResultType=json`);
  const rows: any[] = recent?.result?.data ?? [];
  const latest = Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
  const level = num(latest?.tide_level ?? latest?.tideLevel);

  let factor: number | null = null, high: number | null = null, low: number | null = null;
  if (date) {
    const pre = await getJson(`${BADANURI}/tideObsPreTab/search.do?ServiceKey=${k}&ObsCode=${o}&Date=${encodeURIComponent(date)}&ResultType=json`);
    const pr: any[] = pre?.result?.data ?? [];
    const levels = pr.map((x: any) => num(x.tph_level ?? x.tphLevel)).filter((v): v is number => v != null);
    ({ factor, high, low } = factorFrom(level, levels));
  }
  return NextResponse.json({ ok: level != null, source: "badanuri", obs, level, factor, high, low });
}

// 경로 ② data.go.kr(#15142507) — 기존 KMA_SERVICE_KEY 재사용, 새 키 불필요.
async function viaDataGo(key: string, tmpl: string, obs: string, date: string | null) {
  const url = tmpl
    .replace("{key}", encodeURIComponent(key))
    .replace("{obs}", encodeURIComponent(obs))
    .replace("{date}", encodeURIComponent(date ?? ""));
  const j = await getJson(url);
  // 방어적 파싱: 실측+예측 조위가 함께 온다. 조위 필드 후보를 폭넓게 본다.
  const items: any[] = j?.response?.body?.items?.item ?? j?.result?.data ?? j?.items ?? [];
  const list = Array.isArray(items) ? items : [items].filter(Boolean);
  const levels = list
    .map((x: any) => num(x.tide_level ?? x.tph_level ?? x.obs_level ?? x.tideLevel ?? x["조위"]))
    .filter((v): v is number => v != null);
  const level = levels.length ? levels[levels.length - 1] : null;
  const { factor, high, low } = factorFrom(level, levels);
  return NextResponse.json({
    ok: level != null,
    source: "data.go.kr#15142507",
    obs,
    level,
    factor,
    high,
    low,
    note: "data.go.kr 경로(KMA_SERVICE_KEY 재사용). 필드명은 활용신청 가이드로 확정 권장.",
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const obs = sp.get("obs") ?? "DT_0063"; // 가덕도(낙동강 하구 최근접)
  const date = sp.get("date"); // yyyymmdd (고/저조 정규화용, 선택)

  const khoaKey = process.env.KHOA_KEY; // 바다누리 전용
  const datagoKey = process.env.KMA_SERVICE_KEY; // data.go.kr 공용(기존)
  const datagoUrl = process.env.KHOA_DATAGO_URL; // data.go.kr 조위 요청 URL({key}{obs}{date})

  if (khoaKey) return viaBadanuri(khoaKey, obs, date);
  if (datagoKey && datagoUrl) return viaDataGo(datagoKey, datagoUrl, obs, date);

  return NextResponse.json(
    {
      ok: false,
      reason: "NO_KEY",
      hint:
        "두 옵션(새 키 없이 ② 권장). ① KHOA_KEY=바다누리 무료 키(khoa.go.kr/oceangrid). " +
        "② 기존 KMA_SERVICE_KEY로 data.go.kr #15142507(조위관측소 실측·예측) 활용신청 후, 요청 URL을 KHOA_DATAGO_URL에 설정(토큰 {key}{obs}{date}).",
    },
    { status: 200 }
  );
}
