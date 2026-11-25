'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function Footer() {
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | 'contact' | null>(null);

  return (
    <>
      <footer className="bg-slate-50 border-t border-slate-200 text-slate-600">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#0e8a8d] text-white flex items-center justify-center text-xs font-extrabold">
                  C
                </span>
                <span className="text-base font-extrabold text-slate-900">케어맵 (CareMap)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                전국 요양병원·요양원·주간보호센터·방문요양 기관 정보를 지도와 지역별 목록으로 쉽게 비교할 수 있는 시니어 돌봄 정보 플랫폼입니다.
              </p>
              <p className="text-xs text-slate-400">
                데이터 출처: 국민건강보험공단 장기요양기관 정보 및 평가결과 · 건강보험심사평가원 병원정보서비스 (본 정보는 참고용이며, 실제 입소·진료 전 해당 기관에 직접 확인하시기 바랍니다.)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-700 shrink-0">
              <button onClick={() => setPolicyType('terms')} className="hover:text-[#0e8a8d]">
                이용약관
              </button>
              <button onClick={() => setPolicyType('privacy')} className="hover:text-[#0e8a8d]">
                개인정보처리방침
              </button>
              <button onClick={() => setPolicyType('contact')} className="hover:text-[#0e8a8d]">
                제휴·문의하기
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs text-slate-500">
            <div>© {new Date().getFullYear()} CareMap. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {policyType && (
        <div className="fixed inset-0 z-[700] bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {policyType === 'terms'
                  ? '이용약관 및 안내'
                  : policyType === 'privacy'
                  ? '개인정보처리방침'
                  : '제휴 및 정보 수정 문의'}
              </h3>
              <button
                onClick={() => setPolicyType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 text-sm text-slate-600 leading-relaxed space-y-3">
              {policyType === 'terms' && (
                <>
                  <p>케어맵은 국민건강보험공단과 건강보험심사평가원의 공개 데이터를 바탕으로 전국 요양시설 및 요양병원 정보를 제공합니다.</p>
                  <p>시설의 운영 현황, 비급여 비용, 입소 가능 여부는 시점에 따라 변동될 수 있으므로 최종 결정 전 해당 기관에 직접 확인해 주시기 바랍니다.</p>
                </>
              )}
              {policyType === 'privacy' && (
                <>
                  <p>케어맵은 별도의 회원가입 없이 이용할 수 있으며, 이용자의 개인정보를 서버에 수집·저장하지 않습니다.</p>
                  <p>내 위치 찾기 기능은 브라우저 내 지도 이동 용도로만 일시 사용되며 저장되지 않습니다.</p>
                </>
              )}
              {policyType === 'contact' && (
                <>
                  <p>기관 정보 수정 요청, 신규 시설 등록, 광고 및 제휴 문의는 아래 이메일로 연락해 주시면 확인 후 반영해 드립니다.</p>
                  <p className="font-bold text-[#0e8a8d]">이메일: contact@caremap.kr</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
