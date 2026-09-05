import type { ReactNode } from 'react';

/**
 * 모든 페이지의 2단 레이아웃. 좌측 사이드바(점선 구분선) + 우측 본문.
 * 사이드바 내용은 페이지가 정한다(목록은 프로필+네비, 글은 목차+시리즈).
 * 900px 아래에서는 사이드바가 본문 위로 쌓인다.
 */
export default function Shell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
	return (
		<div className="mx-auto flex w-full max-w-[70rem] flex-col lg:flex-row">
			<aside className="shrink-0 border-b border-dashed border-border px-6 py-8 lg:sticky lg:top-0 lg:h-dvh lg:w-[17rem] lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-10">
				<div className="flex h-full flex-col gap-8">{sidebar}</div>
			</aside>
			<main className="min-w-0 flex-1 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
		</div>
	);
}
