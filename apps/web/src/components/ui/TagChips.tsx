/**
 * 태그 필터. 칩은 각 태그의 정적 페이지(/tags/<tag>/)로 간다.
 *
 * 사이드바에서는 상위 몇 개만 보여준다(글이 늘면 태그가 무한정 길어진다).
 * 나머지는 /tags 로 넘긴다. 지금 보고 있는 태그는 잘린 뒤쪽에 있어도 항상 보여준다.
 */
export default function TagChips({
	tags,
	total,
	active,
	limit,
}: {
	tags: { tag: string; count: number }[];
	total: number;
	active?: string;
	/** 없으면 전부 보여준다(/tags 페이지) */
	limit?: number;
}) {
	if (tags.length === 0) return null;

	const visible = limit ? tags.slice(0, limit) : tags;
	const activeTag = active ? tags.find((t) => t.tag === active) : undefined;
	const shown = activeTag && !visible.some((t) => t.tag === active) ? [...visible, activeTag] : visible;
	const hidden = tags.length - visible.length;

	const chip =
		'inline-flex items-baseline gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.8125rem] hover:no-underline';
	const on = 'border-fg bg-bg-subtle font-semibold text-fg';
	const off = 'border-border text-fg-muted hover:border-accent hover:text-accent';

	return (
		<div>
			<p className="mb-2 hidden text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted lg:block">TAGS</p>
			{/* 모바일에서는 한 줄로 두고 옆으로 민다 */}
			<ul className="-mx-5 flex flex-nowrap items-baseline gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
				<li>
					<a href="/" className={`${chip} ${active ? off : on}`}>
						전체<span className="text-[0.75em] opacity-80">{total}</span>
					</a>
				</li>
				{shown.map(({ tag, count }) => (
					<li key={tag}>
						<a href={`/tags/${tag}/`} className={`${chip} ${active === tag ? on : off}`}>
							{tag}
							<span className="text-[0.75em] opacity-80">{count}</span>
						</a>
					</li>
				))}
				{hidden > 0 && (
					<li>
						<a
							href="/tags/"
							className="inline-block whitespace-nowrap px-1 text-[0.8125rem] text-fg-muted hover:text-fg hover:no-underline"
						>
							전체 보기 →
						</a>
					</li>
				)}
			</ul>
		</div>
	);
}
