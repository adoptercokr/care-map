'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import syncMeta from '../../public/data/sync_meta.json';

export default function Footer() {
  const [policyType, setPolicyType] = useState<'terms' | 'privacy' | 'contact' | null>(null);

  const [contactType, setContactType] = useState<'general' | 'correction' | 'ad'>('general');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSentDone, setIsSentDone] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!isSentDone) return;
    const timer = setTimeout(() => {
      setPolicyType(null);
      setIsSentDone(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, [isSentDone]);

  const handleOpenContact = () => {
    setErrorText(null);
    setIsSentDone(false);
    setPolicyType('contact');
  };

  const handleCloseModal = () => {
    setPolicyType(null);
    setIsSentDone(false);
    setErrorText(null);
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !title.trim() || !message.trim()) {
      setErrorText('이름, 연락처, 이메일, 제목, 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSending(true);
    setErrorText(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contactType,
          name,
          phone,
          email,
          title,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setName('');
        setPhone('');
        setEmail('');
        setTitle('');
        setMessage('');
        setIsSentDone(true);
      } else {
        setErrorText(data.error || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setErrorText('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
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
                데이터 출처: 국민건강보험공단 장기요양기관 정보 및 평가결과 · 건강보험심사평가원 병원정보서비스 ({syncMeta.displayDate} 업데이트 · 실제 입소·진료 전 해당 기관에 직접 확인하시기 바랍니다.)
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
                onClick={handleCloseModal}
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
              {policyType === 'contact' && isSentDone && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 text-[#0e8a8d] flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-extrabold text-slate-900">
                      문의가 정상적으로 발송되었습니다!
                    </h4>
                    <p className="text-sm text-slate-600">
                      남겨주신 이메일과 연락처로 확인 후 빠르게 회신드리겠습니다.
                    </p>
                    <p className="text-xs text-slate-400">잠시 후 창이 자동으로 닫힙니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="h-10 px-6 rounded-xl bg-[#0e8a8d] hover:bg-[#0b7275] text-white text-sm font-bold transition"
                  >
                    확인
                  </button>
                </div>
              )}
              {policyType === 'contact' && !isSentDone && (
                <form onSubmit={handleSubmitContact} className="space-y-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        이름 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="성함 또는 기관·업체명"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        연락처 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="예: 010-1234-5678"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      이메일 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="회신받으실 이메일 (예: name@example.com)"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      제목 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="문의 제목을 입력해 주세요"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      내용 <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="자세한 문의 내용을 적어주세요."
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0e8a8d] resize-none"
                    />
                  </div>

                  {errorText && (
                    <div className="p-3 rounded-xl text-xs sm:text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      {errorText}
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
