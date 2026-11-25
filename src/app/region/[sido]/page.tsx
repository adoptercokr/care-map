import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CareFacility } from '@/types/care';
import { getGradeLabel } from '@/utils/gradeLabel';
import Footer from '@/components/Footer';

const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

function loadFacilities(): CareFacility[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'facilities.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CareFacility[];
}

export function generateStaticParams() {
  return SIDO_LIST.map((sido) => ({ sido }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string }>;
}): Promise<Metadata> {
  const { sido: rawSido } = await params;
  const sido = decodeURIComponent(rawSido);
  return {
    title: `${sido} 요양병원·요양원·주간보호센터 등급 비교 | 케어맵`,
    description: `${sido} 지역 국공립(정부·지자체) 시설, 요양병원 1~5등급, 장기요양 A~E등급 요양원·주간보호센터·실버타운 정보를 한눈에 비교하세요.`,
    alternates: {
      canonical: `/region/${encodeURIComponent(sido)}`,
    },
    openGraph: {
      title: `${sido} 요양병원·요양원·주간보호센터 등급 비교 | 케어맵`,
      description: `${sido} 지역 장기요양기관 및 요양병원 평가등급과 세부 인력을 비교해 보세요.`,
      url: `https://care.animap.co.kr/region/${encodeURIComponent(sido)}`,
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ sido: string }>;
}) {
  const { sido: rawSido } = await params;
  const sido = decodeURIComponent(rawSido);
  const all = loadFacilities();
  const list = all.filter((f) => f.sido.startsWith(sido));

  const countHosp = list.filter((f) => f.type === 'hospital').length;
  const countNursing = list.filter((f) => f.type === 'nursing').length;
  const countDaycare = list.filter((f) => f.type === 'daycare').length;
  const countPublic = list.filter((f) => f.ownership === '국공립').length;
  const sigungus = Array.from(new Set(list.map((f) => f.sigungu).filter(Boolean))).sort();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0e8a8d] text-white flex items-center justify-center text-sm font-extrabold">
              C
            </span>
            <span className="text-xl font-extrabold text-slate-900">케어맵</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#0e8a8d] text-white text-sm font-bold hover:bg-[#0a7073] transition"
          >
            지도에서 전체 탐색
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-10">
        <div className="mb-6">
          <div className="text-sm font-bold text-[#0e8a8d] mb-1">지역별 요양시설 안내</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {sido} 요양병원 · 요양원 · 주간보호센터 ({list.length.toLocaleString()}곳)
          </h1>
          <p className="mt-2 text-base text-slate-600">
            {sido} 지역 국공립 {countPublic.toLocaleString()}곳 · 요양병원 {countHosp.toLocaleString()}곳 · 요양원 {countNursing.toLocaleString()}곳 · 주간보호 {countDaycare.toLocaleString()}곳
          </p>
        </div>

        {/* 타 시·도 빠른 이동 */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {SIDO_LIST.map((s) => (
            <Link
              key={s}
              href={`/region/${encodeURIComponent(s)}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                s === sido
                  ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* 시·군·구 하위 페이지 링크 (내부 SEO 크롤링 연결) */}
        {sigungus.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-white border border-slate-200">
            <div className="text-xs font-bold text-slate-500 mb-2.5">{sido} 시·군·구별 바로가기</div>
            <div className="flex flex-wrap gap-1.5">
              {sigungus.map((sg) => (
                <Link
                  key={sg}
                  href={`/region/${encodeURIComponent(sido)}/${encodeURIComponent(sg)}`}
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:border-[#0e8a8d] hover:text-[#0e8a8d] transition"
                >
                  {sg}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 정적 SEO용 주요 시설 리스트 */}
        <div className="space-y-3">
          {list.slice(0, 40).map((f) => (
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
