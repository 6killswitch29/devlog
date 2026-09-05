/** 사이드바 태그 필터. 칩은 각 태그의 정적 페이지(/tags/<tag>/)로 간다. */
export default function TagChips({
	tags,
	total,
	active,
}: {
	tags: { tag: string; count: number }[];
	total: number;
	active?: string;
}) {
	if (tags.length === 0) return null;

	const chip =
		'inline-flex items-baseline gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.8125rem] hover:no-underline';
	const on = 'border-fg bg-bg-subtle font-semibold text-fg';
	const off = 'border-border text-fg-muted hover:border-accent hover:text-accent';

	return (
		<div>
			<p className="mb-2 hidden text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted lg:block">TAGS</p>
			{/* 모바일에서는 한 줄로 두고 옆으로 민다 */}
			<ul className="-mx-5 flex flex-nowrap gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
				<li>
					<a href="/" className={`${chip} ${active ? off : on}`}>
						전체<span className="text-[0.75em] opacity-80">{total}</span>
					</a>
				</li>
				{tags.map(({ tag, count }) => (
					<li key={tag}>
						<a href={`/tags/${tag}/`} className={`${chip} ${active === tag ? on : off}`}>
							{tag}
							<span className="text-[0.75em] opacity-80">{count}</span>
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
