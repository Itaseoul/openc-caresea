import type { Metadata } from "next";
import "./globals.css";

const SITE_DESC =
  "도시 소하천 부유물 차단 붐의 연중 실증을 기획하며 만든 운영, 안전 대시보드입니다. 강수와 하천 수위로 거치, 수거, 철거 시점을 알립니다. 비가 온 직후는 부유물이 크게 늘어 측정하기 좋은 때입니다.";

export const metadata: Metadata = {
  metadataBase: new URL("https://openc-caresea.vercel.app"),
  title: "SEA:CUT 실증 운영과 안전 알리미 | openc.caresea.kr",
  description: SITE_DESC,
  openGraph: {
    title: "SEA:CUT: 도시 하천 부유물을 시민이 막고 기록하고 공개하는 실증 기획",
    description: "연중 단기, 무동력 실증 기획과 공개 데이터 기반 운영, 안전 대시보드입니다. 오픈소스 OpenBoom.",
    url: "https://openc-caresea.vercel.app",
    siteName: "SEA:CUT · openc.caresea.kr",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEA:CUT: 도시 하천 부유물 차단, 기록, 공개 실증 기획",
    description: "연중 단기, 무동력 실증 기획과 공개 데이터 운영, 안전 대시보드입니다. 오픈소스.",
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
