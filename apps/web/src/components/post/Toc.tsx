'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/toc';

/** 글 사이드바의 목차. 스크롤에 따라 현재 위치를 굵게 표시한다. */
export default function Toc({ items }: { items: TocItem[] }) {
	const [active, setActive] = useState<string>(items[0]?.slug ?? '');

	useEffect(() => {
		const headings = items
			.map((item) => document.getElementById(item.slug))
			.filter((el): el is HTMLElement => Boolean(el));
		if (headings.length === 0) return;

		// 화면 위쪽 1/3 지점을 지난 제목 중 마지막 것을 현재 위치로 본다.
		const observer = new IntersectionObserver(
			() => {
				const line = window.innerHeight / 3;
				let current = headings[0];
				for (const heading of headings) {
					if (heading.getBoundingClientRect().top <= line) current = heading;
				}
				setActive(current.id);
			},
			{ rootMargin: '0px 0px -66% 0px', threshold: [0, 1] },
		);
		for (const heading of headings) observer.observe(heading);
		return () => observer.disconnect();
	}, [items]);

	if (items.length === 0) return null;

	return (
		<nav aria-label="목차">
			<p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted">ON THIS PAGE</p>
			<ul className="flex flex-col gap-1.5 text-[0.8125rem] leading-snug">
				{items.map((item) => (
					<li key={item.slug} className={item.depth === 3 ? 'pl-3' : undefined}>
						<a
							href={`#${item.slug}`}
							aria-current={active === item.slug ? 'location' : undefined}
							className={
								active === item.slug ? 'font-semibold text-fg hover:no-underline' : 'text-fg-muted hover:text-fg hover:no-underline'
							}
						>
							{item.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
