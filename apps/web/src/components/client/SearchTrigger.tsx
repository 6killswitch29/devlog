'use client';

import { SEARCH_EVENT } from './SearchOverlay';

/** 사이드바의 검색 버튼. 실제 오버레이는 layout에 한 번만 마운트된다. */
export default function SearchTrigger() {
	return (
		<button
			type="button"
			onClick={() => window.dispatchEvent(new CustomEvent(SEARCH_EVENT))}
			className="flex w-full items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[0.8125rem] text-fg-muted hover:border-accent hover:text-fg"
		>
			<span aria-hidden="true">⌕</span>
			<span>검색</span>
			<kbd className="ml-auto font-sans text-[0.6875rem] text-fg-muted">⌘K</kbd>
		</button>
	);
}
