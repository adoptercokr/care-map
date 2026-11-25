import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://care.animap.co.kr"),
  alternates: {
    canonical: "/",
  },
  title: "케어맵 | 전국 요양병원·요양원·주간보호센터·실버타운 등급 비교 지도",
  description:
    "국민건강보험공단 장기요양 평가등급, 건강보험심사평가원 요양병원 1~5등급, 허가 병상·인력 구성까지 지도에서 한눈에 비교해보세요.",
  keywords: [
    "요양원 찾기",
    "요양병원 등급 비교",
    "주간보호센터",
    "실버타운",
    "양로원",
    "노인장기요양기관",
    "요양원 비용 계산기",
    "케어맵",
  ],
  openGraph: {
    title: "케어맵 | 전국 요양병원·요양원·실버타운 비교 지도",
    description:
      "부모님 모실 요양병원과 요양원, 평가등급과 인력 구성을 지도에서 1분 만에 비교해보세요.",
    url: "https://care.animap.co.kr",
    siteName: "케어맵 CareMap",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://xdworld.vworld.kr" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
