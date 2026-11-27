'use client';

import React from 'react';
import { CareFacility } from '../types/care';
import { getGradeLabel, getCapacityLabel } from '../utils/gradeLabel';
import { X, Trash2 } from 'lucide-react';

interface CompareDrawerProps {
  items: CareFacility[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareDrawer({ items, isOpen, onClose, onRemove }: CompareDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">시설 핵심 지표 비교 ({items.length}/3)</h2>
            <p className="text-xs text-slate-500">공단 평가등급, 대기 인원, 돌봄 인력, 예상 비용을 나란히 비교합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-x-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              비교함에 담긴 시설이 없습니다. 지도나 목록에서 시설을 선택해 담아보세요.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-500 w-32">비교 항목</th>
                  {items.map((item) => (
                    <th key={item.id} className="py-2.5 px-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">{item.name}</span>
                        <button
                          onClick={() => onRemove(item.id)}
                          title="제거"
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[11px] font-normal text-slate-500">{item.typeName}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">공단 평가등급</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 font-bold text-slate-900">
                      {getGradeLabel(item)}
                      {item.score ? <span className="ml-1 text-xs font-normal text-slate-500">({item.score}점)</span> : null}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">정원 / 병상</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 text-slate-800">
                      {getCapacityLabel(item)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">세부 인력</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 text-xs text-slate-700 leading-relaxed">
                      {item.staffDetail || `${item.staffCare + item.staffNurse}명`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">설립 구분</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 font-semibold text-slate-800">
                      {item.ownership}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">인력 (요양/간호)</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 text-slate-800">
                      {item.staffCare}명 / {item.staffNurse}명
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-3 text-xs font-medium text-slate-500">전화번호</td>
                  {items.map((item) => (
                    <td key={item.id} className="py-3 px-3 text-slate-700 text-xs">
                      {item.tel || '미제공'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
