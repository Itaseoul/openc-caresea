import { NextRequest, NextResponse } from "next/server";

// CCTV HLS 동일출처 프록시.
// ITS가 주는 cctvurl 은 http://cctvsec.ktict.co.kr/... 이고, 실제 재생은
//   cctvurl(302) → 마스터 .m3u8 → SELF/playlist.m3u8(상대) → *.ts(상대)
// 구조라, https 라이브에서는 혼합콘텐츠(http)로 브라우저가 하드 차단한다.
// → 이 라우트가 원본을 대신 받아(서버-서버는 http 무방) 동일출처 https 로 되돌린다.
//   m3u8 이면 내부의 모든 URI(세그먼트·중첩 플레이리스트·키)를 절대주소로 바꿔
//   다시 /api/cctv/stream?u=... 로 재작성 → 브라우저가 계속 프록시를 타게 한다.
//
// 사용: /api/cctv/stream?u=<encodeURIComponent(원본 http(s) URL)>
//   최초엔 ITS cctvurl 을, 이후엔 프록시가 재작성한 중첩 URL 을 브라우저가 자동 호출.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 한국 정부/공공 서버가 해외 리전 egress 를 막는 정황 → 서울 리전에서 호출.
export const preferredRegion = "icn1";

// 오픈 프록시 악용 방지: 알려진 CCTV 스트림 호스트만 허용.
const ALLOW_HOST = /(^|\.)ktict\.co\.kr$/i;

const isM3u8 = (url: string, ct: string, body: string) =>
  /\.m3u8(\?|$)/i.test(url) ||
  /mpegurl/i.test(ct) ||
  body.trimStart().startsWith("#EXTM3U");

// 프록시 경유 URL 생성
const proxied = (abs: string) => `/api/cctv/stream?u=${encodeURIComponent(abs)}`;

// m3u8 본문의 모든 URI 를 절대화 후 프록시 경유로 재작성
function rewriteManifest(body: string, baseUrl: string): string {
  const abs = (ref: string) => {
    try {
      return new URL(ref, baseUrl).toString();
    } catch {
      return ref;
    }
  };

  return body
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t) return line;

      // 태그 줄: URI="..." 속성(EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP 등)만 재작성
      if (t.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${proxied(abs(uri))}"`);
      }

      // 그 외 비주석 줄 = 세그먼트/중첩 플레이리스트 URI
      return proxied(abs(t));
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ ok: false, reason: "NO_URL" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "BAD_URL" }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol) || !ALLOW_HOST.test(target.hostname)) {
    return NextResponse.json({ ok: false, reason: "HOST_NOT_ALLOWED" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      redirect: "follow",
      // 일부 공공 스트림 서버가 UA 없으면 거부하는 경우 대비
      headers: { "User-Agent": "Mozilla/5.0 (compatible; caresea-cctv-proxy)" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, reason: "UPSTREAM_ERROR", status: upstream.status },
        { status: 502 }
      );
    }

    const finalUrl = upstream.url || target.toString(); // 리다이렉트 후 최종 주소(상대경로 기준)
    const ct = upstream.headers.get("content-type") ?? "";

    // m3u8 판별을 위해 텍스트로 먼저 소량 확인이 필요 → 매니페스트 후보면 text 로 읽어 재작성
    if (/\.m3u8(\?|$)/i.test(finalUrl) || /mpegurl/i.test(ct)) {
      const body = await upstream.text();
      if (isM3u8(finalUrl, ct, body)) {
        const rewritten = rewriteManifest(body, finalUrl);
        return new NextResponse(rewritten, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      // 매니페스트가 아니면 그대로 반환
      return new NextResponse(body, {
        status: 200,
        headers: { "Content-Type": ct || "text/plain", "Cache-Control": "no-store" },
      });
    }

    // 그 외(.ts 세그먼트, 암호화 키 등) = 바이너리 그대로 스트리밍
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct || "video/mp2t",
        // 세그먼트는 짧게 캐시(라이브라 곧 만료)
        "Cache-Control": "public, max-age=2",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "FETCH_ERROR", message: String(e) }, { status: 502 });
  }
}
