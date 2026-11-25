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
      title = '',
      contact = '',
      company = '',
      message = '',
    } = body as {
      type?: 'general' | 'correction' | 'ad';
      title?: string;
      contact?: string;
      company?: string;
      message?: string;
    };

    const trimmedContact = contact.trim();
    const trimmedMessage = message.trim();
    const trimmedCompany = company.trim();
    const trimmedTitle = title.trim();

    if (!trimmedContact || !trimmedMessage) {
      return NextResponse.json(
        { success: false, error: '회신 연락처와 문의 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const typeLabel =
      type === 'ad' ? '광고·제휴문의' : type === 'correction' ? '정보수정요청' : '일반문의';
    const defaultTitle =
      type === 'ad'
        ? '배너 광고 및 비즈니스 제휴 제안'
        : type === 'correction'
        ? '시설 정보 수정 및 등록 요청'
        : '서비스 이용 및 오류 제보 문의';
    const finalTitle = trimmedTitle || defaultTitle;

    const senderName = `[케어맵 care.animap.co.kr] ${typeLabel}`;
    const mailSubject = `[케어맵 care.animap.co.kr] ${typeLabel}: ${
      trimmedCompany ? `[${trimmedCompany}] ` : ''
    }${finalTitle}`;

    const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const payload: Record<string, string> = {
      name: senderName,
      _subject: mailSubject,
      사이트출처: '케어맵 (care.animap.co.kr) - 전국 요양병원·요양원·주간보호 지도',
      문의유형: typeLabel,
      ...(trimmedCompany ? { 기관명_업체명: trimmedCompany } : {}),
      문의제목: finalTitle,
      회신연락처: trimmedContact,
      문의내용: trimmedMessage,
      접수일시: nowStr,
    };

    if (trimmedContact.includes('@')) {
      payload._replyto = trimmedContact;
      payload.email = trimmedContact;
    } else {
      payload.email = 'noreply@care.animap.co.kr';
      payload._replyto = 'noreply@care.animap.co.kr';
    }

    const emailPromises = [
      // 채널 1: Formspree
      fetch(FORMSPREE_NAVER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      // 채널 2: ShipMyForm (2순위 백업 메일)
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

      // 채널 3: ShipMyForm (1순위 네이버 메일)
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

      // 채널 4: FormSubmit
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
      message: '문의가 정상적으로 발송되었습니다. 남겨주신 연락처로 확인 후 회신드리겠습니다.',
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
