"use client";
import { useEffect, useRef, useState } from "react";

// 공개 CCTV HLS(m3u8) 스트림 재생기.
// 스트림은 /api/cctv/stream 동일출처 프록시를 통해 들어온다(원본 http → https 혼합콘텐츠 회피).
// 상류(Nimble)가 간헐적으로 끊겨 프록시가 502를 낼 수 있으므로, hls.js 재시도와
// 치명적 에러 자동복구를 넉넉히 걸어 "0:00에서 멈춤" 을 방지한다.
// Safari/iOS 는 HLS 네이티브 재생, 그 외는 hls.js.

export default function CctvPlayer({
  src,
  name,
  big = false,
  onFail,
}: {
  src: string;
  name?: string;
  big?: boolean;
  onFail?: () => void; // 이 카메라가 끝내 실패했을 때(상위에서 다음 카메라로 스킵)
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needTap, setNeedTap] = useState(false); // 자동재생 차단 시 수동 재생 오버레이

  // onFail 신원이 매 렌더 바뀌어도 플레이어가 리마운트되지 않도록 ref 로 고정
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: any;
    let cancelled = false;
    let netRetry = 0; // 네트워크 에러 누적(startLoad 재개 횟수)
    let hardRetry = 0; // 그 외 치명 에러 → 전체 재생성 횟수
    let recoverTimer: any;
    setErr(null);
    setLoading(true);
    setNeedTap(false);

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => !cancelled && setNeedTap(false)).catch(() => {
          // 브라우저 자동재생 정책 차단 → 사용자 탭 유도
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
          else setErr("스트림 연결 실패");
        },
        { once: true }
      );
      return () => {
        cancelled = true;
      };
    }

    // 그 외: hls.js 동적 로드(SSR 회피)
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
          if (onFailRef.current) onFailRef.current(); // 상위가 다음 카메라로 스킵
          else setErr("스트림 연결 실패");
        };

        const setup = () => {
          if (cancelled) return;
          hls = new Hls({
            liveDurationInfinity: true,
            liveSyncDurationCount: 3,
            // 상류 간헐 실패 흡수: 재시도 넉넉히
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
            setLoading(false);
            tryPlay();
          });
          hls.on(Hls.Events.FRAG_BUFFERED, () => {
            if (cancelled) return;
            netRetry = 0;
            setLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
            if (cancelled || !data?.fatal) return;
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // 상류 502/타임아웃 등 → 로딩 재개, 과도 반복이면 포기
                if (netRetry++ < 8) {
                  recoverTimer = setTimeout(() => !cancelled && hls.startLoad(), 800);
                } else giveUp();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                // 기타 치명 에러 → 전체 재생성 2회까지 시도 후 포기
                try {
                  hls.destroy();
                } catch {}
                if (hardRetry++ < 2) {
                  recoverTimer = setTimeout(setup, 1000);
                } else giveUp();
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
  }, [src]);

  const manualPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play()
      .then(() => setNeedTap(false))
      .catch(() => setNeedTap(true));
  };

  return (
    <div
      style={{
        borderRadius: big ? 14 : 10,
        overflow: "hidden",
        background: "#000",
        border: "1px solid #e2e8f0",
        position: "relative",
        boxShadow: big ? "0 8px 30px rgba(2,6,23,.35)" : undefined,
      }}
    >
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        controls
        style={{ width: "100%", aspectRatio: "16 / 9", display: "block", background: "#000" }}
      />

      {/* 라이브 배지 */}
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
          letterSpacing: ".02em",
        }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: 999, background: "#fff", display: "inline-block", animation: "cctvpulse 1.4s infinite" }}
        />
        LIVE
      </div>

      {name && (
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

      {/* 로딩 스피너 */}
      {loading && !err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12, gap: 8, pointerEvents: "none" }}>
          <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: 999, display: "inline-block", animation: "cctvspin .8s linear infinite" }} />
          연결 중…
        </div>
      )}

      {/* 자동재생 차단 시 수동 재생 버튼 */}
      {needTap && !err && (
        <button
          onClick={manualPlay}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.35)", border: "none", cursor: "pointer" }}
          aria-label="재생"
        >
          <span style={{ width: big ? 64 : 48, height: big ? 64 : 48, borderRadius: 999, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", fontSize: big ? 26 : 20 }}>
            ▶
          </span>
        </button>
      )}

      {err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5", fontSize: 12, background: "rgba(0,0,0,.5)" }}>
          {err}
        </div>
      )}

      <style>{`
        @keyframes cctvspin { to { transform: rotate(360deg) } }
        @keyframes cctvpulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
      `}</style>
    </div>
  );
}
