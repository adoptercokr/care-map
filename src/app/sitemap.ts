import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';
import { CareFacility } from '@/types/care';

const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    {
      url: 'https://care.animap.co.kr',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  for (const sido of SIDO_LIST) {
    urls.push({
      url: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'facilities.json');
    const all = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CareFacility[];
    const seen = new Set<string>();
    for (const f of all) {
      if (!f.sido || !f.sigungu) continue;
      const key = `${f.sido}::${f.sigungu}`;
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push({
        url: `https://care.animap.co.kr/region/${encodeURIComponent(f.sido)}/${encodeURIComponent(f.sigungu)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  } catch {
    // fallback if data file unavailable
  }

  return urls;
}
