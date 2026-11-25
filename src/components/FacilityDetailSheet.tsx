'use client';

import React from 'react';
import { CareFacility } from '../types/care';
import { X, MapPin, Phone, Users, ShieldCheck, Navigation, Plus, Check } from 'lucide-react';

interface FacilityDetailSheetProps {
  facility: CareFacility | null;
  onClose: () => void;
  isCompared: boolean;
  onToggleCompare: (facility: CareFacility) => void;
}

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  A: { label: 'A등급 · 최우수', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  B: { label: 'B등급 · 우수', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  C: { label: 'C등급 · 양호', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  D: { label: 'D등급 · 보통', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  E: { label: 'E등급 · 미흡', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  NEW: { label: '신설·평가대기', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function FacilityDetailSheet({
  facility,
  onClose,
  isCompared,
  onToggleCompare,
}: FacilityDetailSheetProps) {
  if (!facility) return null;

  const badge = GRADE_BADGE[facility.grade] || GRADE_BADGE.NEW;
  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${facility.lat},${facility.lng}`;
  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(facility.name + ' ' + facility.sigungu)}`;
  const telHref = facility.tel ? `tel:${facility.tel.replace(/[^0-9+]/g, '')}` : undefined;

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[400px] z-[500] bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${badge.cls}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {badge.label}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                {facility.typeName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  facility.ownership === '국공립'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {facility.ownership === '국공립' ? '국공립(정부·지자체)' : facility.ownership}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{facility.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 주소 및 전화 */}
        <div className="mt-3.5 space-y-2 text-[15px] text-slate-700">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            <span>{facility.addr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-teal-700 shrink-0" />
            {telHref ? (
              <a
                href={telHref}
                className="font-semibold text-teal-700 hover:underline"
                title="클릭하여 전화 걸기"
              >
                {facility.tel}
              </a>
            ) : (
              <span>전화번호 정보 없음</span>
            )}
          </div>
        </div>

        {/* 핵심 지표 그리드 (실제 수집 데이터만 표기) */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">
              {facility.type === 'hospital' ? '허가 병상' : '입소 정원'}
            </div>
            <div className="mt-1 text-base font-bold text-slate-900">
              {facility.type === 'hospital'
                ? facility.capacity ? `${facility.capacity}병상` : '미제공'
                : facility.capacity ? `${facility.capacity}명` : '재가/방문'}
            </div>
            <div className="text-xs text-slate-500">공단·심평원 기준</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">평가 점수</div>
            <div className="mt-1 text-base font-bold text-[#0e8a8d]">
              {facility.score ? `${facility.score}점` : facility.grade === 'NEW' ? '평가 예정' : `${facility.grade}등급`}
            </div>
            <div className="text-xs text-slate-500">{facility.evalYear ? `${facility.evalYear}년 기준` : '심평원 등록'}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">
              {facility.type === 'hospital' ? '의사 인력' : '돌봄 인력'}
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-500" />
              {facility.staffCare + facility.staffNurse}명
            </div>
            <div className="text-xs text-slate-500">
              {facility.type === 'hospital' ? `의사 ${facility.staffNurse}명` : `요양 ${facility.staffCare} · 간호 ${facility.staffNurse}`}
            </div>
          </div>
        </div>

        {facility.staffDetail && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">인력 세부 구성: </span>
            {facility.staffDetail}
          </div>
        )}

        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">설립 / 지정일</span>
            <span className="text-base font-extrabold text-slate-900">
              {facility.established || '미제공'}
            </span>
          </div>
        </div>

        {/* 하단 액션: 비교함 + 네이버 지도 + 카카오맵 (심플 상용 스타일) */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#03C75A]" />
              네이버 지도
            </a>
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              카카오맵
            </a>
          </div>
          <button
            onClick={() => onToggleCompare(facility)}
            className={`w-full h-10 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5 transition ${
              isCompared
                ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                : 'bg-[#eef8f8] text-[#0e8a8d] border-[#cbe8e8] hover:bg-[#dff2f2]'
            }`}
          >
            {isCompared ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isCompared ? '비교함에 담김' : '비교함에 담기'}
          </button>
        </div>
      </div>
    </div>
  );
}
