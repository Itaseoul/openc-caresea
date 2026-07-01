"use client";
import { useEffect, useRef, useState } from "react";

// 스크롤 등장 애니메이션 래퍼. 뷰포트 진입 시 1회 fade+rise.
// prefers-reduced-motion 은 globals.css 가드가 처리(즉시 표시).
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  as?: any;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: delay ? `${delay}ms` : undefined }}>
      {children}
    </Tag>
  );
}
