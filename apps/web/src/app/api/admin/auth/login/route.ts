import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN, adminConfigured } from '@/lib/admin/config';

export const dynamic = 'force-dynamic';

/** GitHub OAuth 시작. state를 쿠키에 넣어 콜백에서 대조한다(CSRF 방지). */
export async function GET(request: NextRequest) {
	if (!adminConfigured()) {
		return NextResponse.json({ error: '관리자 환경변수가 설정되지 않았습니다.' }, { status: 500 });
	}

	const state = crypto.randomUUID();
	(await cookies()).set('devlog_admin_state', state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 600,
	});

	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', ADMIN.clientId);
	url.searchParams.set('redirect_uri', new URL('/api/admin/auth/callback', request.nextUrl.origin).href);
	// 공개 저장소에 커밋하는 데 필요한 최소 범위
	url.searchParams.set('scope', 'public_repo');
	url.searchParams.set('state', state);

	return NextResponse.redirect(url);
}
