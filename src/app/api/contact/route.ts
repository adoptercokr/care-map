import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1순위 대표님 네이버 공식 이메일 (화면 비노출 Base64 보관)
const NAVER_EMAIL_DEST = Buffer.from('eW1qY29rckBuYXZlci5jb20=', 'base64').toString('utf-8');
const FORMSPREE_NAVER_ENDPOINT = 'https://formspree.io/f/xaqlbwqy';

// 2순위 구글 백업 이메일 (화면 비노출 Base64 보관)
const GMAIL_DEST = Buffer.from('am95a29yZWE3QGdtYWlsLmNvbQ==', 'base64').toString('utf-8');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type = 'general',
      name = '',
      phone = '',
      email = '',
      title = '',
      message = '',
    } = body as {
      type?: 'general' | 'correction' | 'ad';
      name?: string;
      phone?: string;
      email?: string;
      title?: string;
      message?: string;
    };

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedTitle || !trimmedMessage) {
      return NextResponse.json(
        { success: false, error: '이름, 연락처, 이메일, 제목, 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const typeLabel =
      type === 'ad' ? '광고·제휴문의' : type === 'correction' ? '정보수정요청' : '일반문의';

    const senderName = `[케어맵 care.animap.co.kr] ${typeLabel}`;
    const mailSubject = `[케어맵 care.animap.co.kr] ${typeLabel}: [${trimmedName}] ${trimmedTitle}`;
    const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const payload: Record<string, string> = {
      name: senderName,
      _subject: mailSubject,
      사이트출처: '케어맵 (care.animap.co.kr) - 전국 요양병원·요양원·주간보호 지도',
      문의유형: typeLabel,
      이름: trimmedName,
      연락처: trimmedPhone,
      이메일: trimmedEmail,
      제목: trimmedTitle,
      내용: trimmedMessage,
      접수일시: nowStr,
      email: trimmedEmail,
      _replyto: trimmedEmail,
    };

    const emailPromises = [
      fetch(FORMSPREE_NAVER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      fetch(`https://shipmyform.com/to/${GMAIL_DEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://care.animap.co.kr',
          Referer: 'https://care.animap.co.kr/',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      fetch(`https://shipmyform.com/to/${NAVER_EMAIL_DEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://care.animap.co.kr',
          Referer: 'https://care.animap.co.kr/',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      fetch(`https://formsubmit.co/ajax/${NAVER_EMAIL_DEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),
    ];

    const results = await Promise.allSettled(emailPromises);
    const hasEmailSent = results.some(
      (r) => r.status === 'fulfilled' && r.value && (r.value as Response).ok
    );

    if (!hasEmailSent) {
      return NextResponse.json(
        {
          success: false,
          error: '일시적인 메일 서버 지연으로 전송되지 못했습니다. 잠시 후 다시 시도해 주세요.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '문의가 정상적으로 발송되었습니다. 확인 후 빠르게 회신드리겠습니다.',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: '문의 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      },
      { status: 500 }
    );
  }
}
