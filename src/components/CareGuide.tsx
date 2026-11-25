'use client';

import React from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Building2, Award } from 'lucide-react';

export default function CareGuide() {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-7 sm:py-10 space-y-8 text-slate-800 text-[16px] sm:text-[17px] leading-[1.8]">
      {/* 헤더 및 인트로 */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-50 text-teal-800 text-sm font-bold">
          <BookOpen className="w-4 h-4" />
          보호자 실전 가이드
        </div>
        <h2 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 leading-snug tracking-tight">
          부모님 요양원·요양병원, 실패 없이 고르는 현실 기준
        </h2>
        <p className="text-slate-600 text-[16px] sm:text-[17px] leading-[1.8]">
          막상 부모님을 모실 곳을 찾으려 하면 용어부터 막막합니다.
          국공립이 무조건 좋은지, 등급표의 A등급과 1등급은 무슨 차이인지,
          상담 가기 전에 꼭 알아야 할 핵심만 솔직하게 정리했습니다.
        </p>
      </div>

      {/* 1분 3줄 요약 박스 */}
      <div className="p-5 sm:p-6 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2.5">
        <div className="text-sm font-extrabold text-teal-900">1분 핵심 요약</div>
        <ul className="text-[15px] sm:text-[16px] text-slate-800 space-y-2 leading-[1.75]">
          <li>
            <strong>1. 국공립이 무조건 정답은 아닙니다.</strong> 비용 투명성은 높지만 대기가 1년 넘게 걸리는 곳이 많아, 급할 땐 집 가까운 A~B등급 민간 기관이 훨씬 현실적입니다.
          </li>
          <li>
            <strong>2. 등급은 &lsquo;기관 등급&rsquo;과 &lsquo;부모님 등급&rsquo;이 따로입니다.</strong> 요양원은 <strong>A~E</strong>, 요양병원은 <strong>1~5등급</strong>(낮을수록 우수)으로 평가합니다.
          </li>
          <li>
            <strong>3. 월 비용 차이는 &lsquo;비급여&rsquo;에서 납니다.</strong> 법정 본인부담금(15~20%)은 전국이 같고, 식비·간식비·상급침실료가 실제 부담을 가릅니다.
          </li>
        </ul>
      </div>

      {/* 섹션 1: 국공립 vs 민간 솔직 비교 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0e8a8d] shrink-0" />
          <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">
            국공립(공립) 시설, 좋지만 무조건 답은 아닌 이유
          </h3>
        </div>

        <p className="text-slate-700">
          보호자분들이 가장 먼저 찾는 곳이 국공립입니다. 지자체가 설립하고 공공기관이나 검증된 법인이 위탁 운영하기 때문에 폐업 걱정이 없고, 회계가 투명하며, 법정 인력 기준을 깐깐하게 지킨다는 분명한 장점이 있습니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2">
            <div className="text-[15px] font-bold text-teal-900">국공립의 분명한 장점</div>
            <ul className="text-[15px] text-slate-700 space-y-1.5 leading-[1.7]">
              <li>• 상급침실료 등 과도한 비급여 청구가 거의 없음</li>
              <li>• 지자체 관리·감독으로 운영 투명성이 높음</li>
              <li>• 요양보호사·간호 인력 법정 기준 준수</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="text-[15px] font-bold text-amber-900">미리 알아둘 현실적 한계</div>
            <ul className="text-[15px] text-slate-700 space-y-1.5 leading-[1.7]">
              <li>• 대기가 수개월~1년 이상 길어 적기 입소가 어려움</li>
              <li>• 기초수급자·관내 장기 거주자 우선 배정 기준 존재</li>
              <li>• 건물이 노후됐거나 1~2인실 선택이 제한적인 편</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-[15px] text-slate-700">
          <AlertCircle className="w-5 h-5 text-[#0e8a8d] shrink-0 mt-0.5" />
          <div>
            <strong>현실적인 팁:</strong> 급여 본인부담금(20%)은 국공립과 민간이 1원도 다르지 않습니다.
            국공립에 대기를 걸어두시되, 당장 돌봄이 필요하다면 집에서 가까워 자주 찾아갈 수 있는
            <strong> 공단 A~B등급 민간 시설</strong>을 우선 알아보시는 것이 부모님 정서에도 훨씬 좋습니다.
          </div>
        </div>
      </section>

      {/* 섹션 2: 등급 완벽 해부 (기관 등급 vs 어르신 등급) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0e8a8d] shrink-0" />
          <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">
            헷갈리는 &lsquo;기관 등급&rsquo;과 &lsquo;장기요양등급&rsquo; 한 번에 정리
          </h3>
        </div>

        {/* 2-1. 기관 평가 등급 */}
        <div className="space-y-3">
          <h4 className="text-[17px] font-bold text-slate-900">
            1) 시설이 잘하는지 보는 &lsquo;기관 평가 등급&rsquo;
          </h4>
          <p className="text-[15px] sm:text-[16px] text-slate-700">
            같은 등급 숫자라도 <strong>요양원(공단 평가)</strong>과 <strong>요양병원(심평원 평가)</strong>의 기준이 다릅니다.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left text-sm text-slate-500">
                  <th className="py-2.5 pr-3 whitespace-nowrap">시설 구분</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">등급 체계</th>
                  <th className="py-2.5 pl-3">어떻게 보고 고를까?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">
                    요양원·주간보호
                    <div className="text-xs font-normal text-slate-500">건강보험공단 평가</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#0e8a8d] whitespace-nowrap">
                    A ~ E 등급
                  </td>
                  <td className="py-3 pl-3 leading-[1.7]">
                    <strong>A등급(최우수)</strong>과 <strong>B등급(양호)</strong>이 안심권입니다. C등급 이하는 인력·위생 등 감점 요인을 확인하세요.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">
                    요양병원
                    <div className="text-xs font-normal text-slate-500">심평원 적정성 평가</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#0e8a8d] whitespace-nowrap">
                    1 ~ 5 등급
                  </td>
                  <td className="py-3 pl-3 leading-[1.7]">
                    숫자가 작을수록 좋습니다. <strong>1등급(최우수)·2등급</strong>은 의사·간호사 인력과 욕창·일상생활 개선 지표가 우수합니다.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">
                    신설기관 / 미평가
                    <div className="text-xs font-normal text-slate-500">개원 초기 등</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                    신설 / 미실시
                  </td>
                  <td className="py-3 pl-3 leading-[1.7]">
                    평가 주기가 아직 안 돌아온 신설 시설이 많습니다. 나쁜 곳이 아니므로 시설 청결도와 상주 인력 수를 직접 물어보세요.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-2. 어르신 장기요양등급 */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-[17px] font-bold text-slate-900">
            2) 부모님이 공단에서 받는 &lsquo;노인장기요양등급 (1~5등급)&rsquo;
          </h4>
          <p className="text-[15px] sm:text-[16px] text-slate-700">
            국가 지원을 받으려면 먼저 부모님의 신체·인지 상태에 따라 공단에서 <strong>1~5등급 또는 인지지원등급</strong>을 판정받아야 합니다.
          </p>
          <ul className="space-y-2.5 text-[15px] sm:text-[16px] text-slate-700 leading-[1.75]">
            <li>
              <strong className="text-slate-900">• 1~2등급 (중증):</strong> 누워 지내시거나 일상생활 전반에 도움이 필요한 상태로, 바로 <strong>요양원(시설급여) 입소</strong>가 가능합니다.
            </li>
            <li>
              <strong className="text-slate-900">• 3~5등급 (중등도·치매):</strong> 기본은 집에서 이용하는 <strong>주간보호센터·방문요양</strong> 대상이지만, 가족 돌봄이 불가능하거나 배회·치매가 심하면 공단에 등급변경(시설급여)을 신청해 요양원에 모실 수 있습니다.
            </li>
            <li>
              <strong className="text-slate-900">• 인지지원등급:</strong> 거동은 가능하지만 초기 치매가 있는 경우로, 요양원 입소는 안 되며 <strong>주간보호센터 인지 프로그램</strong>을 이용할 수 있습니다.
            </li>
          </ul>
        </div>
      </section>

      {/* 섹션 3: 요양원 vs 요양병원 vs 주간보호 비교표 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">
          요양원 vs 요양병원 vs 주간보호, 어디로 모셔야 할까?
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-sm text-slate-500">
                <th className="py-2.5 pr-3 whitespace-nowrap">구분</th>
                <th className="py-2.5 px-3 whitespace-nowrap">요양원</th>
                <th className="py-2.5 px-3 whitespace-nowrap">요양병원</th>
                <th className="py-2.5 pl-3 whitespace-nowrap">주간보호센터</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">핵심 목적</td>
                <td className="py-3 px-3">24시간 생활·돌봄</td>
                <td className="py-3 px-3">의사 상주 치료·재활</td>
                <td className="py-3 pl-3">낮 시간 등하원 케어</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">적용 보험</td>
                <td className="py-3 px-3">노인장기요양보험</td>
                <td className="py-3 px-3">국민건강보험</td>
                <td className="py-3 pl-3">노인장기요양보험</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">필요 조건</td>
                <td className="py-3 px-3">장기요양 1~2등급 (3~5 조건부)</td>
                <td className="py-3 px-3">등급 없어도 입원 가능</td>
                <td className="py-3 pl-3">장기요양 1~5·인지등급</td>
              </tr>
              <tr>
                <td className="py-3 pr-3 font-bold text-slate-900 whitespace-nowrap">월 예상 비용</td>
                <td className="py-3 px-3 font-bold text-slate-900">약 75~110만 원</td>
                <td className="py-3 px-3 font-bold text-slate-900">약 100~200만 원+ <span className="block text-xs font-normal text-slate-500">(간병비 별도 여부에 따라 큰 차이)</span></td>
                <td className="py-3 pl-3 font-bold text-slate-900">약 25~40만 원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 섹션 4: 입소 전 방문 체크리스트 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">
          방문 상담 갔을 때 꼭 확인해야 할 5가지
        </h3>
        <div className="space-y-3 text-[15px] sm:text-[16px] text-slate-700 leading-[1.75]">
          {[
            '현관에 들어섰을 때 소독약이나 불쾌한 냄새가 강하지 않고 환기가 잘 되는지 확인하세요.',
            '어르신 수 대비 요양보호사와 간호(조무)사 인력이 실제로 얼마나 상주하는지 물어보세요.',
            '월 고정 비용 외에 기저귀, 물리치료, 이미용비, 상급침실료 등 추가 비급여를 문서로 받아보세요.',
            '야간이나 주말 응급 상황 발생 시 연계된 협약 병원과 실제 이송 절차를 확인하세요.',
            '면회 시간·장소 제한과 외출·외박 규정이 가족의 생활 패턴과 맞는지 점검하세요.',
          ].map((text, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#0e8a8d] shrink-0 mt-1" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
