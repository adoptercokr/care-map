import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "케어맵 | 전국 요양원·주간보호센터 공단 평가등급 비교 지도",
  description:
    "국민건강보험공단 평가등급(A~E), 정원·현원·대기인원, 월 예상 본인부담금까지 지도에서 한눈에 비교하고 부모님 맞춤 요양시설을 찾아보세요.",
  keywords: [
    "요양원 찾기",
    "요양원 등급 비교",
    "주간보호센터",
    "노인장기요양기관",
    "요양원 비용 계산기",
    "건보공단 평가등급",
  ],
  openGraph: {
    title: "케어맵 | 전국 요양원·주간보호센터 공단 평가등급 비교 지도",
    description:
      "부모님 모실 요양원, 공단 평가등급과 예상 본인부담금을 지도에서 1분 만에 비교해보세요.",
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
