import { NextRequest, NextResponse } from "next/server";

// 한강홍수통제소 OpenAPI 프록시 (api.hrfco.go.kr) — 전국(낙동강 포함) 수문자료.
// 실측: ACAO:* (브라우저도 가능). 단 키가 등록 URL/IP에 바인딩 → 배포 도메인 등록 필요.
// type=waterlevel|rainfall|dam|fldfct, obs=관측소코드(미지정 시 전체 최신), tt=시간구분(기본 10M, 1H/1D)
// ★시간구분 토큰은 `10M`(언더스코어 없음). `_10M`은 code:910 Time Type 형식 오류.
// info=1 → 관측소 제원(코드·이름·위경도) 목록. 예) /api/hrfco?type=waterlevel&info=1 후
//   응답에서 obsnm(관측소명)에 "낙동강 하구둑/명호/구포" 등을 필터해 obscd(코드)를 찾는다.
// ★홍제천 사천교 코드는 키 발급 후 waterlevel/info로 확정. 소하천이라 미존재 가능 → 서울 OA-1167 대용.
// 필드: WL(수위) ATTWL(주의) WRNWL(경계/경보) ALMWL(위험) SRSWL(심각/계획홍수위) RF(강우)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 한국 정부 API(api.hrfco.go.kr)가 해외(iad1) 리전 egress를 막는 정황 → 서울 리전에서 호출.
export const preferredRegion = "icn1";

export async function GET(req: NextRequest) {
  const key = process.env.HRFCO_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, reason: "NO_KEY", hint: ".env.local 에 HRFCO_KEY 설정 (hrfco 자체 발급, 전화 02-590-9999)" },
      { status: 200 }
    );
  }
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") ?? "waterlevel"; // waterlevel | rainfall | fldfct
  const obs = sp.get("obs"); // 관측소코드 (선택)
  const info = sp.get("info"); // "1"이면 관측소 제원(목록) 조회 — 코드·이름·위경도 자동 발견용
  // ★시간구분 토큰: HRFCO 실제 형식은 언더스코어 없는 `10M`/`1H`/`1D`.
  //   기존 `_10M`은 code:910(Time Type 형식 오류)을 유발 → 기본 10M, tt로 오버라이드 가능.
  const tt = (sp.get("tt") ?? "10M").replace(/[^0-9A-Za-z]/g, ""); // 화이트리스트(영숫자만)

  let path: string;
  if (info === "1") {
    // 제원(목록): 관측소코드·관측소명·위경도 등. 낙동강 하구 코드를 찾을 때 사용.
    const base = type === "rainfall" ? "rainfall" : type === "dam" ? "dam" : "waterlevel";
    path = `${key}/${base}/info.json`;
  } else if (type === "fldfct") {
    path = `${key}/fldfct/list.json`;
  } else if (type === "rainfall") {
    path = obs ? `${key}/rainfall/list/${tt}/${obs}.json` : `${key}/rainfall/list/${tt}.json`;
  } else if (type === "dam") {
    path = obs ? `${key}/dam/list/${tt}/${obs}.json` : `${key}/dam/list/${tt}.json`;
  } else {
    path = obs ? `${key}/waterlevel/list/${tt}/${obs}.json` : `${key}/waterlevel/list/${tt}.json`;
  }
  // ★한국 정부 사이트의 불완전 TLS 체인을 Vercel(undici)이 거부 → "fetch failed".
  //   https 우선, 실패 시 http 폴백(HRFCO API는 http도 지원).
  const fetchText = async (): Promise<string> => {
    for (const proto of ["https", "http"] as const) {
      try {
        const r = await fetch(`${proto}://api.hrfco.go.kr/${path}`, { next: { revalidate: 300 } });
        return await r.text();
      } catch (e) {
        if (proto === "http") throw e;
      }
    }
    throw new Error("unreachable");
  };

  try {
    const text = await fetchText();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      // 940 인증 실패(DNS/IP 미등록) 등은 비JSON일 수 있음
      return NextResponse.json({ ok: false, reason: "NON_JSON", raw: text.slice(0, 400) }, { status: 200 });
    }
    return NextResponse.json({ ok: true, type, obs, content: json?.content ?? json });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "FETCH_ERROR", message: String(e) }, { status: 200 });
  }
}
