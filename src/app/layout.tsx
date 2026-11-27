import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://care.animap.co.kr"),
  alternates: {
    canonical: "/",
  },
  title: "케어맵 | 전국 요양병원·요양원·주간보호센터·실버타운 등급 비교 지도",
  description:
    "국민건강보험공단 장기요양 평가등급(A~E), 건강보험심사평가원 요양병원 1~5등급, 국공립 시설, 허가 병상·세부 인력까지 지도에서 한눈에 비교해보세요.",
  keywords: [
    "요양원 찾기",
    "요양원 추천",
    "치매 요양원",
    "요양병원 등급 비교",
    "요양병원 추천",
    "재활 요양병원",
    "국공립 요양원",
    "시립 요양병원",
    "주간보호센터 찾기",
    "주간보호센터 비용",
    "실버타운",
    "양로원 찾기",
    "방문요양",
    "노인장기요양기관",
    "장기요양등급 비용 계산기",
    "케어맵",
    "care.animap.co.kr",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "케어맵 | 전국 요양병원·요양원·주간보호센터·실버타운 비교 지도",
    description:
      "전국 31,721개 요양병원·요양원·주간보호·실버타운의 평가등급과 인력 구성을 지도에서 1분 만에 비교해보세요.",
    url: "https://care.animap.co.kr",
    siteName: "케어맵 CareMap",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "케어맵 | 전국 요양병원·요양원 등급 비교 지도",
    description:
      "공단 장기요양 A~E등급, 심평원 요양병원 1~5등급, 국공립 시설을 지도에서 바로 비교하세요.",
  },
  verification: {
    other: {
      "naver-site-verification": "258648c655031360357844f7881bfd5f363ae2ce",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://care.animap.co.kr/#website",
      name: "케어맵 (CareMap) - 전국 요양병원·요양원·실버타운 등급 비교 지도",
      alternateName: ["케어맵", "CareMap", "요양원 등급 지도", "요양병원 비교 지도"],
      url: "https://care.animap.co.kr",
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://care.animap.co.kr/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Dataset",
      name: "대한민국 전국 장기요양기관·요양병원·실버타운 통합 비교 데이터",
      description:
        "국민건강보험공단 장기요양기관 평가등급(A~E), 건강보험심사평가원 요양병원 적정성 평가등급(1~5등급), 보건복지부 노인주거복지시설 정보를 통합한 31,721개소 데이터셋",
      url: "https://care.animap.co.kr",
      creator: {
        "@type": "Organization",
        name: "케어맵 (CareMap)",
        url: "https://care.animap.co.kr",
      },
      spatialCoverage: {
        "@type": "Place",
        name: "대한민국 (South Korea)",
      },
      isAccessibleForFree: true,
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "요양원과 요양병원의 평가등급은 어떻게 다른가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "요양원과 주간보호센터는 국민건강보험공단에서 장기요양 평가등급(A~E등급)을 부여하며, 요양병원은 건강보험심사평가원에서 의료 적정성 평가등급(1~5등급)을 부여합니다.",
          },
        },
        {
          "@type": "Question",
          name: "국공립(정부·지자체) 요양시설은 어떻게 찾을 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "케어맵 상단 카테고리에서 '국공립(정부·지자체)' 버튼을 선택하면 시립·도립·군립·구립 및 지자체 운영 요양병원과 요양원을 한눈에 모아볼 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "요양원 월 본인부담금은 대략 얼마인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "일반 대상자 기준 급여비용의 20%(주간보호는 15%)를 본인이 부담하며, 식비·간식비와 상급침실료는 비급여로 별도 산정됩니다. 케어맵 비용 계산기에서 1~5등급별 예상 금액을 계산할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "전국 실버타운과 양로원 정보도 비교할 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, 보건복지부 노인주거복지시설 현황 데이터를 기반으로 전국 227개 노인복지주택(실버타운)과 양로시설의 위치와 구분을 지도와 지역별 목록에서 비교할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "요양시설의 인력 구성(요양보호사, 간호사, 전문의)도 확인되나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, 국민건강보험공단과 건강보험심사평가원 공식 데이터를 연동해 요양보호사·간호사·간호조무사·사회복지사·물리치료사 및 요양병원 의과전문의·한의사 수와 허가 병상수를 제공합니다.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-5717882145510454" />
        <meta name="naver-site-verification" content="75c865d2d6eb8106fe7168968bef7c701509dddb" />
        <meta name="google-site-verification" content="TfgCjt2DqwAsCxIHkYqA_vCczm93acLBqCUDiT4tyj4" />
        <meta name="theme-color" content="#0e8a8d" />
        <link rel="help" type="text/plain" title="AI & LLMs Guide (llms.txt)" href="https://care.animap.co.kr/llms.txt" />
        <link rel="preconnect" href="https://xdworld.vworld.kr" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://xdworld.vworld.kr" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
            {/* Google Analytics 4 (GA4) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-GYXBJK8ZHZ"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GYXBJK8ZHZ');
          `,
        }}
      />
  </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        {/* Invisible hits.sh Real-time Counter Badge */}
        <img
          src="https://hits.sh/care.animap.co.kr.svg?view=today-total&style=flat-square&color=059669"
          alt=""
          width="1"
          height="1"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }}
        />
      </body>
    </html>
  );
}
