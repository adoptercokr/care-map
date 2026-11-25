import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CareFacility } from '@/types/care';
import { getGradeLabel } from '@/utils/gradeLabel';
import Footer from '@/components/Footer';

function loadFacilities(): CareFacility[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'facilities.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CareFacility[];
}

export function generateStaticParams() {
  const all = loadFacilities();
  const pairs = new Set<string>();
  const params: { sido: string; sigungu: string }[] = [];
  for (const f of all) {
    if (!f.sido || !f.sigungu) continue;
    const key = `${f.sido}::${f.sigungu}`;
    if (!pairs.has(key)) {
      pairs.add(key);
      params.push({ sido: f.sido, sigungu: f.sigungu });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
}): Promise<Metadata> {
  const { sido: rawSido, sigungu: rawSg } = await params;
  const sido = decodeURIComponent(rawSido);
  const sigungu = decodeURIComponent(rawSg);
  return {
    title: `${sido} ${sigungu} 요양병원·요양원·주간보호센터 등급 비교 | 케어맵`,
    description: `${sido} ${sigungu} 지역의 국공립(정부·지자체) 시설, 요양병원 1~5등급, 장기요양 A~E등급 요양원·주간보호센터·방문요양·실버타운 정보를 한눈에 비교하세요.`,
    keywords: [
      `${sigungu} 요양원`,
      `${sigungu} 요양병원`,
      `${sigungu} 주간보호센터`,
      `${sigungu} 국공립 요양원`,
      `${sigungu} 방문요양`,
      `${sigungu} 실버타운`,
      `${sido} ${sigungu} 노인요양시설`,
    ],
    alternates: {
      canonical: `/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    },
    openGraph: {
      title: `${sido} ${sigungu} 요양병원·요양원·주간보호센터 비교 | 케어맵`,
      description: `${sido} ${sigungu} 장기요양기관 및 요양병원 평가등급, 허가 병상, 세부 인력 정보 안내`,
      url: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
    },
  };
}

export default async function SigunguPage({
  params,
}: {
  params: Promise<{ sido: string; sigungu: string }>;
}) {
  const { sido: rawSido, sigungu: rawSg } = await params;
  const sido = decodeURIComponent(rawSido);
  const sigungu = decodeURIComponent(rawSg);
  const all = loadFacilities();
  const list = all.filter((f) => f.sido.startsWith(sido) && f.sigungu === sigungu);

  const countHosp = list.filter((f) => f.type === 'hospital').length;
  const countNursing = list.filter((f) => f.type === 'nursing').length;
  const countDaycare = list.filter((f) => f.type === 'daycare').length;
  const countPublic = list.filter((f) => f.ownership === '국공립').length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '케어맵', item: 'https://care.animap.co.kr' },
      {
        '@type': 'ListItem',
        position: 2,
        name: sido,
        item: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: sigungu,
        item: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}/${encodeURIComponent(sigungu)}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0e8a8d] text-white flex items-center justify-center text-sm font-extrabold">
              C
            </span>
            <span className="text-xl font-extrabold text-slate-900">케어맵</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/region/${encodeURIComponent(sido)}`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              {sido} 전체
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-[#0e8a8d] text-white text-sm font-bold hover:bg-[#0a7073] transition"
            >
              지도에서 탐색
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-10">
        <div className="mb-6">
          <div className="text-sm font-bold text-[#0e8a8d] mb-1">
            {sido} &gt; {sigungu} 요양시설 안내
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {sido} {sigungu} 요양병원 · 요양원 · 주간보호센터 ({list.length.toLocaleString()}곳)
          </h1>
          <p className="mt-2 text-base text-slate-600">
            국공립(정부·지자체) {countPublic.toLocaleString()}곳 · 요양병원 {countHosp.toLocaleString()}곳 · 요양원 {countNursing.toLocaleString()}곳 · 주간보호 {countDaycare.toLocaleString()}곳
          </p>
        </div>

        <div className="space-y-3">
          {list.slice(0, 60).map((f) => (
            <article
              key={f.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-[#eef8f8] text-[#0e8a8d] border border-[#cbe8e8]">
                    {f.typeName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                    {f.ownership === '국공립' ? '국공립(정부·지자체)' : f.ownership}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold border border-slate-200 text-slate-700">
                    {getGradeLabel(f)}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{f.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{f.addr}</p>
                {f.staffDetail && (
                  <p className="mt-1 text-xs text-slate-500">세부 인력: {f.staffDetail}</p>
                )}
              </div>
              <div className="text-sm text-right shrink-0 space-y-1">
                <div className="font-bold text-slate-900">
                  {f.type === 'hospital'
                    ? f.capacity ? `허가 ${f.capacity}병상` : '의료기관'
                    : f.capacity ? `입소 정원 ${f.capacity}명` : '재가/방문'}
                </div>
                {f.tel && <div className="font-semibold text-[#0e8a8d]">{f.tel}</div>}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
