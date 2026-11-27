export const dynamic = 'force-static';

const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export async function GET() {
  const baseUrl = 'https://care.animap.co.kr';
  const buildDate = new Date().toUTCString();

  const regionItems = SIDO_LIST.map((sido) => {
    const url = `${baseUrl}/region/${encodeURIComponent(sido)}`;
    return `    <item>
      <title><![CDATA[${sido} 요양원·요양병원·주간보호센터 등급 비교 - 케어맵]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${sido} 지역 국민건강보험공단 평가등급(A~E) 요양원·주간보호센터, 심평원 요양병원(1~5등급), 국공립 시설 및 실버타운 정보를 한눈에 비교해보세요.]]></description>
      <category><![CDATA[지역별 요양시설]]></category>
      <pubDate>${buildDate}</pubDate>
    </item>`;
  }).join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>케어맵 (CareMap) - 전국 요양병원·요양원·주간보호·실버타운 등급 비교 지도</title>
    <link>${baseUrl}</link>
    <description>국민건강보험공단 장기요양 평가등급(A~E), 건강보험심사평가원 요양병원 1~5등급, 국공립 시설, 병상·인력 정보를 지도에서 비교할 수 있는 시니어 돌봄 플랫폼</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title><![CDATA[케어맵 전국 31,721개 요양병원·요양원·주간보호 등급 비교 지도]]></title>
      <link>${baseUrl}</link>
      <guid isPermaLink="true">${baseUrl}</guid>
      <description><![CDATA[국공립 시설, 공단 A~E등급 요양원, 심평원 1~5등급 요양병원, 장기요양등급 비용 계산기와 돌봄 가이드를 제공합니다.]]></description>
      <category><![CDATA[전체 지도]]></category>
      <pubDate>${buildDate}</pubDate>
    </item>
${regionItems}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
