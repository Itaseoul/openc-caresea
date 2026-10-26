import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SEA:CUT 알림 상태색 (Claude design에서 자유 확장)
        ok: "#16a34a",
        watch: "#f59e0b",
        danger: "#dc2626",
        // 물·하천 포인트 컬러 (청록/파랑 계열) — 차분·신뢰 톤
        brand: {
          // Typeless 강조색(#2563a8) 계열. 2026-10-26 청록에서 바꿈(이타서울 기록 화면과 같은 틀)
          50: "#eef4fb",
          100: "#dbe7f6",
          200: "#b8cfec",
          300: "#8cb0dd",
          400: "#5b8cc9",
          500: "#3772b7",
          600: "#2563a8",
          700: "#1f5290",
          800: "#1c4475",
          900: "#193a61",
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
