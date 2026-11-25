import type { MetadataRoute } from 'next';

const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const regionUrls: MetadataRoute.Sitemap = SIDO_LIST.map((sido) => ({
    url: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: 'https://care.animap.co.kr',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...regionUrls,
  ];
}
