import type { Metadata } from 'next';
import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';
import { getAllSeries, getPostSummaries } from '@/lib/posts';

export const metadata: Metadata = {
	title: '시리즈',
	description: '이어서 쓴 글 묶음',
	alternates: { canonical: '/series/' },
};

export default async function SeriesPage() {
	const [series, posts] = await Promise.all([getAllSeries(), getPostSummaries()]);

	return (
		<Shell sidebar={<ListSidebar />}>
			<h1 className="mb-6 flex items-baseline gap-2">
				시리즈
				<span className="text-[0.8125rem] font-normal text-fg-muted">{series.length}개</span>
			</h1>

			{series.length === 0 ? (
				<p className="text-fg-muted">아직 시리즈가 없습니다.</p>
			) : (
				<div className="flex flex-col gap-8">
					{series.map(({ name, count }) => {
						const items = posts
							.filter((post) => post.series?.name === name)
							.sort((a, b) => (a.series!.index ?? 0) - (b.series!.index ?? 0));

						return (
							<section key={name}>
								<h2 className="mb-3 flex items-baseline gap-2 border-b border-border pb-2 text-[1.0625rem]">
									{name}
									<span className="text-[0.8125rem] font-normal text-fg-muted">{count}편</span>
								</h2>
								<ol className="flex flex-col gap-2.5">
									{items.map((post, i) => (
										<li key={post.id} className="flex gap-3">
											<span className="tabular-nums text-[0.875rem] text-fg-muted">{String(i + 1).padStart(2, '0')}</span>
											<div className="min-w-0">
												<a href={post.url} className="font-semibold text-fg hover:text-accent hover:no-underline">
													{post.title}
												</a>
												<p className="text-[0.8125rem] text-fg-muted">
													{post.date.replaceAll('-', '.')} · {post.minutes}분
												</p>
											</div>
										</li>
									))}
								</ol>
							</section>
						);
					})}
				</div>
			)}
		</Shell>
	);
}
