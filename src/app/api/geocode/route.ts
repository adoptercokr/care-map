import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_PLACES: Record<string, { lat: number; lng: number; name: string }> = {
  강남역: { lat: 37.4979, lng: 127.0276, name: '강남역' },
  역삼역: { lat: 37.5006, lng: 127.0365, name: '역삼역' },
  선릉역: { lat: 37.5045, lng: 127.0489, name: '선릉역' },
  잠실역: { lat: 37.5133, lng: 127.1001, name: '잠실역' },
  서울역: { lat: 37.5547, lng: 126.9707, name: '서울역' },
  홍대입구역: { lat: 37.5575, lng: 126.9245, name: '홍대입구역' },
  여의도역: { lat: 37.5216, lng: 126.9243, name: '여의도역' },
  판교역: { lat: 37.3948, lng: 127.1112, name: '판교역' },
  서현역: { lat: 37.3851, lng: 127.1235, name: '서현역' },
  수원역: { lat: 37.2659, lng: 127.0001, name: '수원역' },
  해운대: { lat: 35.1631, lng: 129.1636, name: '해운대' },
  서면역: { lat: 35.1578, lng: 129.0600, name: '서면역' },
  동대구역: { lat: 35.8797, lng: 128.6286, name: '동대구역' },
  대전역: { lat: 36.3325, lng: 127.4342, name: '대전역' },
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  // 1. 내장 주요 역/거점 즉시 매칭
  for (const [key, val] of Object.entries(FALLBACK_PLACES)) {
    if (q.includes(key) || key.includes(q)) {
      return NextResponse.json({ found: true, ...val });
    }
  }

  // 2. Kakao Local REST API (키가 있는 경우)
  const kakaoKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_API_KEY;
  if (kakaoKey) {
    try {
      const kRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=1`,
        { headers: { Authorization: `KakaoAK ${kakaoKey}` }, next: { revalidate: 3600 } }
      );
      if (kRes.ok) {
        const kData = await kRes.json();
        const doc = kData.documents?.[0];
        if (doc) {
          return NextResponse.json({
            found: true,
            lat: parseFloat(doc.y),
            lng: parseFloat(doc.x),
            name: doc.place_name || q,
          });
        }
      }
    } catch {
      // fallback to Nominatim
    }
  }

  // 3. OpenStreetMap Nominatim 무료 지오코딩 폴백
  try {
    const nRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=kr&format=json&limit=1`,
      { headers: { 'User-Agent': 'CareMap/1.0' }, next: { revalidate: 3600 } }
    );
    if (nRes.ok) {
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData[0]) {
        return NextResponse.json({
          found: true,
          lat: parseFloat(nData[0].lat),
          lng: parseFloat(nData[0].lon),
          name: q,
        });
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ found: false });
}
