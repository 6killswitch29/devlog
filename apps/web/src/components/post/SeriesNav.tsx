import type { PostSummary } from '@/lib/posts';

/** 사이드바의 시리즈 목차. 01·02·03 번호와 현재 글 표시. */
export default function SeriesNav({ name, posts, currentId }: { name: string; posts: PostSummary[]; currentId: string }) {
	if (posts.length < 2) return null;

	const current = posts.findIndex((post) => post.id === currentId) + 1;

	return (
		<nav aria-label="시리즈">
			<p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted">
				{name} {current}/{posts.length}
			</p>
			<ol className="flex flex-col gap-1.5 text-[0.8125rem] leading-snug">
				{posts.map((post, i) => {
					const isCurrent = post.id === currentId;
					return (
						<li key={post.id} className="flex gap-2">
							<span className="tabular-nums text-fg-muted">{String(i + 1).padStart(2, '0')}</span>
							{isCurrent ? (
								<span aria-current="page" className="font-semibold text-fg">
									{post.title}
								</span>
							) : (
								<a href={post.url} className="text-fg-muted hover:text-fg hover:no-underline">
									{post.title}
								</a>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
