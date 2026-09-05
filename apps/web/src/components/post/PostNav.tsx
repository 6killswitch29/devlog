import type { PostSummary } from '@/lib/posts';

/** 글 하단 이전/다음. 이전 글 = 더 오래된 글, 다음 글 = 더 새로운 글. */
export default function PostNav({ older, newer }: { older?: PostSummary; newer?: PostSummary }) {
	if (!older && !newer) return null;

	const card =
		'flex flex-col gap-1 rounded-[var(--radius)] border border-border p-4 text-fg hover:border-accent hover:no-underline';

	return (
		<nav aria-label="이전/다음 글" className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
			{older ? (
				<a href={older.url} className={card}>
					<span className="text-[0.8125rem] text-fg-muted">← 이전 글</span>
					<span className="text-[0.9375rem] font-semibold">{older.title}</span>
				</a>
			) : (
				<span />
			)}
			{newer && (
				<a href={newer.url} className={`${card} sm:text-right`}>
					<span className="text-[0.8125rem] text-fg-muted">다음 글 →</span>
					<span className="text-[0.9375rem] font-semibold">{newer.title}</span>
				</a>
			)}
		</nav>
	);
}
