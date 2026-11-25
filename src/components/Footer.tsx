'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function Footer() {
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | 'contact' | null>(null);

  const [contactType, setContactType] = useState<'general' | 'correction' | 'ad'>('general');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);

  const handleOpenContact = () => {
    setSendResult(null);
    setPolicyType('contact');
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo.trim() || !message.trim()) {
      setSendResult({ ok: false, text: '회신 연락처와 문의 내용을 모두 입력해 주세요.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contactType,
          company,
          title,
          contact: replyTo,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          ok: true,
          text: data.message || '문의가 정상적으로 발송되었습니다.',
        });
        setCompany('');
        setTitle('');
        setReplyTo('');
        setMessage('');
      } else {
        setSendResult({
          ok: false,
          text: data.error || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        });
      }
    } catch {
      setSendResult({
        ok: false,
        text: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSending(false);
    }
  };

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
              <button onClick={handleOpenContact} className="hover:text-[#0e8a8d]">
                제휴·문의하기
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs text-slate-500">
            <div>© {new Date().getFullYear()} care.animap.co.kr · 케어맵. All rights reserved.</div>
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
            <div className="p-5 text-sm text-slate-600 leading-relaxed space-y-3 max-h-[80vh] overflow-y-auto">
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
                <form onSubmit={handleSubmitContact} className="space-y-3.5">
                  <p className="text-xs sm:text-sm text-slate-500">
                    시설 정보 수정 요청, 서비스 오류 제보, 광고·제휴 문의를 남겨주시면 담당자에게 즉시 메일로 전달됩니다.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'general', label: '일반 문의' },
                      { id: 'correction', label: '정보 수정' },
                      { id: 'ad', label: '광고·제휴' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContactType(opt.id as 'general' | 'correction' | 'ad')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition ${
                          contactType === opt.id
                            ? 'bg-[#0e8a8d] text-white border-[#0e8a8d]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      기관명 / 업체명 (선택)
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="예: OO요양원 또는 업체명"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      회신받을 연락처 또는 이메일 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="이메일 또는 휴대폰 번호"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      문의 제목 (선택)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 시설 전화번호 수정 요청"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      문의 내용 <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="자세한 내용을 적어주세요."
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d] resize-none"
                    />
                  </div>

                  {sendResult && (
                    <div
                      className={`p-3 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2 ${
                        sendResult.ok
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {sendResult.ok && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                      <span>{sendResult.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full h-11 rounded-xl bg-[#0e8a8d] hover:bg-[#0b7275] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>전송 중...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>문의 메일 보내기</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
