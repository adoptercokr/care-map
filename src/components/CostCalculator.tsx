'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';

// 노인장기요양보험 표준 급여 비용 기반 시뮬레이션 상수 (월 30일 기준 참고치)
const FACILITY_DAILY_FEE: Record<string, number> = {
  '1': 84240,
  '2': 78150,
  '3': 73010,
  '4': 73010,
  '5': 73010,
};

const DAYCARE_MONTHLY_LIMIT: Record<string, number> = {
  '1': 2069900,
  '2': 1869600,
  '3': 1455800,
  '4': 1341800,
  '5': 1151600,
  인지지원: 643900,
};

export default function CostCalculator() {
  const [serviceType, setServiceType] = useState<'nursing' | 'daycare'>('nursing');
  const [grade, setGrade] = useState<string>('3');
  const [copayRate, setCopayRate] = useState<number>(20); // 20: 일반, 12: 감경40%, 8: 감경60%, 0: 기초생활
  const [mealCost, setMealCost] = useState<number>(330000);
  const [roomExtra, setRoomExtra] = useState<number>(0);

  const result = useMemo(() => {
    if (serviceType === 'nursing') {
      const daily = FACILITY_DAILY_FEE[grade] || FACILITY_DAILY_FEE['3'];
      const totalBenefit = daily * 30;
      const copay = Math.round(totalBenefit * (copayRate / 100));
      const nonBenefit = copayRate === 0 ? 0 : mealCost + roomExtra;
      const totalOutOfPocket = copay + nonBenefit;
      return {
        totalBenefit,
        govSupport: totalBenefit - copay,
        copay,
        nonBenefit,
        totalOutOfPocket,
      };
    } else {
      const limit = DAYCARE_MONTHLY_LIMIT[grade] || DAYCARE_MONTHLY_LIMIT['3'];
      // 재가급여 일반 본인부담률 15% (감경 9% / 6% / 0%)
      const actualRate = copayRate === 20 ? 15 : copayRate === 12 ? 9 : copayRate === 8 ? 6 : 0;
      const copay = Math.round(limit * (actualRate / 100));
      const nonBenefit = copayRate === 0 ? 0 : 140000;
      return {
        totalBenefit: limit,
        govSupport: limit - copay,
        copay,
        nonBenefit,
        totalOutOfPocket: copay + nonBenefit,
      };
    }
  }, [serviceType, grade, copayRate, mealCost, roomExtra]);

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          1분 예상 비용 시뮬레이터
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          장기요양등급별 월 예상 본인부담금 계산기
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          어르신의 요양등급과 감경 여부를 선택하면 국가 지원금과 실제 월 부담금을 바로 계산합니다.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
        {/* 이용 형태 */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">이용 형태</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setServiceType('nursing');
                if (grade === '인지지원') setGrade('3');
              }}
              className={`h-10 rounded-xl text-sm font-semibold border transition ${
                serviceType === 'nursing'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              요양원 (시설입소)
            </button>
            <button
              onClick={() => setServiceType('daycare')}
              className={`h-10 rounded-xl text-sm font-semibold border transition ${
                serviceType === 'daycare'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              주간보호센터 (재가)
            </button>
          </div>
        </div>

        {/* 장기요양등급 */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">장기요양등급</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(serviceType === 'nursing'
              ? ['1', '2', '3', '4', '5']
              : ['1', '2', '3', '4', '5', '인지지원']
            ).map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`h-9 rounded-lg text-xs font-semibold border transition ${
                  grade === g
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {g === '인지지원' ? '인지지원' : `${g}등급`}
              </button>
            ))}
          </div>
        </div>

        {/* 본인부담률 */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">소득·감경 구분</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '일반 대상자', rate: 20, sub: serviceType === 'nursing' ? '20%' : '15%' },
              { label: '감경 40%', rate: 12, sub: serviceType === 'nursing' ? '12%' : '9%' },
              { label: '감경 60%', rate: 8, sub: serviceType === 'nursing' ? '8%' : '6%' },
              { label: '기초생활수급', rate: 0, sub: '0% (면제)' },
            ].map((opt) => (
              <button
                key={opt.rate}
                onClick={() => setCopayRate(opt.rate)}
                className={`py-2 px-3 rounded-xl text-left border transition ${
                  copayRate === opt.rate
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[11px] text-slate-500">부담률 {opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 비급여 옵션 (요양원만) */}
        {serviceType === 'nursing' && copayRate > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                월 식비·간식비 (비급여 평균)
              </label>
              <select
                value={mealCost}
                onChange={(e) => setMealCost(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value={280000}>280,000원 (알뜰형)</option>
                <option value={330000}>330,000원 (전국 평균)</option>
                <option value={390000}>390,000원 (프리미엄 식단)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                병실 선택 (상급침실료)
              </label>
              <select
                value={roomExtra}
                onChange={(e) => setRoomExtra(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value={0}>3~4인실 (추가비용 0원)</option>
                <option value={200000}>2인실 (+200,000원/월)</option>
                <option value={450000}>1인실 (+450,000원/월)</option>
              </select>
            </div>
          </div>
        )}

        {/* 계산 결과 카드 */}
        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-slate-900 text-white">
          <div className="text-xs text-slate-300">월 예상 실제 본인부담금 (급여 + 비급여 합계)</div>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-300">
            {result.totalOutOfPocket.toLocaleString()}원
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-400">총 급여비용</div>
              <div className="font-semibold mt-0.5">{result.totalBenefit.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-slate-400">국가 지원금</div>
              <div className="font-semibold mt-0.5 text-emerald-300">
                -{result.govSupport.toLocaleString()}원
              </div>
            </div>
            <div>
              <div className="text-slate-400">비급여(식대 등)</div>
              <div className="font-semibold mt-0.5">{result.nonBenefit.toLocaleString()}원</div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            본 계산기는 30일 이용 기준 표준 시뮬레이션이며, 실제 비용은 시설의 비급여 항목(이미용, 기저귀, 상급침실료) 및 가산 여부에 따라 달라질 수 있습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
