'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CareFacility, ActiveTab, FacilityType, EvalGrade } from '../types/care';
import HomeHub from '../components/HomeHub';
import RegionDirectory from '../components/RegionDirectory';
import FacilityDetailSheet from '../components/FacilityDetailSheet';
import CompareDrawer from '../components/CompareDrawer';
import CostCalculator from '../components/CostCalculator';
import CareGuide from '../components/CareGuide';
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
  '강원', '충남', '전북', '경남', '제주',
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
  nursing: { bg: 'bg-[#0e8a8d]', icon: Building2 },
  daycare: { bg: 'bg-[#0284c7]', icon: Sun },
  hospital: { bg: 'bg-[#0f766e]', icon: Stethoscope },
  silvertown: { bg: 'bg-slate-600', icon: Home },
  hospcare: { bg: 'bg-[#0d9488]', icon: HeartHandshake },
  homecare: { bg: 'bg-[#0369a1]', icon: UserCheck },
};

export default function HomePage() {
  const [facilities, setFacilities] = useState<CareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [searchedPlaceLabel, setSearchedPlaceLabel] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FacilityType>('all');
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
    fetch('/data/facilities.json')
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
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
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
        // fallback below
      }

      setAppliedQuery(q);
      setSearchedPlaceLabel('');
    },
    [facilities]
  );

  const handleGoToMap = useCallback(
    (nextType?: 'all' | FacilityType, query?: string) => {
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
    setSearchQuery('');
    setAppliedQuery('');
    setSearchedPlaceLabel('');
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
      {/* 상단 헤더 (본문 max-w-6xl 라인과 정확히 정렬) */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-[450] shrink-0">
        <div
          className={`h-full flex items-center justify-between ${
            activeTab === 'map' ? 'px-4 sm:px-6' : 'max-w-6xl mx-auto px-5'
          }`}
        >
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

            <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
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
                    className={`h-16 border-b-2 text-[15px] sm:text-base font-semibold whitespace-nowrap shrink-0 transition ${
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
            <span className="hidden sm:inline">비교함</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#0e8a8d] text-white text-xs font-bold">
              {compareList.length}
            </span>
          </button>
        </div>
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
        </main>
      )}

      {/* 2. 지도로 보기 (상단 1줄 전체폭 카테고리 바 + 애니맵 스타일 좌측 장소 카드 사이드바 + 우측 지도) */}
      {activeTab === 'map' && (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* 지도 전용 최상단 1줄 카테고리 & 필터 바 */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'all', label: '전체' },
                { id: 'nursing', label: '요양원' },
                { id: 'daycare', label: '주간보호센터' },
                { id: 'hospital', label: '요양병원' },
                { id: 'silvertown', label: '실버타운' },
                { id: 'hospcare', label: '병원간병' },
                { id: 'homecare', label: '집간병·방문요양' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id as 'all' | FacilityType)}
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
                        <strong className="text-[#0e8a8d]">{visibleMapFacilities.length}곳</strong>
                      </>
                    ) : (
                      <>
                        현재 지도 내 <strong className="text-[#0e8a8d]">{visibleMapFacilities.length}곳</strong> (전체 {filteredFacilities.length}곳)
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          GRADE_PILL[selectedFacility.grade] || GRADE_PILL.NEW
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {selectedFacility.grade === 'NEW'
                          ? '신설·평가대기'
                          : `공단 ${selectedFacility.grade}등급`}
                        {selectedFacility.score ? ` (${selectedFacility.score}점)` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {selectedFacility.typeName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {selectedFacility.ownership}
                      </span>
                      {selectedFacility.room1Cost > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#eef8f8] text-[#0e8a8d] border border-[#cbe8e8]">
                          1인실
                        </span>
                      )}
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
                      <div className="text-xs text-slate-500">정원 / 현원</div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {selectedFacility.capacity} / {selectedFacility.current}명
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">입소 대기</div>
                      <div
                        className={`mt-1 text-base font-bold ${
                          selectedFacility.waiting === 0 ? 'text-[#0e8a8d]' : 'text-amber-700'
                        }`}
                      >
                        {selectedFacility.waiting === 0 ? '대기 없음' : `${selectedFacility.waiting}명`}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500">돌봄 인력</div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {selectedFacility.staffCare + selectedFacility.staffNurse}명
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#eef8f8] border border-[#cbe8e8] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">월 예상 본인부담금</span>
                      <span className="text-lg font-extrabold text-[#0e8a8d]">
                        약 {selectedFacility.monthlyBaseEstimate.toLocaleString()}원
                      </span>
                    </div>
                    {selectedFacility.type === 'nursing' && (
                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-[#cbe8e8]">
                        <span>식비 {selectedFacility.mealCost.toLocaleString()}원</span>
                        {selectedFacility.room2Cost > 0 && (
                          <span>2인실 +{selectedFacility.room2Cost.toLocaleString()}원</span>
                        )}
                        {selectedFacility.room1Cost > 0 && (
                          <span>1인실 +{selectedFacility.room1Cost.toLocaleString()}원</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://map.naver.com/p/search/${encodeURIComponent(
                          selectedFacility.name + ' ' + selectedFacility.sigungu
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#03C75A]" />
                        네이버 지도
                      </a>
                      <a
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(
                          selectedFacility.name
                        )},${selectedFacility.lat},${selectedFacility.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        카카오맵
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
                      const iconMeta = TYPE_ICON_BADGE[f.type] || TYPE_ICON_BADGE.nursing;
                      const TypeIcon = iconMeta.icon;
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
                            className={`w-12 h-12 rounded-xl ${iconMeta.bg} text-white flex items-center justify-center shrink-0`}
                          >
                            <TypeIcon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${gCls}`}>
                                  {f.grade === 'NEW' ? '신설' : `${f.grade}등급`}
                                </span>
                                <span className="text-xs font-medium text-slate-500">{f.typeName}</span>
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  f.waiting === 0 ? 'text-[#0e8a8d]' : 'text-amber-700'
                                }`}
                              >
                                {f.waiting === 0 ? '즉시입소' : `대기 ${f.waiting}명`}
                              </span>
                            </div>

                            <div className="font-bold text-base text-slate-900 truncate">{f.name}</div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-slate-600 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{f.addr}</span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className="text-slate-500">
                                정원 {f.capacity}명 · {f.ownership}
                              </span>
                              <span className="font-extrabold text-slate-900">
                                월 {f.monthlyBaseEstimate.toLocaleString()}원~
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
                목록 ({visibleMapFacilities.length})
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
        </main>
      )}

      {/* 4. 비용 계산기 */}
      {activeTab === 'calc' && (
        <main className="flex-1 overflow-y-auto">
          <CostCalculator />
        </main>
      )}

      {/* 4. 돌봄 가이드 */}
      {activeTab === 'guide' && (
        <main className="flex-1 overflow-y-auto">
          <CareGuide />
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
