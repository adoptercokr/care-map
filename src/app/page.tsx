'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CareFacility, ActiveTab, FacilityType, EvalGrade } from '../types/care';
import { getGradeLabel, getCapacityLabel } from '../utils/gradeLabel';
import { FACILITY_ICON_META } from '../utils/facilityIcons';
import syncMeta from '../../public/data/sync_meta.json';
import HomeHub from '../components/HomeHub';
import RegionDirectory from '../components/RegionDirectory';
import FacilityDetailSheet from '../components/FacilityDetailSheet';
import CompareDrawer from '../components/CompareDrawer';
import CostCalculator from '../components/CostCalculator';
import CareGuide from '../components/CareGuide';
import Footer from '../components/Footer';
import type { MapBounds } from '../components/CareMap';
import {
  Home,
  Map as MapIcon,
  Calculator,
  BookOpen,
  Search,
  Scale,
  MapPin,
  ShieldCheck,
  List,
  X,
  Building2,
  Sun,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  ArrowLeft,
  Phone,
  Navigation,
  Plus,
  Check,
} from 'lucide-react';

const CareMap = dynamic(() => import('../components/CareMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-base font-semibold text-slate-500">
      지도를 불러오는 중...
    </div>
  ),
});

const SIDO_LIST = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const GRADE_PILL: Record<string, string> = {
  A: 'bg-teal-50 text-teal-800 border-teal-200',
  B: 'bg-blue-50 text-blue-800 border-blue-200',
  C: 'bg-slate-100 text-slate-700 border-slate-200',
  D: 'bg-amber-50 text-amber-800 border-amber-200',
  E: 'bg-rose-50 text-rose-800 border-rose-200',
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TYPE_ICON_BADGE: Record<string, { bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  hospital: { bg: 'bg-[#e11d48]', icon: Stethoscope },
  nursing: { bg: 'bg-[#0e8a8d]', icon: Home },
  daycare: { bg: 'bg-[#0284c7]', icon: Sun },
  homecare: { bg: 'bg-[#0d9488]', icon: UserCheck },
  silvertown: { bg: 'bg-[#6366f1]', icon: Building2 },
  hospcare: { bg: 'bg-[#d97706]', icon: HeartHandshake },
};

export default function HomePage() {
  const [facilities, setFacilities] = useState<CareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [searchedPlaceLabel, setSearchedPlaceLabel] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | FacilityType>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | EvalGrade>('all');
  const [sidoFilter, setSidoFilter] = useState('전체');

  // 선택 및 비교함 상태
  const [selectedFacility, setSelectedFacility] = useState<CareFacility | null>(null);
  const [compareList, setCompareList] = useState<CareFacility[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  const [targetCenter, setTargetCenter] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    seq: number;
  } | null>(null);

  useEffect(() => {
    fetch('/data/facilities.json?v=20261128b')
      .then((res) => res.json())
      .then((data: CareFacility[]) => {
        setFacilities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredFacilities = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    return facilities.filter((f) => {
      if (typeFilter === 'public' && f.ownership !== '국공립') return false;
      if (typeFilter !== 'all' && typeFilter !== 'public' && f.type !== typeFilter) return false;
      if (gradeFilter !== 'all' && f.grade !== gradeFilter) return false;
      if (sidoFilter !== '전체' && !f.sido.startsWith(sidoFilter)) return false;
      if (
        q &&
        !f.name.toLowerCase().includes(q) &&
        !f.addr.toLowerCase().includes(q) &&
        !f.sigungu.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [facilities, typeFilter, gradeFilter, sidoFilter, appliedQuery]);

  // 지도 영역(Bounds) 내 시설만 좌측 리스트에 동기화 (애니맵 방식)
  const visibleMapFacilities = useMemo(() => {
    if (!mapBounds) return filteredFacilities;
    return filteredFacilities.filter(
      (f) =>
        f.lat <= mapBounds.north &&
        f.lat >= mapBounds.south &&
        f.lng <= mapBounds.east &&
        f.lng >= mapBounds.west
    );
  }, [filteredFacilities, mapBounds]);

  // 스마트 검색: 시설명/주소 매칭이 없으면 지역·역 지오코딩으로 지도 이동 후 주변 시설 표시
  const executeMapSearch = useCallback(
    async (rawQuery: string) => {
      const q = rawQuery.trim();
      setSearchQuery(q);
      setSelectedFacility(null);

      if (!q) {
        setAppliedQuery('');
        setSearchedPlaceLabel('');
        return;
      }

      const lower = q.toLowerCase();
      // 1. 먼저 지역/역/구명 지오코딩 확인 (예: '강남', '강남역', '분당' 검색 시 해당 지역으로 정확히 이동)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.found && data.lat && data.lng) {
          setAppliedQuery('');
          setSidoFilter('전체');
          setSearchedPlaceLabel(data.name || q);
          setTargetCenter({ lat: data.lat, lng: data.lng, zoom: 13, seq: Date.now() });
          return;
        }
      } catch {
        // fallback to facility matching
      }

      const directMatches = facilities.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.addr.toLowerCase().includes(lower) ||
          f.sigungu.toLowerCase().includes(lower)
      );

      if (directMatches.length > 0) {
        setAppliedQuery(q);
        setSearchedPlaceLabel('');
        setFitBoundsTrigger((n) => n + 1);
        return;
      }

      setAppliedQuery(q);
      setSearchedPlaceLabel('');
    },
    [facilities]
  );

  const handleGoToMap = useCallback(
    (nextType?: 'all' | 'public' | FacilityType, query?: string) => {
      if (nextType) setTypeFilter(nextType);
      setSelectedFacility(null);
      setActiveTab('map');
      if (query !== undefined) {
        void executeMapSearch(query);
      } else {
        setFitBoundsTrigger((n) => n + 1);
      }
    },
    [executeMapSearch]
  );

  const handleSelectFacilityFromHome = useCallback((facility: CareFacility) => {
    setTypeFilter('all');
    setSidoFilter('전체');
    setGradeFilter('all');
    setSearchQuery('');
    setAppliedQuery('');
    setSearchedPlaceLabel('');
    setMobileListOpen(false);
    setSelectedFacility(facility);
    setActiveTab('map');
  }, []);

  const handleToggleCompare = useCallback((facility: CareFacility) => {
    setCompareList((prev) => {
      const exists = prev.some((item) => item.id === facility.id);
      if (exists) return prev.filter((item) => item.id !== facility.id);
      if (prev.length >= 3) {
        alert('비교함에는 최대 3개 시설까지 담을 수 있습니다.');
        return prev;
      }
      return [...prev, facility];
    });
  }, []);

  const handleRequestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        alert('위치 권한을 허용하시면 주변 시설을 바로 확인할 수 있습니다.');
      }
    );
  }, []);

  return (
    <div
      className={`${
        activeTab === 'map' ? 'h-dvh overflow-hidden' : 'min-h-screen'
      } flex flex-col bg-slate-50`}
    >
      {/* 상단 헤더: 데스크톱 1줄 칼정렬(모든 탭 동일한 중앙 정렬) / 모바일은 로고+비교함 1줄 + 4등분 균등 탭 2줄 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[450] shrink-0">
        <div className="h-14 md:h-16 max-w-6xl mx-auto px-4 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-10">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-left shrink-0 whitespace-nowrap"
            >
              <span className="w-8 h-8 rounded-lg bg-[#0e8a8d] text-white flex items-center justify-center text-sm font-extrabold shrink-0">
                C
              </span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                케어맵
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-7">
              {[
                { id: 'map', label: '지도로 보기' },
                { id: 'region', label: '지역별 찾기' },
                { id: 'calc', label: '비용 계산기' },
                { id: 'guide', label: '돌봄 가이드' },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`h-16 border-b-2 text-base font-semibold whitespace-nowrap shrink-0 transition ${
                      isActive
                        ? 'border-[#0e8a8d] text-[#0e8a8d]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={() => setIsCompareOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Scale className="w-4 h-4 text-[#0e8a8d]" />
            <span>비교함</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#0e8a8d] text-white text-xs font-bold">
              {compareList.length}
            </span>
          </button>
        </div>

        {/* 모바일 전용 4등분 균등 탭바 (좌우 스크롤 없음) */}
        <nav className="md:hidden grid grid-cols-4 border-t border-slate-100 bg-white">
          {[
            { id: 'map', label: '지도 보기' },
            { id: 'region', label: '지역별' },
            { id: 'calc', label: '비용계산' },
            { id: 'guide', label: '가이드' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`h-11 text-[15px] font-bold whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'border-[#0e8a8d] text-[#0e8a8d] bg-[#eef8f8]/40'
                    : 'border-transparent text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* 1. 홈 (기본 화면) */}
      {activeTab === 'home' && (
        <main className="flex-1">
          <HomeHub
            facilities={facilities}
            compareIds={compareList.map((i) => i.id)}
            onToggleCompare={handleToggleCompare}
            onGoToMap={handleGoToMap}
            onGoToRegion={() => setActiveTab('region')}
            onSelectFacilityOnMap={handleSelectFacilityFromHome}
            onChangeTab={setActiveTab}
          />
          <Footer />
        </main>
      )}

      {/* 2. 지도로 보기 (상단 1줄 전체폭 카테고리 바 + 애니맵 스타일 좌측 장소 카드 사이드바 + 우측 지도) */}
      {activeTab === 'map' && (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* 지도 전용 최상단 1줄 카테고리 & 필터 바 */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'all', label: '전체' },
                { id: 'public', label: '국공립(정부·지자체)' },
                { id: 'hospital', label: '요양병원' },
                { id: 'nursing', label: '요양원' },
                { id: 'daycare', label: '주간보호센터' },
                { id: 'homecare', label: '방문요양(센터)' },
                { id: 'silvertown', label: '실버타운·양로원' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id as 'all' | 'public' | FacilityType)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
                    typeFilter === t.id
                      ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <select
                value={sidoFilter}
                onChange={(e) => {
                  setSidoFilter(e.target.value);
                  setFitBoundsTrigger((n) => n + 1);
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white"
              >
                {SIDO_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s === '전체' ? '전국 시도' : s}
                  </option>
                ))}
              </select>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as 'all' | EvalGrade)}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white"
              >
                <option value="all">모든 평가등급</option>
                <option value="A">A등급 (최우수)</option>
                <option value="B">B등급 (우수)</option>
                <option value="C">C등급 (양호)</option>
                <option value="NEW">신설·평가대기</option>
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
            {/* 데스크톱·태블릿(md 이상) 고정 사이드바 / 모바일 드로어 */}
            <aside
              className={`${
                mobileListOpen ? 'fixed inset-x-0 top-[116px] bottom-0 z-[440] flex' : 'hidden md:flex'
              } w-full md:w-[340px] lg:w-[400px] h-full min-h-0 bg-white border-r border-slate-200 flex-col shrink-0`}
            >
              {/* 사이드바 검색 + 결과 수 */}
              <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void executeMapSearch(searchQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="지역·역명(강남역, 분당) 또는 시설명"
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-300 text-[15px] text-slate-900 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-10 px-3.5 rounded-xl bg-[#0e8a8d] hover:bg-[#0a7073] text-white text-sm font-semibold shrink-0 transition"
                  >
                    이동
                  </button>
                  {mobileListOpen && (
                    <button
                      type="button"
                      onClick={() => setMobileListOpen(false)}
                      className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </form>

                <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                  <span>
                    {searchedPlaceLabel ? (
                      <>
                        <strong className="text-[#0e8a8d]">{searchedPlaceLabel}</strong> 주변{' '}
                        <strong className="text-[#0e8a8d]">{visibleMapFacilities.length.toLocaleString()}곳</strong>
                      </>
                    ) : (
                      <>
                        현재 지도 내 <strong className="text-[#0e8a8d]">{visibleMapFacilities.length.toLocaleString()}곳</strong> (전체 {filteredFacilities.length.toLocaleString()}곳)
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => setGradeFilter(gradeFilter === 'A' ? 'all' : 'A')}
                    className={`font-semibold ${gradeFilter === 'A' ? 'text-[#0e8a8d]' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {gradeFilter === 'A' ? '✓ A등급만 보는 중' : 'A등급만 모아보기'}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 px-0.5">
                  {syncMeta.displayDate} 업데이트
                </div>
              </div>

              {/* 애니맵 스타일: 장소 선택 시 좌측 사이드바가 상세 뷰로 전환 (데스크톱·태블릿) */}
              {selectedFacility ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  <button
                    onClick={() => setSelectedFacility(null)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    목록으로 돌아가기
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-extrabold ${
                          selectedFacility.type === 'hospital'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : selectedFacility.type === 'nursing'
                            ? 'bg-[#eef8f8] text-[#0e8a8d] border border-[#cbe8e8]'
                            : selectedFacility.type === 'daycare'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {selectedFacility.typeName}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          selectedFacility.ownership === '국공립'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {selectedFacility.ownership === '국공립' ? '국공립(정부·지자체)' : selectedFacility.ownership}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          GRADE_PILL[selectedFacility.grade] || GRADE_PILL.NEW
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {getGradeLabel(selectedFacility)}
                        {selectedFacility.score ? ` (${selectedFacility.score}점)` : ''}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                      {selectedFacility.name}
                    </h2>
                  </div>

                  <div className="space-y-2 text-[15px] text-slate-700 pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      <span>{selectedFacility.addr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0e8a8d] shrink-0" />
                      {selectedFacility.tel ? (
                        <a
                          href={`tel:${selectedFacility.tel.replace(/[^0-9+]/g, '')}`}
                          className="font-bold text-[#0e8a8d] hover:underline"
                        >
                          {selectedFacility.tel}
                        </a>
                      ) : (
                        <span>전화번호 정보 없음</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">
                        {selectedFacility.type === 'hospital' ? '허가 병상' : '입소 정원'}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {getCapacityLabel(selectedFacility)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">평가 점수</div>
                      <div className="mt-1 text-base font-bold text-[#0e8a8d]">
                        {selectedFacility.score ? `${selectedFacility.score}점` : selectedFacility.grade === 'NEW' ? '예정' : `${selectedFacility.grade}등급`}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">
                        {selectedFacility.type === 'hospital' ? '의사 인력' : '돌봄 인력'}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {selectedFacility.staffCare + selectedFacility.staffNurse}명
                      </div>
                    </div>
                  </div>

                  {selectedFacility.staffDetail && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">인력 세부 구성: </span>
                      {selectedFacility.staffDetail}
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-[#eef8f8] border border-[#cbe8e8] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">설립 / 지정일</span>
                      <span className="text-base font-extrabold text-[#0e8a8d]">
                        {selectedFacility.established
                          ? selectedFacility.established.replace(/-/g, '/')
                          : '미제공'}
                      </span>
                    </div>
                  </div>

                  {selectedFacility.type === 'homecare' && (
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 leading-relaxed">
                      <span className="font-bold block mb-0.5">요양보호사 파견 · 재가 돌봄 연계 센터</span>
                      어르신 댁으로 방문요양보호사를 배정·연계하는 재가장기요양기관입니다. 위 전화번호로 파견 가능 여부와 일정을 바로 문의하실 수 있습니다.
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://map.naver.com/p/directions/-/${selectedFacility.lng},${selectedFacility.lat},${encodeURIComponent(
                          selectedFacility.name
                        )}/-/car`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl text-sm font-bold bg-[#03C75A] hover:bg-[#02b350] text-white flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Navigation className="w-4 h-4" />
                        네이버 길찾기
                      </a>
                      <a
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(
                          selectedFacility.name
                        )},${selectedFacility.lat},${selectedFacility.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl text-sm font-bold bg-[#FEE500] hover:bg-[#f5dc00] text-[#3C1E1E] flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Navigation className="w-4 h-4" />
                        카카오 길찾기
                      </a>
                    </div>
                    <button
                      onClick={() => handleToggleCompare(selectedFacility)}
                      className={`w-full h-10 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5 transition ${
                        compareList.some((i) => i.id === selectedFacility.id)
                          ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {compareList.some((i) => i.id === selectedFacility.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {compareList.some((i) => i.id === selectedFacility.id)
                        ? '비교함에 담김'
                        : '비교함에 담기'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-10 text-center text-base text-slate-500">
                      시설 정보를 불러오는 중...
                    </div>
                  ) : visibleMapFacilities.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500 space-y-2">
                      <p>현재 지도 영역에 표시할 시설이 없습니다.</p>
                      <button
                        onClick={() => {
                          setAppliedQuery('');
                          setSearchQuery('');
                          setSearchedPlaceLabel('');
                          setFitBoundsTrigger((n) => n + 1);
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-[#0e8a8d] text-[#0e8a8d] font-semibold text-xs hover:bg-[#eef8f8]"
                      >
                        전체 시설 보기로 이동
                      </button>
                    </div>
                  ) : (
                    visibleMapFacilities.slice(0, 80).map((f) => {
                      const gCls = GRADE_PILL[f.grade] || GRADE_PILL.NEW;
                      const iconMeta = FACILITY_ICON_META[f.type] || FACILITY_ICON_META.nursing;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFacility(f);
                            setMobileListOpen(false);
                          }}
                          className="p-4 cursor-pointer transition hover:bg-slate-50 flex gap-3.5"
                        >
                          <div
                            className="w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: iconMeta.color }}
                            dangerouslySetInnerHTML={{ __html: iconMeta.svg }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[13px] font-extrabold ${
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
                              <span className="text-xs font-bold text-slate-600">
                                {f.ownership === '국공립' ? '국공립' : f.ownership}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${gCls}`}>
                                {getGradeLabel(f, true)}
                                {f.score ? ` (${f.score}점)` : ''}
                              </span>
                            </div>

                            <div className="font-bold text-base text-slate-900 truncate">{f.name}</div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-slate-600 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{f.addr}</span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className="text-slate-500">
                                {getCapacityLabel(f, true)} · {f.ownership}
                              </span>
                              <span className="font-bold text-[#0e8a8d]">
                                인력 {f.staffCare + f.staffNurse}명
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </aside>

            {/* 모바일(md 미만) 상단 플로팅 검색 + 목록 버튼 */}
            <div className="md:hidden absolute top-3 inset-x-3 z-[410] flex items-center gap-2">
              <button
                onClick={() => setMobileListOpen(true)}
                className="h-10 px-3.5 rounded-full bg-white border border-slate-200 shadow-md text-sm font-bold text-slate-800 flex items-center gap-1.5 shrink-0"
              >
                <List className="w-4 h-4 text-[#0e8a8d]" />
                목록 ({visibleMapFacilities.length.toLocaleString()})
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void executeMapSearch(searchQuery);
                }}
                className="flex-1 flex items-center bg-white border border-slate-200 rounded-full shadow-md px-3 h-10"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="강남역, 분당 등 검색"
                  className="flex-1 text-sm bg-transparent focus:outline-none text-slate-900"
                />
                <button type="submit" className="text-xs font-bold text-[#0e8a8d] pl-2">
                  이동
                </button>
              </form>
            </div>

            {/* 우측 지도 영역 */}
            <section className="flex-1 relative w-full h-full min-h-0">
              <CareMap
                facilities={filteredFacilities}
                selectedFacility={selectedFacility}
                onSelectFacility={setSelectedFacility}
                userLocation={userLocation}
                onRequestUserLocation={handleRequestUserLocation}
                onBoundsChange={setMapBounds}
                onSearchHere={() => {
                  setAppliedQuery('');
                  setSearchedPlaceLabel('');
                  setSidoFilter('전체');
                }}
                fitBoundsTrigger={fitBoundsTrigger}
                targetCenter={targetCenter}
              />
            </section>

            {/* 모바일에서만 하단 상세 시트 표시 (데스크톱/태블릿은 좌측 사이드바에서 상세 보기) */}
            <div className="md:hidden">
              <FacilityDetailSheet
                facility={selectedFacility}
                onClose={() => setSelectedFacility(null)}
                isCompared={
                  selectedFacility ? compareList.some((i) => i.id === selectedFacility.id) : false
                }
                onToggleCompare={handleToggleCompare}
              />
            </div>
          </div>
        </main>
      )}

      {/* 3. 지역별 상세 검색 */}
      {activeTab === 'region' && (
        <main className="flex-1 overflow-y-auto">
          <RegionDirectory
            facilities={facilities}
            compareIds={compareList.map((i) => i.id)}
            onToggleCompare={handleToggleCompare}
            onSelectOnMap={handleSelectFacilityFromHome}
          />
          <Footer />
        </main>
      )}

      {/* 4. 비용 계산기 */}
      {activeTab === 'calc' && (
        <main className="flex-1 overflow-y-auto">
          <CostCalculator />
          <Footer />
        </main>
      )}

      {/* 5. 돌봄 가이드 */}
      {activeTab === 'guide' && (
        <main className="flex-1 overflow-y-auto">
          <CareGuide />
          <Footer />
        </main>
      )}

      <CompareDrawer
        items={compareList}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemove={(id) => setCompareList((prev) => prev.filter((item) => item.id !== id))}
      />
    </div>
  );
}
