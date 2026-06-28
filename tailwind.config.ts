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
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
      },
    },
  },
  plugins: [],
};
export default config;
