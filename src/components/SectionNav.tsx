"use client";
import { useEffect, useState } from "react";

// 스티키 앵커 내비 — 긴 랜딩에서 심사자가 관심 섹션으로 바로 점프.
// 스크롤 스파이로 현재 구간을 강조. 모바일은 가로 스크롤.
const ITEMS = [
  { id: "problem", label: "문제·해법" },
  { id: "context", label: "세계·근거" },
  { id: "dashboard", label: "작동 증거" },
  { id: "design", label: "사업 설계" },
  { id: "join", label: "함께하기" },
];

export default function SectionNav() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        // 화면 상단에 가장 가까운 보이는 섹션을 active 로
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-30 border-b border-neutral-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="scroll-x mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-3 py-2 sm:px-5">
        <span className="mr-1 hidden shrink-0 text-xs font-bold tracking-tight text-brand-700 sm:inline">SEA:CUT</span>
        {ITEMS.map((it) => {
          const on = active === it.id;
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition " +
                (on ? "bg-brand-700 text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800")
              }
            >
              {it.label}
            </a>
          );
        })}
        <a
          href="#join"
          className="ml-auto hidden shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 sm:inline-block"
        >
          후원·문의
        </a>
      </div>
    </nav>
  );
}
