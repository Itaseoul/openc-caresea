import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEA:CUT 실증 운영·안전 알리미 — openc.caresea.kr",
  description:
    "도시 소하천 부유물 차단 붐의 연중 실증을 위한 운영·안전 대시보드. 강수·하천 수위로 거치·수거·철거 시점을 알린다. 비 직후는 부유물이 폭증하는 보너스 측정창.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
