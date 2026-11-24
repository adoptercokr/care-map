'use client';

import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function CareGuide() {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-800 leading-relaxed">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          보호자 필독 가이드
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          부모님 요양원·주간보호센터, 실패 없이 고르는 핵심 기준 4가지
        </h2>
      </div>

      {/* 1분 3줄 요약 박스 */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1.5">
        <div className="text-xs font-bold text-teal-900">1분 핵심 요약</div>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>1. 공단 평가등급은 최소 <strong>A~B등급</strong>을 우선 살피되, 최근 신설 기관은 인력 비율을 직접 확인하세요.</li>
          <li>2. 월 비용은 급여 본인부담금(20%)보다 <strong>식비·상급침실료 등 비급여 항목</strong>에서 차이가 큽니다.</li>
          <li>3. 3~5등급이면서 거동이 가능하시면 요양원보다 <strong>주간보호센터(재가)</strong>가 비용과 정서 면에서 유리합니다.</li>
        </ul>
      </div>

      {/* 요양원 vs 주간보호 비교표 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-base font-bold text-slate-900 mb-3">요양원 vs 주간보호센터 한눈에 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-3">구분</th>
                <th className="py-2 px-3">요양원 (노인요양시설)</th>
                <th className="py-2 pl-3">주간보호센터 (데이케어)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-slate-900">이용 방식</td>
                <td className="py-2.5 px-3">24시간 상주 입소 돌봄</td>
                <td className="py-2.5 pl-3">아침 등원 ~ 저녁 하원 (유치원형)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-slate-900">권장 등급</td>
                <td className="py-2.5 px-3">1~2등급 (3~5등급도 조건부 가능)</td>
                <td className="py-2.5 pl-3">3~5등급 및 인지지원등급</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-slate-900">일반 본인부담률</td>
                <td className="py-2.5 px-3">급여의 20% + 식대·간식비</td>
                <td className="py-2.5 pl-3">급여의 15% + 식대</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-slate-900">월 예상 실부담</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">약 75~110만 원</td>
                <td className="py-2.5 pl-3 font-semibold text-slate-900">약 25~40만 원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 입소 전 방문 체크리스트 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-base font-bold text-slate-900">방문 상담 시 반드시 확인할 체크리스트</h3>
        <div className="space-y-2 text-sm text-slate-700">
          {[
            '복도와 침실에 불쾌한 냄새가 나지 않고 환기가 잘 되는지 확인하세요.',
            '어르신 수 대비 요양보호사와 간호(조무)사 인력이 충분한지 물어보세요.',
            '월 고정 비용 외에 기저귀, 물리치료, 이미용비 등 추가 비급여를 문서로 받아보세요.',
            '응급 상황 발생 시 연계된 협약 병원과 이송 절차를 확인하세요.',
            '면회 시간 제한과 외출·외박 규정이 가족 일정과 맞는지 점검하세요.',
          ].map((text, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
