import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEA:CUT 우기 알림 — openc.caresea.kr",
  description:
    "오는 비를 절대 놓치지 않는다. 강수 예보·실황·호우특보·하천 수위로 촬영 윈도우와 철거 트리거를 알린다.",
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
