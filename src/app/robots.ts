import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          '*',
          'Googlebot',
          'Yeti',
          'Bingbot',
          'GPTBot',
          'Google-Extended',
          'PerplexityBot',
          'ClaudeBot',
          'Applebot',
        ],
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://care.animap.co.kr/sitemap.xml',
    host: 'https://care.animap.co.kr',
  };
}
