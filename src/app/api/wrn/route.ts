import { NextRequest, NextResponse } from "next/server";

// 기상청 기상특보 조회서비스 프록시 (data.go.kr WthrWrnInfoService, KMA_SERVICE_KEY 공용)
// 실측(2026-06-28): apis.data.go.kr CORS *, 키 승인됨(~2028-05-19).
// ★getPwnStatus = "현재 특보발효현황" 스냅샷(항상 반환, '없음'이면 맑음) → 철거 트리거에 최적.
//   getWthrWrnList = 발표 목록(특보 있을 때만, 없으면 NO_DATA).
// stnId: 서울 109, 부산 159. 호우특보 발효 시 t6/t7/other 등에 내용이 채워짐.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://apis.data.go.kr/1360000/WthrWrnInfoService";

function ymdKST(offsetDays = 0): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const d = new Date(utc + 9 * 3600000 + offsetDays * 86400000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export async function GET(req: NextRequest) {
  const key = process.env.KMA_SERVICE_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, reason: "NO_KEY", hint: "KMA_SERVICE_KEY 공용" }, { status: 200 });
  }
  const sp = req.nextUrl.searchParams;
  const stnId = sp.get("stnId") ?? "109"; // 109=서울, 159=부산
  const op = sp.get("op") ?? "status"; // status(getPwnStatus) | list(getWthrWrnList)

  const params: Record<string, string> = {
    serviceKey: key,
    dataType: "JSON",
    pageNo: "1",
    numOfRows: "10",
    stnId,
  };
  let endpoint = "getPwnStatus";
  if (op === "list") {
    endpoint = "getWthrWrnList";
    params.fromTmFc = ymdKST(-2);
    params.toTmFc = ymdKST(0);
  }
  const url = `${BASE}/${endpoint}?${new URLSearchParams(params).toString()}`;

  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    const text = await r.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, reason: "NON_JSON", raw: text.slice(0, 400) }, { status: 200 });
    }
    const code = json?.response?.header?.resultCode;
    const items = json?.response?.body?.items?.item ?? null;
    // 호우특보 발효 여부 판정: 현황 텍스트에 '호우'가 있고 '없음'이 아니면 활성
    const blob = JSON.stringify(items ?? "");
    const heavyRain = /호우/.test(blob) && !/호우[^,]{0,6}없음/.test(blob);
    return NextResponse.json({
      ok: code === "00" || code === "03", // 03=NO_DATA(특보 없음)도 정상
      stnId,
      endpoint,
      resultCode: code,
      heavyRainWarning: heavyRain, // 철거 트리거 신호
      items: items ?? [],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "FETCH_ERROR", message: String(e) }, { status: 200 });
  }
}
