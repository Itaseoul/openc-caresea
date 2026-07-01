// 함께하는 사람들 — 참여 멤버.
// ⚠️ 생성형 아바타(가짜 얼굴)는 펀드 심사자에게 "채운 느낌"을 주고 정직 원칙과 마찰이 있어,
//    이름 이니셜 모노그램(2D CSS, 외부 요청 0)으로 표기한다. 실사진 확보 시 교체 권장.
//    개인별 역할은 확인된 바가 없어 임의 부여하지 않고(정직), 집합 역할만 캡션으로 밝힌다.

const MEMBERS = ["유권선", "이진주", "한다원", "장지현", "이기쁨", "한유사랑", "김도훈", "양선화", "김현우"];

// 이름 → 안정적 브랜드 계열 톤(청록 단색조로 좁혀 정돈감)
const TONES = ["#0e7490", "#0891b2", "#155e75", "#0d9488", "#0369a1", "#164e63", "#06b6d4", "#0e7490", "#0891b2"];
function toneOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export default function MembersRow() {
  return (
    <section className="border-t border-neutral-100 py-12 sm:py-14">
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          <span className="h-px w-8 bg-brand-600" aria-hidden />
          함께하는 사람들
        </div>
        <h2 className="mb-2 text-balance text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">멤버 {MEMBERS.length}명</h2>
        <p className="mb-6 max-w-2xl text-[15px] leading-7 text-neutral-600">
          운영·데이터·현장·행정을 나눠 맡아 이 실증을 함께 굴리는 사람들입니다. 사단법인 이타서울 소속.
        </p>

        <ul className="flex flex-wrap items-start gap-x-5 gap-y-5">
          {MEMBERS.map((name) => (
            <li key={name} className="flex w-16 flex-col items-center gap-1.5 sm:w-[72px]">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white shadow-sm ring-2 ring-white transition hover:-translate-y-0.5 hover:shadow-md sm:h-16 sm:w-16"
                style={{ background: toneOf(name) }}
                aria-hidden
              >
                {name.slice(0, 1)}
              </span>
              <span className="text-center text-[12.5px] font-medium text-neutral-600">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
