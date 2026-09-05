import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';
import { ADMIN } from './config';

const COOKIE = 'devlog_admin';
const MAX_AGE_SEC = 60 * 60 * 8;

export interface Session {
	login: string;
	/** GitHub 액세스 토큰. 커밋은 이 토큰으로 = 본인 계정 이름으로 남는다. */
	token: string;
}

/**
 * 세션은 암호화된 JWT(JWE) 쿠키 하나가 전부다. 서버에 저장하는 것이 없으므로 DB가 필요 없다.
 * 토큰이 들어 있으니 서명만으로는 부족하다 — 반드시 암호화한다.
 */
async function key(): Promise<Uint8Array> {
	const secret = ADMIN.sessionSecret;
	if (!secret) throw new Error('ADMIN_SESSION_SECRET이 없습니다.');
	// 32바이트 키로 정규화
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return new Uint8Array(digest);
}

export async function createSession(session: Session): Promise<void> {
	const jwe = await new EncryptJWT({ login: session.login, token: session.token })
		.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
		.setIssuedAt()
		.setExpirationTime(`${MAX_AGE_SEC}s`)
		.encrypt(await key());

	(await cookies()).set(COOKIE, jwe, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: MAX_AGE_SEC,
	});
}

export async function readSession(): Promise<Session | null> {
	const raw = (await cookies()).get(COOKIE)?.value;
	if (!raw) return null;
	try {
		const { payload } = await jwtDecrypt(raw, await key());
		const login = typeof payload.login === 'string' ? payload.login : '';
		const token = typeof payload.token === 'string' ? payload.token : '';
		// 허용된 계정이 바뀌었으면 기존 쿠키도 무효
		if (!login || !token || login !== ADMIN.login) return null;
		return { login, token };
	} catch {
		return null;
	}
}

export async function clearSession(): Promise<void> {
	(await cookies()).delete(COOKIE);
}
