import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN, adminConfigured } from '@/lib/admin/config';
import { getViewer } from '@/lib/admin/github';
import { createSession } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

function fail(request: NextRequest, reason: string) {
	const url = new URL('/admin', request.nextUrl.origin);
	url.searchParams.set('error', reason);
	return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
	if (!adminConfigured()) return fail(request, 'unconfigured');

	const code = request.nextUrl.searchParams.get('code');
	const state = request.nextUrl.searchParams.get('state');
	const jar = await cookies();
	const expected = jar.get('devlog_admin_state')?.value;
	jar.delete('devlog_admin_state');

	if (!code || !state || !expected || state !== expected) return fail(request, 'state');

	const res = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			client_id: ADMIN.clientId,
			client_secret: ADMIN.clientSecret,
			code,
			redirect_uri: new URL('/api/admin/auth/callback', request.nextUrl.origin).href,
		}),
		cache: 'no-store',
	});
	const data = (await res.json()) as { access_token?: string };
	if (!data.access_token) return fail(request, 'token');

	// 허용된 계정인지 GitHub에 직접 물어본다.
	const viewer = await getViewer(data.access_token);
	if (viewer.login.toLowerCase() !== ADMIN.login.toLowerCase()) return fail(request, 'forbidden');

	await createSession({ login: viewer.login, token: data.access_token });
	return NextResponse.redirect(new URL('/admin', request.nextUrl.origin));
}
