'use client';

import { useMemo, useState } from 'react';
import type { PostSummary } from '@/lib/posts';

type Order = 'newest' | 'oldest';

/** 글 목록 화면. 정렬 토글만 클라이언트 상태고, 목록 자체는 서버에서 받아온 그대로다. */
export default function PostListView({ posts, title = '글' }: { posts: PostSummary[]; title?: string }) {
	const [order, setOrder] = useState<Order>('newest');
	// posts는 최신순으로 들어온다.
	const sorted = useMemo(() => (order === 'newest' ? posts : [...posts].reverse()), [posts, order]);

	return (
		<section>
			<header className="mb-6 flex items-baseline justify-between gap-4">
				<h1 className="flex items-baseline gap-2">
					{title}
					<span className="text-[0.8125rem] font-normal text-fg-muted">{posts.length}편</span>
				</h1>
				{posts.length > 1 && (
					<button
						type="button"
						onClick={() => setOrder((o) => (o === 'newest' ? 'oldest' : 'newest'))}
						aria-label={`정렬: ${order === 'newest' ? '최신순' : '오래된순'}. 눌러서 전환`}
						className="text-[0.75rem] font-semibold tracking-[0.1em] text-fg-muted hover:text-fg"
					>
						{order === 'newest' ? 'NEWEST' : 'OLDEST'} ▾
					</button>
				)}
			</header>

			{sorted.length === 0 ? (
				<p className="text-fg-muted">아직 글이 없습니다.</p>
			) : (
				<ul>
					{sorted.map((post) => (
						<li key={post.id} className="border-t border-border first:border-t-0">
							<a href={post.url} className="group block py-5 hover:no-underline">
								<p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-fg-muted">
									{post.series && (
										<span className="rounded border border-border px-1.5 py-px text-[0.6875rem] font-semibold tracking-wide">
											SERIES {post.series.index}/{post.series.total}
										</span>
									)}
									<time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
									<span>·</span>
									<span>{post.minutes}분</span>
									<span>·</span>
									<span className="text-fg-muted">{post.tags.map((tag) => `#${tag}`).join(' ')}</span>
									{post.draft && (
										<span className="rounded border border-dashed border-fg-muted px-1.5 text-[0.6875rem]">초안</span>
									)}
								</p>
								<h2 className="text-[1.1875rem] leading-snug text-fg group-hover:text-accent">{post.title}</h2>
								<p className="mt-1 text-[0.9375rem] leading-relaxed text-fg-muted">{post.description}</p>
							</a>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
