/** 관리자(글 편집기) 설정. 값이 없으면 편집기는 아예 동작하지 않는다. */
export const ADMIN = {
	/** 저장소 — 글 파일을 읽고 커밋할 곳 */
	owner: '6killswitch29',
	repo: 'devlog',
	/** 커밋할 브랜치. 기본은 프로덕션 브랜치이고, 시험용으로만 env로 바꾼다. */
	get branch() {
		return process.env.ADMIN_BRANCH ?? 'main';
	},
	/** 저장소 안에서의 글 디렉터리 */
	postsDir: 'apps/web/content/blog',

	/** 이 GitHub 계정만 로그인할 수 있다. */
	get login() {
		return process.env.ADMIN_GITHUB_LOGIN ?? '';
	},
	get clientId() {
		return process.env.GITHUB_OAUTH_CLIENT_ID ?? '';
	},
	get clientSecret() {
		return process.env.GITHUB_OAUTH_CLIENT_SECRET ?? '';
	},
	get sessionSecret() {
		return process.env.ADMIN_SESSION_SECRET ?? '';
	},
} as const;

/** 필요한 환경변수가 다 있는지. 하나라도 없으면 로그인 화면에서 안내한다. */
export function adminConfigured(): boolean {
	return Boolean(ADMIN.login && ADMIN.clientId && ADMIN.clientSecret && ADMIN.sessionSecret);
}
