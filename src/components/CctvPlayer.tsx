"use client";
import { useEffect, useRef, useState } from "react";

// 공개 CCTV HLS(m3u8) 스트림 재생기.
// 스트림은 /api/cctv/stream 동일출처 프록시를 통해 들어온다(원본 http → https 혼합콘텐츠 회피).
// 상류(Nimble/ktict)가 간헐적으로 끊겨 프록시가 502를 낼 수 있으므로:
//   - 항상 16:9 자리를 유지하고(레이아웃 안 깨짐), 로딩 중엔 스켈레톤을 보여준다.
//   - 치명 실패 시 onFail(상위가 다음 카메라로 스킵) 또는 내부 폴백(다시 시도)로 처리한다.
// Safari/iOS 는 HLS 네이티브 재생, 그 외는 hls.js.

export default function CctvPlayer({
  src,
  name,
  big = false,
  onFail,
  poster,
}: {
  src: string;
  name?: string;
  big?: boolean;
  onFail?: () => void; // 이 카메라가 끝내 실패했을 때(상위에서 다음 카메라로 스킵)
  poster?: string | null; // 정지영상(https) — 로딩/폴백 배경으로 사용
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needTap, setNeedTap] = useState(false); // 자동재생 차단 시 수동 재생 오버레이
  const [retryNonce, setRetryNonce] = useState(0); // 내부 "다시 시도"

  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: any;
    let cancelled = false;
    let netRetry = 0;
    let hardRetry = 0;
    let hasPlayed = false;
    let recoverTimer: any;
    setErr(null);
    setLoading(true);
    setNeedTap(false);

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => !cancelled && setNeedTap(false)).catch(() => {
          if (!cancelled) setNeedTap(true);
        });
      }
    };

    // Safari/iOS: 네이티브 HLS
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadeddata", () => !cancelled && setLoading(false), { once: true });
      video.addEventListener("canplay", tryPlay, { once: true });
      video.addEventListener(
        "error",
        () => {
          if (cancelled) return;
          if (onFailRef.current) onFailRef.current();
          else setErr("현재 이 카메라에 연결할 수 없습니다");
        },
        { once: true }
      );
      return () => {
        cancelled = true;
      };
    }

    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setErr("이 브라우저는 HLS 재생을 지원하지 않습니다");
          setLoading(false);
          return;
        }

        const giveUp = () => {
          if (cancelled) return;
          try {
            hls?.destroy();
          } catch {}
          if (onFailRef.current) onFailRef.current();
          else {
            setLoading(false);
            setErr("현재 이 카메라에 연결할 수 없습니다");
          }
        };

        const setup = () => {
          if (cancelled) return;
          hls = new Hls({
            liveDurationInfinity: true,
            liveSyncDurationCount: 3,
            manifestLoadingMaxRetry: 6,
            manifestLoadingRetryDelay: 1000,
            manifestLoadingMaxRetryTimeout: 8000,
            levelLoadingMaxRetry: 6,
            levelLoadingRetryDelay: 1000,
            levelLoadingMaxRetryTimeout: 8000,
            fragLoadingMaxRetry: 10,
            fragLoadingRetryDelay: 800,
            fragLoadingMaxRetryTimeout: 8000,
          });

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            netRetry = 0;
            hardRetry = 0;
            tryPlay();
          });
          hls.on(Hls.Events.FRAG_BUFFERED, () => {
            if (cancelled) return;
            netRetry = 0;
            hasPlayed = true;
            setLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
            if (cancelled || !data?.fatal) return;
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: {
                const budget = onFailRef.current && !hasPlayed ? 2 : 8;
                if (netRetry++ < budget) {
                  recoverTimer = setTimeout(() => !cancelled && hls.startLoad(), hasPlayed ? 800 : 400);
                } else giveUp();
                break;
              }
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                try {
                  hls.destroy();
                } catch {}
                if (hardRetry++ < 2) recoverTimer = setTimeout(setup, 1000);
                else giveUp();
            }
          });
        };

        setup();
      })
      .catch(() => {
        if (!cancelled) {
          setErr("플레이어 로드 실패");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (recoverTimer) clearTimeout(recoverTimer);
      if (hls) {
        try {
          hls.destroy();
        } catch {}
      }
    };
  }, [src, retryNonce]);

  const manualPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().then(() => setNeedTap(false)).catch(() => setNeedTap(true));
  };

  return (
    <div
      style={{
        borderRadius: big ? 14 : 10,
        overflow: "hidden",
        background: "#0b1220",
        border: "1px solid #e2e8f0",
        position: "relative",
        aspectRatio: "16 / 9",
        boxShadow: big ? "0 8px 30px rgba(2,6,23,.35)" : undefined,
      }}
    >
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        controls
        poster={poster ?? undefined}
        style={{ width: "100%", height: "100%", display: err ? "none" : "block", objectFit: "cover", background: "#000" }}
      />

      {/* LIVE 배지(정상 재생 시) */}
      {!err && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(220,38,38,.92)",
            color: "#fff",
            fontSize: big ? 12 : 10,
            fontWeight: 800,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "#fff", display: "inline-block", animation: "cctvpulse 1.4s infinite" }} />
          LIVE
        </div>
      )}

      {name && !err && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            right: 0,
            padding: big ? "8px 12px" : "4px 8px",
            fontSize: big ? 13 : 11,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(transparent,rgba(0,0,0,.65))",
          }}
        >
          {name}
        </div>
      )}

      {/* 스켈레톤 로더(로딩 중) — 정지영상 포스터가 있으면 그 위에, 없으면 shimmer */}
      {loading && !err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...(poster ? { background: "#000" } : { background: "linear-gradient(100deg,#0f172a 30%,#1e293b 50%,#0f172a 70%)", backgroundSize: "200% 100%", animation: "cctvshimmer 1.3s linear infinite" }) }}>
          {poster && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.55)" }} />
          )}
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontSize: 12, fontWeight: 700, background: "rgba(2,6,23,.45)", padding: "5px 11px", borderRadius: 999 }}>
            <span style={{ width: 14, height: 14, border: "2px solid rgba(226,232,240,.4)", borderTopColor: "#fff", borderRadius: 999, display: "inline-block", animation: "cctvspin .8s linear infinite" }} />
            현장 영상 연결 중…
          </span>
        </div>
      )}

      {/* 자동재생 차단 시 수동 재생 */}
      {needTap && !err && !loading && (
        <button onClick={manualPlay} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.3)", border: "none", cursor: "pointer" }} aria-label="재생">
          <span style={{ width: big ? 64 : 48, height: big ? 64 : 48, borderRadius: 999, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", fontSize: big ? 26 : 20 }}>▶</span>
        </button>
      )}

      {/* 폴백(연결 불가) — 정지영상이 있으면 그걸 배경으로(현장은 여전히 보임) + 다시 시도 */}
      {err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: 16, textAlign: "center", background: "radial-gradient(120% 120% at 50% 0%,#1e293b,#0b1220)" }}>
          {poster && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.4)" }} />
          )}
          <div style={{ position: "relative", fontSize: 22 }}>{poster ? "🖼" : "📴"}</div>
          <div style={{ position: "relative", fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{name ?? "현장 CCTV"}</div>
          <div style={{ position: "relative", fontSize: 11.5, color: "#cbd5e1", lineHeight: 1.5, maxWidth: 320 }}>
            {poster ? "실시간 영상이 잠시 끊겨 최근 정지영상을 보여줍니다." : `${err}. 공공 스트림 서버가 일시적으로 응답하지 않습니다.`}
          </div>
          <button
            onClick={() => setRetryNonce((n) => n + 1)}
            style={{ position: "relative", marginTop: 2, padding: "6px 14px", borderRadius: 999, border: "1px solid #334155", background: "#0e7490", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            ↻ 실시간 다시 시도
          </button>
        </div>
      )}

      <style>{`
        @keyframes cctvspin { to { transform: rotate(360deg) } }
        @keyframes cctvpulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        @keyframes cctvshimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}
