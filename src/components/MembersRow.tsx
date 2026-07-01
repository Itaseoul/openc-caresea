// 함께하는 사람들 — 현재 참여 멤버 아바타(깃허브 컨트리뷰터 스타일).
// 아바타는 오픈소스 생성기 DiceBear(MIT, https://dicebear.com) HTTP API 를 이름 시드로 fetch.
//   외부 서비스 하나에 의존하지 않도록, 로드 실패 시 CSS 이니셜 배지로 폴백.
// 서버 컴포넌트(정적) — 상호작용 없음.

const MEMBERS = [
  "유권선",
  "이진주",
  "한다원",
  "장지현",
  "이기쁨",
  "한유사랑",
  "김도훈",
  "양선화",
  "김현우",
];

// 이름 → 안정적 배경색(이니셜 폴백용)
const PALETTE = ["#0e7490", "#0891b2", "#0d9488", "#2563eb", "#7c3aed", "#c026d3", "#db2777", "#ea580c", "#16a34a"];
function colorOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// DiceBear "notionists" — 사람 느낌의 오픈소스 아바타. 시드=이름 → 결정적.
function avatarUrl(name: string) {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=e0f2fe,ecfeff,f0fdfa&radius=50`;
}

export default function MembersRow() {
  return (
    <section className="border-t border-neutral-100 py-10 sm:py-12">
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">함께하는 사람들</div>
        <h2 className="mb-4 text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">
          지금 이 실증을 굴리는 {MEMBERS.length}명
        </h2>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-4">
          {MEMBERS.map((name) => (
            <li key={name} className="group flex flex-col items-center gap-1.5">
              <span
                className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-2 ring-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:h-16 sm:w-16"
                style={{ background: colorOf(name) }}
              >
                {/* 이니셜 폴백(아바타 뒤에 깔림) */}
                <span className="absolute text-sm font-bold text-white/95">{name.slice(0, 1)}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(name)}
                  alt={`${name} 아바타`}
                  loading="lazy"
                  className="relative h-full w-full object-cover"
                />
              </span>
              <span className="text-[12.5px] font-medium text-neutral-600">{name}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[12.5px] leading-5 text-neutral-400">
          아바타는 오픈소스 생성기{" "}
          <a href="https://dicebear.com" target="_blank" rel="noreferrer noopener" className="hover:text-brand-700">
            DiceBear
          </a>{" "}
          (Notionists · MIT)로 이름을 시드 삼아 생성했습니다.
        </p>
      </div>
    </section>
  );
}
