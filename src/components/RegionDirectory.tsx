'use client';

import React, { useState, useMemo } from 'react';
import { CareFacility, FacilityType } from '../types/care';
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
  '강원', '충남', '전북', '경남', '제주',
];

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
  const [onlyGradeA, setOnlyGradeA] = useState(false);
  const [onlyPublic, setOnlyPublic] = useState(false);
  const [onlySingleRoom, setOnlySingleRoom] = useState(false);
  const [onlyNoWait, setOnlyNoWait] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);

  const sigunguList = useMemo(() => {
    if (selectedSido === '전체') return [];
    const set = new Set(
      facilities
        .filter((f) => f.sido.startsWith(selectedSido) && f.sigungu)
        .map((f) => f.sigungu)
    );
    return ['전체', ...Array.from(set)];
  }, [facilities, selectedSido]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return facilities.filter((f) => {
      if (selectedSido !== '전체' && !f.sido.startsWith(selectedSido)) return false;
      if (selectedSigungu !== '전체' && f.sigungu !== selectedSigungu) return false;
      if (selectedType !== 'all' && f.type !== selectedType) return false;
      if (onlyGradeA && f.grade !== 'A') return false;
      if (onlyPublic && f.ownership !== '공립') return false;
      if (onlySingleRoom && f.room1Cost <= 0) return false;
      if (onlyNoWait && f.waiting > 0) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.addr.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [
    facilities,
    selectedSido,
    selectedSigungu,
    selectedType,
    onlyGradeA,
    onlyPublic,
    onlySingleRoom,
    onlyNoWait,
    keyword,
  ]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191f28] tracking-tight">
          지역별 요양시설 상세 검색
        </h1>
        <p className="mt-1.5 text-[15px] sm:text-base text-slate-600">
          시·도 및 시·군·구를 선택하고, 공립·A등급·1인실·입소 대기 여부를 조건별로 바로 걸러보세요.
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

        {/* 3. 유형 + 세부 조건 필터 + 검색 */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | FacilityType)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white"
            >
              <option value="all">모든 시설 유형</option>
              <option value="nursing">요양원</option>
              <option value="daycare">주간보호센터</option>
              <option value="hospital">요양병원</option>
              <option value="silvertown">실버타운</option>
              <option value="hospcare">병원간병</option>
              <option value="homecare">집간병·방문요양</option>
            </select>

            {[
              { label: '공립(국공립)', active: onlyPublic, toggle: () => setOnlyPublic(!onlyPublic) },
              { label: 'A등급 최우수', active: onlyGradeA, toggle: () => setOnlyGradeA(!onlyGradeA) },
              { label: '1인실 있음', active: onlySingleRoom, toggle: () => setOnlySingleRoom(!onlySingleRoom) },
              { label: '대기 없음', active: onlyNoWait, toggle: () => setOnlyNoWait(!onlyNoWait) },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={chip.toggle}
                className={`h-10 px-3.5 rounded-xl text-sm font-semibold border transition ${
                  chip.active
                    ? 'bg-teal-50 text-teal-800 border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.active ? `✓ ${chip.label}` : chip.label}
              </button>
            ))}
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

      {/* 검색 결과 헤더 */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="text-base font-bold text-[#191f28]">
          검색 결과 <span className="text-teal-700">{filtered.length}곳</span>
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${gCls}`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {f.grade === 'NEW' ? '신설기관' : `공단 ${f.grade}등급`}
                        {f.score ? ` (${f.score}점)` : ''}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        {f.typeName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          f.ownership === '공립'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        {f.ownership}
                      </span>
                      {f.room1Cost > 0 && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          1인실 운영
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-[#191f28]">{f.name}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {f.addr}
                      </span>
                      {f.tel && (
                        <a
                          href={`tel:${f.tel.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          {f.tel}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 중앙: 세부 지표 박스 (정원·현원·대기 / 1인실 / 월 예상) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 lg:w-[430px] shrink-0">
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">정원 / 현원</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {f.capacity} / {f.current}명
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">입소 대기</div>
                      <div
                        className={`mt-0.5 text-sm font-bold ${
                          f.waiting === 0 ? 'text-teal-700' : 'text-amber-700'
                        }`}
                      >
                        {f.waiting === 0 ? '대기 없음' : `${f.waiting}명 대기`}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f7f8fa]">
                      <div className="text-[11px] text-slate-500">1인실 추가</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-900">
                        {f.room1Cost > 0 ? `+${Math.round(f.room1Cost / 10000)}만` : '없음'}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-1 p-2.5 rounded-xl bg-[#eef8f8] border border-[#cbe8e8]">
                      <div className="text-[11px] text-slate-600">월 예상 부담</div>
                      <div className="mt-0.5 text-sm font-extrabold text-[#0e8a8d]">
                        {Math.round(f.monthlyBaseEstimate / 10000)}만 원~
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
