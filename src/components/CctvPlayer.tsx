"use client";
import { useEffect, useRef, useState } from "react";

// 공개 CCTV HLS(m3u8) 스트림 재생기.
// 리버캠 같은 앱과 동일 원리: 공공이 송출하는 스트림 URL을 받아 영상만 재생(인프라 비용 ≈ 0).
// Safari는 HLS 네이티브 재생, 그 외 브라우저는 hls.js 로 재생.

export default function CctvPlayer({ src, name }: { src: string; name?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: any;
    let cancelled = false;

    // Safari/iOS: 네이티브 HLS
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // 그 외: hls.js 동적 로드(SSR 회피)
    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ liveDurationInfinity: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
            if (data?.fatal) setErr("스트림 연결 실패");
          });
        } else {
          setErr("이 브라우저는 HLS 재생을 지원하지 않습니다");
        }
      })
      .catch(() => setErr("플레이어 로드 실패"));

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", border: "1px solid #e2e8f0", position: "relative" }}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        controls
        style={{ width: "100%", aspectRatio: "16 / 9", display: "block", background: "#000" }}
      />
      {name && (
        <div style={{ position: "absolute", left: 0, bottom: 0, right: 0, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(transparent,rgba(0,0,0,.6))" }}>
          {name}
        </div>
      )}
      {err && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5", fontSize: 12, background: "rgba(0,0,0,.5)" }}>
          {err}
        </div>
      )}
    </div>
  );
}
