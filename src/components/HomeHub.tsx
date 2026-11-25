'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CareFacility, FacilityType, ActiveTab } from '../types/care';
import {
  Search,
  MapPin,
  ArrowRight,
  Calculator,
  BookOpen,
  ShieldCheck,
  Maximize2,
  Phone,
} from 'lucide-react';

const CareMap = dynamic(() => import('./CareMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-base font-medium text-slate-500">
      지도를 불러오는 중...
    </div>
  ),
});

interface HomeHubProps {
  facilities: CareFacility[];
  compareIds: string[];
  onToggleCompare: (facility: CareFacility) => void;
  onGoToMap: (typeFilter?: 'all' | 'public' | FacilityType, query?: string) => void;
  onGoToRegion: (sido?: string) => void;
  onSelectFacilityOnMap: (facility: CareFacility) => void;
  onChangeTab: (tab: ActiveTab) => void;
}

const REGION_BUTTONS = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충남', '전북', '경남', '제주',
];

type CategoryFilter = 'all' | 'public' | FacilityType;

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'public', label: '국공립(정부·지자체)' },
  { id: 'hospital', label: '요양병원' },
  { id: 'nursing', label: '요양원' },
  { id: 'daycare', label: '주간보호센터' },
  { id: 'homecare', label: '집간병·방문요양' },
];

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  B: 'bg-blue-50 text-blue-800 border-blue-200',
  C: 'bg-slate-100 text-slate-700 border-slate-200',
  D: 'bg-amber-50 text-amber-800 border-amber-200',
  E: 'bg-rose-50 text-rose-800 border-rose-200',
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function HomeHub({
  facilities,
  compareIds,
  onToggleCompare,
  onGoToMap,
  onGoToRegion,
  onSelectFacilityOnMap,
  onChangeTab,
}: HomeHubProps) {
  const [heroQuery, setHeroQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [previewSelected, setPreviewSelected] = useState<CareFacility | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const matchesCategory = (f: CareFacility) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'public') return f.ownership === '국공립';
    return f.type === selectedCategory;
  };

  const regionFiltered = facilities.filter((f) => {
    if (!matchesCategory(f)) return false;
    if (selectedRegion !== '전체' && !f.sido.startsWith(selectedRegion)) return false;
    return true;
  });

  const filtered = facilities.filter((f) => {
    if (!matchesCategory(f)) return false;
    const q = heroQuery.trim().toLowerCase();
    if (q && !f.name.toLowerCase().includes(q) && !f.addr.toLowerCase().includes(q) && !f.sigungu.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGoToMap(selectedCategory, heroQuery);
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="bg-white">
      {/* 1. 케어닥 스타일: 정갈한 타이틀 + 통합 검색 + 한 줄 카테고리 바 */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#191f28] tracking-tight leading-snug">
                어르신을 위한 좋은 요양시설,
                <br className="sm:hidden" /> 지도에서 바로 비교하세요
              </h1>
              <p className="mt-2 text-[15px] sm:text-base text-slate-600">
                국민건강보험공단 평가등급과 정원·대기·월 예상 본인부담금을 한눈에 확인합니다.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="w-full md:w-[400px] shrink-0">
              <div className="flex items-center h-12 bg-[#f4f6f8] border border-slate-200 rounded-xl px-3.5 focus-within:bg-white focus-within:border-slate-900 transition">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="지역명(강남구, 분당) 또는 시설명"
                  className="flex-1 h-full px-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0e8a8d] text-white text-sm font-bold shrink-0 hover:bg-[#0a7073] transition"
                >
                  검색
                </button>
              </div>
            </form>
          </div>

          {/* 라인이 딱 맞는 1줄 카테고리 탭 */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPreviewSelected(null);
                  }}
                  className={`h-10 px-4 rounded-full text-[15px] font-semibold whitespace-nowrap border transition ${
                    active
                      ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. 메인 대형 지도 + 우측 시설 리스트 (비중 대폭 확대) */}
      <section className="bg-[#f7f8fa] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-7">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#191f28]">
                주변 시설 지도 탐색
              </h2>
              <span className="text-sm font-semibold text-teal-700">
                {filtered.length.toLocaleString()}곳
              </span>
            </div>
            <button
              onClick={() => onGoToMap(selectedCategory, heroQuery)}
              className="inline-flex items-center gap-1.5 text-sm sm:text-[15px] font-bold text-slate-700 hover:text-slate-900"
            >
              <Maximize2 className="w-4 h-4" />
              전체화면 지도로 보기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* 좌측/상단 대형 지도 (7/12 비중) */}
            <div className="lg:col-span-7 relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              <CareMap
                facilities={filtered}
                selectedFacility={previewSelected}
                onSelectFacility={setPreviewSelected}
                userLocation={userLocation}
                onRequestUserLocation={handleRequestLocation}
              />
            </div>

            {/* 우측 시설 리스트 (5/12 비중) */}
            <div className="lg:col-span-5 h-[400px] sm:h-[500px] bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#191f28]">
                  {previewSelected ? '선택한 시설 상세' : '검색된 시설 목록'}
                </span>
                {previewSelected ? (
                  <button
                    onClick={() => setPreviewSelected(null)}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                  >
                    목록으로
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">클릭 시 지도 이동</span>
                )}
              </div>

              {previewSelected ? (
                <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          GRADE_STYLE[previewSelected.grade] || GRADE_STYLE.NEW
                        }`}
                      >
                        {previewSelected.grade === 'NEW' ? '신설기관' : `공단 ${previewSelected.grade}등급`}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        {previewSelected.typeName}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#191f28]">
                      {previewSelected.name}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-[15px] text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                        <span>{previewSelected.addr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-teal-700 shrink-0" />
                        {previewSelected.tel ? (
                          <a
                            href={`tel:${previewSelected.tel.replace(/[^0-9+]/g, '')}`}
                            className="font-semibold text-teal-700 hover:underline"
                            title="클릭하여 전화 걸기"
                          >
                            {previewSelected.tel}
                          </a>
                        ) : (
                          <span>전화번호 정보 없음</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-[#f7f8fa]">
                        <div className="text-xs text-slate-500">
                          {previewSelected.type === 'hospital' ? '허가 병상' : '입소 정원'}
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-900">
                          {previewSelected.type === 'hospital'
                            ? previewSelected.capacity ? `${previewSelected.capacity}병상` : '미제공'
                            : previewSelected.capacity ? `${previewSelected.capacity}명` : '재가/방문'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#f7f8fa]">
                        <div className="text-xs text-slate-500">평가 점수</div>
                        <div className="mt-1 text-base font-bold text-[#0e8a8d]">
                          {previewSelected.score ? `${previewSelected.score}점` : previewSelected.grade === 'NEW' ? '평가 예정' : `${previewSelected.grade}등급`}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#f7f8fa]">
                        <div className="text-xs text-slate-500">
                          {previewSelected.type === 'hospital' ? '의사 인력' : '돌봄 인력'}
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-900">
                          {previewSelected.staffCare + previewSelected.staffNurse}명
                        </div>
                      </div>
                    </div>

                    {previewSelected.staffDetail && (
                      <div className="mt-3 p-3 rounded-xl bg-[#f7f8fa] text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900">인력 세부: </span>
                        {previewSelected.staffDetail}
                      </div>
                    )}

                    <div className="mt-4 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">설립 구분</span>
                      <span className="text-base font-extrabold text-[#0e8a8d]">
                        {previewSelected.ownership}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://map.naver.com/p/search/${encodeURIComponent(previewSelected.name + ' ' + previewSelected.sigungu)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#03C75A]" />
                        네이버 지도
                      </a>
                      <a
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(previewSelected.name)},${previewSelected.lat},${previewSelected.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        카카오맵
                      </a>
                    </div>
                    <button
                      onClick={() => onSelectFacilityOnMap(previewSelected)}
                      className="w-full h-10 rounded-xl bg-[#0e8a8d] text-white text-sm font-bold hover:bg-[#0a7073] transition"
                    >
                      전체 지도에서 자세히 보기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filtered.slice(0, 30).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setPreviewSelected(f)}
                      className="p-4 hover:bg-[#f7f8fa] cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              GRADE_STYLE[f.grade] || GRADE_STYLE.NEW
                            }`}
                          >
                            {f.grade === 'NEW' ? '신설' : `${f.grade}등급`}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{f.typeName}</span>
                        </div>
                        <span className="text-xs font-bold text-[#0e8a8d]">
                          {f.score ? `${f.score}점` : f.ownership}
                        </span>
                      </div>
                      <div className="text-base font-bold text-[#191f28] truncate">{f.name}</div>
                      <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                        <span className="truncate pr-2">{f.addr}</span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {f.capacity ? `정원 ${f.capacity}명` : `인력 ${f.staffCare + f.staffNurse}명`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 메인 지역별 버튼 + 시원한 리스트 섹션 */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#191f28]">
              지역별 시설 리스트로 한눈에 보기
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              국공립(정부·지자체) 시설과 요양병원을 우선 배치해 등급·정원·인력을 리스트로 확인합니다.
            </p>
          </div>
          <button
            onClick={() => onGoToRegion(selectedRegion)}
            className="inline-flex items-center gap-1 text-[15px] font-bold text-teal-700 hover:text-teal-800 shrink-0"
          >
            지역 상세 필터 열기 ({regionFiltered.length.toLocaleString()}곳)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 지역별 선택 버튼 그리드 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {REGION_BUTTONS.map((sido) => {
            const active = selectedRegion === sido;
            return (
              <button
                key={sido}
                onClick={() => setSelectedRegion(sido)}
                className={`h-10 px-4 rounded-xl text-sm sm:text-[15px] font-bold border transition ${
                  active
                    ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {sido}
              </button>
            );
          })}
        </div>

        {/* 시원한 가로형 리스트 */}
        <div className="space-y-3">
          {regionFiltered.slice(0, 8).map((f) => {
            const isCompared = compareIds.includes(f.id);
            const gCls = GRADE_STYLE[f.grade] || GRADE_STYLE.NEW;
            return (
              <div
                key={f.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${gCls}`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {f.grade === 'NEW' ? '신설기관' : `공단 ${f.grade}등급`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                      {f.typeName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        f.ownership === '국공립'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {f.ownership === '국공립' ? '국공립(정부·지자체)' : f.ownership}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#191f28]">{f.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
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
                  {f.staffDetail && (
                    <div className="mt-1.5 text-xs text-slate-500 truncate">
                      인력: {f.staffDetail}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 lg:w-[420px] shrink-0">
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

                <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onSelectFacilityOnMap(f)}
                    className="flex-1 lg:w-24 h-9 px-3 rounded-xl bg-[#0e8a8d] text-white text-xs font-bold hover:bg-[#0a7073] transition"
                  >
                    지도 보기
                  </button>
                  <button
                    onClick={() => onToggleCompare(f)}
                    className={`flex-1 lg:w-24 h-9 px-3 rounded-xl text-xs font-bold border transition ${
                      isCompared
                        ? 'bg-[#eef8f8] text-[#0e8a8d] border-[#0e8a8d]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isCompared ? '담김 ✓' : '+ 비교함'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {regionFiltered.length > 8 && (
          <div className="mt-5 text-center">
            <button
              onClick={() => onGoToRegion(selectedRegion)}
              className="h-11 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15px] font-bold text-slate-800 transition"
            >
              {selectedRegion === '전체' ? '전국' : selectedRegion} 시설 {regionFiltered.length.toLocaleString()}곳 전체 리스트 보기
            </button>
          </div>
        )}

        {/* 하단 도구 2종 */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onChangeTab('calc')}
            className="bg-[#f7f8fa] hover:bg-slate-100 border border-slate-200 rounded-2xl p-6 text-left transition flex items-center justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 mb-1.5">
                <Calculator className="w-4 h-4" />
                예상 비용 계산기
              </div>
              <div className="text-lg font-bold text-[#191f28]">
                장기요양등급별 월 본인부담금 계산하기
              </div>
              <div className="mt-1 text-[15px] text-slate-600">
                1~5등급·감경 대상별 국가 지원금과 식대·병실료를 1분 만에 확인합니다.
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          <button
            onClick={() => onChangeTab('guide')}
            className="bg-[#f7f8fa] hover:bg-slate-100 border border-slate-200 rounded-2xl p-6 text-left transition flex items-center justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 mb-1.5">
                <BookOpen className="w-4 h-4" />
                보호자 필독 가이드
              </div>
              <div className="text-lg font-bold text-[#191f28]">
                요양원 vs 주간보호센터, 방문 전 체크리스트
              </div>
              <div className="mt-1 text-[15px] text-slate-600">
                인력 비율, 비급여 항목, 응급 연계 등 입소 전 꼭 확인할 기준을 정리했습니다.
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
}
