import type { Metadata } from "next";
import "./globals.css";

const SITE_DESC =
  "도시 소하천 부유물 차단 붐의 연중 실증을 위한 운영·안전 대시보드. 강수·하천 수위로 거치·수거·철거 시점을 알린다. 비 직후는 부유물이 폭증하는 보너스 측정창.";

export const metadata: Metadata = {
  metadataBase: new URL("https://openc-caresea.vercel.app"),
  title: "SEA:CUT 실증 운영·안전 알리미 — openc.caresea.kr",
  description: SITE_DESC,
  openGraph: {
    title: "SEA:CUT — 도시 하천 부유물, 시민이 막고 기록하고 공개합니다",
    description: "연중 단기·무동력 실증 + 공개 데이터 기반 운영·안전 대시보드. 오픈소스 OpenBoom.",
    url: "https://openc-caresea.vercel.app",
    siteName: "SEA:CUT · openc.caresea.kr",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEA:CUT — 도시 하천 부유물 차단·기록·공개 실증",
    description: "연중 단기·무동력 실증 + 공개 데이터 운영·안전 대시보드. 오픈소스.",
  },
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
