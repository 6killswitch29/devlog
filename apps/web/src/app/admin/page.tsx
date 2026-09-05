import { adminConfigured, ADMIN } from '@/lib/admin/config';
import { listPosts } from '@/lib/admin/github';
import { readSession } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
	unconfigured: '관리자 환경변수가 설정되지 않았습니다.',
	state: '로그인 요청이 만료되었습니다. 다시 시도하세요.',
	token: 'GitHub에서 토큰을 받지 못했습니다.',
	forbidden: '허용된 계정이 아닙니다.',
};

export default async function AdminPage({ searchParams }: PageProps<'/admin'>) {
	const { error } = await searchParams;
	const session = await readSession();

	if (!session) {
		return (
			<main className="mx-auto max-w-md py-16">
				<h1 className="mb-2">글 관리</h1>
				<p className="mb-6 text-fg-muted">
					{ADMIN.login ? `${ADMIN.login} 계정만 들어올 수 있습니다.` : '관리자 계정이 설정되지 않았습니다.'}
				</p>
				{typeof error === 'string' && (
					<p className="mb-4 rounded-[var(--radius)] border border-border bg-bg-subtle px-3 py-2 text-[0.875rem]">
						{ERRORS[error] ?? '로그인에 실패했습니다.'}
					</p>
				)}
				{adminConfigured() ? (
					<a
						href="/api/admin/auth/login"
						className="inline-flex h-10 items-center rounded-[var(--radius)] border border-fg bg-fg px-5 font-medium text-bg hover:bg-accent hover:text-white hover:no-underline"
					>
						GitHub로 로그인
					</a>
				) : (
					<p className="text-[0.875rem] text-fg-muted">
						GITHUB_OAUTH_CLIENT_ID · GITHUB_OAUTH_CLIENT_SECRET · ADMIN_GITHUB_LOGIN · ADMIN_SESSION_SECRET를 설정해야
						합니다.
					</p>
				)}
			</main>
		);
	}

	const posts = await listPosts(session.token);

	return (
		<main>
			<header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
				<h1 className="flex items-baseline gap-2">
					글 관리
					<span className="text-[0.8125rem] font-normal text-fg-muted">{posts.length}개</span>
				</h1>
				<div className="flex items-center gap-3">
					<span className="text-[0.8125rem] text-fg-muted">{session.login}</span>
					<form action="/api/admin/auth/logout" method="post">
						<button type="submit" className="text-[0.8125rem] text-fg-muted hover:text-fg">
							로그아웃
						</button>
					</form>
					<a
						href="/admin/new"
						className="inline-flex h-9 items-center rounded-[var(--radius)] border border-fg bg-fg px-4 text-[0.875rem] font-medium text-bg hover:bg-accent hover:text-white hover:no-underline"
					>
						새 글
					</a>
				</div>
			</header>

			<ul>
				{posts.map((post) => {
					const slug = post.name.replace(/\.mdx?$/, '');
					return (
						<li key={post.path} className="border-t border-border first:border-t-0">
							<a href={`/admin/edit/${slug}`} className="flex items-baseline justify-between gap-4 py-3 hover:no-underline">
								<span className="font-mono text-[0.9375rem] text-fg">{slug}</span>
								<span className="shrink-0 text-[0.8125rem] text-fg-muted">편집 →</span>
							</a>
						</li>
					);
				})}
			</ul>
		</main>
	);
}
