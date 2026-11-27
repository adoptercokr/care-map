'use client';

import React, { useState, useMemo } from 'react';
import { CareFacility, FacilityType } from '../types/care';
import { getGradeLabel } from '../utils/gradeLabel';
import {
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Building2,
  Plus,
  Check,
  Map as MapIcon,
} from 'lucide-react';

interface RegionDirectoryProps {
  facilities: CareFacility[];
  compareIds: string[];
  onToggleCompare: (facility: CareFacility) => void;
  onSelectOnMap: (facility: CareFacility) => void;
}

const SIDO_TABS = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const SIDO_ORDER: Record<string, number> = SIDO_TABS.slice(1).reduce<Record<string, number>>(
  (acc, sido, idx) => {
    acc[sido] = idx;
    return acc;
  },
  {}
);

const GRADE_RANK: Record<string, number> = {
  A: 1,
  '1': 1,
  B: 2,
  '2': 2,
  C: 3,
  '3': 3,
  D: 4,
  '4': 4,
  E: 5,
  '5': 5,
  NEW: 6,
};

function getSidoRank(sido: string): number {
  for (const [key, idx] of Object.entries(SIDO_ORDER)) {
    if (sido.startsWith(key)) return idx;
  }
  return 99;
}

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  B: 'bg-blue-50 text-blue-800 border-blue-200',
  C: 'bg-slate-100 text-slate-700 border-slate-200',
  D: 'bg-amber-50 text-amber-800 border-amber-200',
  E: 'bg-rose-50 text-rose-800 border-rose-200',
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function RegionDirectory({
  facilities,
  compareIds,
  onToggleCompare,
  onSelectOnMap,
}: RegionDirectoryProps) {
  const [selectedSido, setSelectedSido] = useState('전체');
  const [selectedSigungu, setSelectedSigungu] = useState('전체');
  const [selectedType, setSelectedType] = useState<'all' | FacilityType>('all');
  const [keyword, setKeyword] = useState('');

  // 세부 조건 토글
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C' | 'DE'>('all');
  const [onlyPublic, setOnlyPublic] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);

  const sigunguList = useMemo(() => {
    if (selectedSido === '전체') return [];
    const set = new Set(
      facilities
        .filter((f) => f.sido.startsWith(selectedSido) && f.sigungu)
        .map((f) => f.sigungu)
    );
    return ['전체', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [facilities, selectedSido]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return facilities
      .filter((f) => {
        if (selectedSido !== '전체' && !f.sido.startsWith(selectedSido)) return false;
        if (selectedSigungu !== '전체' && f.sigungu !== selectedSigungu) return false;
        if (selectedType !== 'all' && f.type !== selectedType) return false;
        if (gradeFilter === 'A' && f.grade !== 'A' && f.grade !== '1') return false;
        if (gradeFilter === 'B' && f.grade !== 'B' && f.grade !== '2') return false;
        if (gradeFilter === 'C' && f.grade !== 'C' && f.grade !== '3') return false;
        if (gradeFilter === 'DE' && !['D', 'E', '4', '5'].includes(f.grade)) return false;
        if (onlyPublic && f.ownership !== '국공립') return false;
        if (q && !f.name.toLowerCase().includes(q) && !f.addr.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const sidoDiff = getSidoRank(a.sido) - getSidoRank(b.sido);
        if (sidoDiff !== 0) return sidoDiff;
        const sgDiff = (a.sigungu || '').localeCompare(b.sigungu || '', 'ko');
        if (sgDiff !== 0) return sgDiff;
        const gDiff = (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9);
        if (gDiff !== 0) return gDiff;
        return a.name.localeCompare(b.name, 'ko');
      });
  }, [
    facilities,
    selectedSido,
    selectedSigungu,
    selectedType,
    gradeFilter,
    onlyPublic,
    keyword,
  ]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191f28] tracking-tight">
          지역별 요양시설 상세 검색
        </h1>
        <p className="mt-1.5 text-[15px] sm:text-base text-slate-600">
          시·도 및 시·군·구를 선택하고, 국공립(정부·지자체)·요양병원·A등급 시설을 조건별로 바로 걸러보세요.
        </p>
      </div>

      {/* 지역 + 세부 필터 박스 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        {/* 1. 시·도 선택 */}
        <div>
          <div className="text-xs font-bold text-slate-500 mb-2">시·도 선택</div>
          <div className="flex flex-wrap gap-1.5">
            {SIDO_TABS.map((sido) => (
              <button
                key={sido}
                onClick={() => {
                  setSelectedSido(sido);
                  setSelectedSigungu('전체');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  selectedSido === sido
                    ? 'bg-[#191f28] text-white border-[#191f28]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sido}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 시·군·구 선택 (특정 시도 선택 시 표시) */}
        {sigunguList.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 mb-2">{selectedSido} 시·군·구</div>
            <div className="flex flex-wrap gap-1.5">
              {sigunguList.map((sg) => (
                <button
                  key={sg}
                  onClick={() => setSelectedSigungu(sg)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    selectedSigungu === sg
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {sg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. 유형 버튼 + 세부 조건 필터 + 검색 */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">시설 유형</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: '전체' },
                { id: 'hospital', label: '요양병원' },
                { id: 'nursing', label: '요양원' },
                { id: 'daycare', label: '주간보호센터' },
                { id: 'homecare', label: '집간병·방문요양' },
                { id: 'silvertown', label: '실버타운·양로원' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as 'all' | FacilityType)}
                  className={`h-9 px-3.5 rounded-full text-sm font-semibold border transition ${
                    selectedType === t.id
                      ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyPublic(!onlyPublic)}
                className={`h-10 px-3.5 rounded-xl text-sm font-semibold border transition ${
                  onlyPublic
                    ? 'bg-[#eef8f8] text-[#0e8a8d] border-[#0e8a8d]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {onlyPublic ? '✓ 국공립(정부·지자체)' : '국공립(정부·지자체)'}
              </button>

              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: '전체 등급' },
                  { id: 'A', label: '최우수 (A / 1등급)' },
                  { id: 'B', label: '우수 (B / 2등급)' },
                  { id: 'C', label: '양호 (C / 3등급)' },
                  { id: 'DE', label: '보통·미흡 (D·E / 4·5등급)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGradeFilter(g.id as 'all' | 'A' | 'B' | 'C' | 'DE')}
                    className={`h-8 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                      gradeFilter === g.id
                        ? 'bg-white text-[#0e8a8d] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="시설명 또는 도로명 검색"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 검색 결과 헤더 */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="text-base font-bold text-[#191f28]">
          검색 결과 <span className="text-teal-700">{filtered.length.toLocaleString()}곳</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-500">
          정원·현원·대기인원 및 1인실 비용은 시설 사정에 따라 변동될 수 있습니다.
        </div>
      </div>

      {/* 세부 사항 카드 리스트 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-base text-slate-500">
            선택하신 조건에 맞는 요양시설이 없습니다. 필터를 일부 해제해 보세요.
          </div>
        ) : (
          <>
          {filtered.slice(0, displayLimit).map((f) => {
            const isCompared = compareIds.includes(f.id);
            const gCls = GRADE_STYLE[f.grade] || GRADE_STYLE.NEW;
            return (
              <div
                key={f.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* 좌측: 배지 + 기관명 + 주소/전화 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-extrabold ${
                          f.type === 'hospital'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : f.type === 'nursing'
                            ? 'bg-[#eef8f8] text-[#0e8a8d] border border-[#cbe8e8]'
                            : f.type === 'daycare'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {f.typeName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          f.ownership === '국공립'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {f.ownership === '국공립' ? '국공립(정부·지자체)' : f.ownership}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${gCls}`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {getGradeLabel(f)}
                        {f.score ? ` (${f.score}점)` : ''}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-[#191f28]">{f.name}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {f.addr}
                      </span>
                      {f.tel ? (
                        <a
                          href={`tel:${f.tel.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#0e8a8d] hover:underline"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          {f.tel}
                        </a>
                      ) : (
                        <a
                          href={`https://map.naver.com/p/search/${encodeURIComponent(f.name + ' ' + f.sigungu)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0e8a8d] hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          전화·상세정보(네이버 지도)
                        </a>
                      )}
                    </div>
                    {f.staffDetail && (
                      <div className="mt-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">세부 인력: </span>
                        {f.staffDetail}
                      </div>
                    )}
                  </div>

                  {/* 중앙: 세부 지표 박스 (실제 수집 데이터만 표기) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 lg:w-[430px] shrink-0">
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">
                        {f.type === 'hospital' ? '허가 병상' : '입소 정원'}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {f.type === 'hospital'
                          ? f.capacity ? `${f.capacity}병상` : '미제공'
                          : f.capacity ? `${f.capacity}명` : '재가/방문'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">
                        {f.type === 'hospital' ? '의사 인력' : '돌봄 인력'}
                      </div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {f.staffCare + f.staffNurse}명
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">평가 점수</div>
                      <div className="mt-0.5 text-sm font-bold text-[#0e8a8d]">
                        {f.score ? `${f.score}점` : f.grade === 'NEW' ? '예정' : `${f.grade}등급`}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-1 p-2.5 rounded-xl bg-[#eef8f8] border border-[#cbe8e8]">
                      <div className="text-[11px] text-slate-600">설립 / 지정</div>
                      <div className="mt-0.5 text-sm font-extrabold text-[#0e8a8d]">
                        {f.established ? `${f.established.slice(0, 4)}년` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 액션 버튼 */}
                  <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onSelectOnMap(f)}
                      className="flex-1 lg:w-28 h-9 px-3 rounded-xl bg-[#0e8a8d] text-white text-xs font-bold hover:bg-[#0a7073] flex items-center justify-center gap-1 transition"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      지도 보기
                    </button>
                    <button
                      onClick={() => onToggleCompare(f)}
                      className={`flex-1 lg:w-28 h-9 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition ${
                        isCompared
                          ? 'bg-[#eef8f8] text-[#0e8a8d] border-[#0e8a8d]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isCompared ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {isCompared ? '담김' : '비교함'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > displayLimit && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setDisplayLimit((n) => n + 50)}
                className="h-11 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-800 transition"
              >
                더 보기 ({displayLimit.toLocaleString()} / {filtered.length.toLocaleString()}곳)
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
