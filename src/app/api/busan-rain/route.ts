import { NextRequest, NextResponse } from "next/server";

// 부산광역시 실시간 강우량 정보 (data.go.kr 6260000/BusanRainfalldepthInfoService) 프록시
// KMA_SERVICE_KEY 공용(data.go.kr 계정 키). 승인 2026-06-28(활성화 1~24h 시차 후 작동).
// 응답: 지역(구) 단위 — clientId(지역아이디)·clientName(지역명, 예 중구·사상구)·강우관측시간·최근강우(mm)
// ★학장천은 사상구 → area=사상구 로 필터. 수위 아님(강우만).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://apis.data.go.kr/6260000/BusanRainfalldepthInfoService";

// 이 서비스는 dataType=JSON을 무시하고 XML로 응답함 → <item> 태그를 객체로 변환(파싱만 보강, 키 처리·로직 불변).
function parseXmlItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const obj: Record<string, string> = {};
    const tagRe = /<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g;
    let t: RegExpExecArray | null;
    while ((t = tagRe.exec(m[1]))) obj[t[1]] = t[2].trim();
    items.push(obj);
  }
  return items;
}

export async function GET(req: NextRequest) {
  const key = process.env.KMA_SERVICE_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, reason: "NO_KEY", hint: "KMA_SERVICE_KEY 공용(data.go.kr)" }, { status: 200 });
  }
  const area = req.nextUrl.searchParams.get("area"); // 예: 사상구

  const qs = new URLSearchParams({
    serviceKey: key,
    pageNo: "1",
    numOfRows: "50",
    dataType: "JSON",
  });
  const url = `${BASE}/getRainfallInfo?${qs.toString()}`;

  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    const text = await r.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      // dataType=JSON 무시하고 XML로 오는 경우 → XML <item> 직접 파싱
      const xmlItems = parseXmlItems(text);
      if (!xmlItems.length) {
        return NextResponse.json(
          { ok: false, reason: "NON_JSON", note: "승인 직후 활성화 시차(1~24h) 또는 빈 응답", raw: text.slice(0, 300) },
          { status: 200 }
        );
      }
      json = { response: { header: { resultCode: "00" }, body: { items: { item: xmlItems } } } };
    }
    const code = json?.response?.header?.resultCode ?? json?.getRainfallInfo?.RESULT?.CODE;
    const rows = json?.response?.body?.items?.item ?? json?.getRainfallInfo?.item ?? [];
    const list = (Array.isArray(rows) ? rows : [rows]).filter(Boolean);
    const items = list
      .filter((x: any) => !area || x.clientName === area || String(x.clientName ?? "").includes(area))
      .map((x: any) => ({
        areaId: x.clientId,
        area: x.clientName,
        rainfall: x.accRain ?? x.timeDay ?? x.rainfall ?? x.recentRainfall ?? x["최근강우"],
        observedAt: x.lastRainDt ?? x.accRainDt ?? x.obsrTime ?? x["강우관측시간"],
        raw: x,
      }));
    return NextResponse.json({ ok: !!items.length, resultCode: code, count: items.length, items });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "FETCH_ERROR", message: String(e) }, { status: 200 });
  }
}
