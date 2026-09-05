import type { PostSummary } from '@/lib/posts';
import type { TocItem } from '@/lib/toc';
import SeriesNav from './SeriesNav';
import Toc from './Toc';

/**
 * 글 화면의 사이드바 알맹이(목차 + 시리즈).
 * 데스크톱은 펼친 그대로, 모바일에서는 접어 둔다 — 본문 위에 목차가 통째로
 * 깔리면 글이 한참 아래로 밀린다.
 */
export default function PostAside({
	toc,
	series,
	seriesPosts,
	currentId,
}: {
	toc: TocItem[];
	series?: string;
	seriesPosts: PostSummary[];
	currentId: string;
}) {
	const hasSeries = Boolean(series) && seriesPosts.length > 1;
	if (toc.length === 0 && !hasSeries) return null;

	const inner = (
		<>
			<Toc items={toc} />
			{series && hasSeries && <SeriesNav name={series} posts={seriesPosts} currentId={currentId} />}
		</>
	);

	return (
		<>
			<details className="lg:hidden">
				<summary className="cursor-pointer text-[0.875rem] text-fg-muted marker:text-fg-muted">
					{toc.length > 0 ? '목차' : '시리즈'}
				</summary>
				<div className="mt-3 flex flex-col gap-6">{inner}</div>
			</details>
			<div className="hidden lg:contents">{inner}</div>
		</>
	);
}
