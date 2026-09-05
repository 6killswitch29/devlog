'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SearchEntry {
	url: string;
	title: string;
	description: string;
	tags: string[];
	date: string;
}

/** 사이드바의 검색 버튼이 오버레이를 열 때 쓰는 이벤트 이름. */
export const SEARCH_EVENT = 'devlog:search';

function score(entry: SearchEntry, query: string): number {
	const q = query.toLowerCase();
	const title = entry.title.toLowerCase();
	if (title.startsWith(q)) return 3;
	if (title.includes(q)) return 2;
	if (entry.tags.some((tag) => tag.toLowerCase().includes(q))) return 1;
	if (entry.description.toLowerCase().includes(q)) return 0.5;
	return 0;
}

/**
 * ⌘K 검색. 제목·태그·설명을 빌드 시 만든 /search.json에서 클라이언트로 거른다.
 * 글이 50편을 넘어가면 인덱스를 쪼개거나 서버 검색을 고민한다.
 */
export default function SearchOverlay() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [entries, setEntries] = useState<SearchEntry[] | null>(null);
	const [cursor, setCursor] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const load = useCallback(async () => {
		if (entries) return;
		try {
			const res = await fetch('/search.json');
			setEntries(await res.json());
		} catch {
			setEntries([]);
		}
	}, [entries]);

	const show = useCallback(() => {
		setOpen(true);
		setQuery('');
		setCursor(0);
		void load();
	}, [load]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				show();
			} else if (e.key === 'Escape') {
				setOpen(false);
			}
		};
		window.addEventListener('keydown', onKey);
		window.addEventListener(SEARCH_EVENT, show);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener(SEARCH_EVENT, show);
		};
	}, [show]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	if (!open) return null;

	const results = query.trim()
		? (entries ?? [])
				.map((entry) => ({ entry, s: score(entry, query.trim()) }))
				.filter((row) => row.s > 0)
				.sort((a, b) => b.s - a.s)
				.slice(0, 8)
				.map((row) => row.entry)
		: (entries ?? []).slice(0, 8);

	const move = (delta: number) => setCursor((c) => Math.min(Math.max(c + delta, 0), Math.max(results.length - 1, 0)));

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="글 검색"
			className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
			onClick={(e) => {
				if (e.target === e.currentTarget) setOpen(false);
			}}
		>
			<div className="w-full max-w-xl overflow-hidden rounded-[10px] border border-border bg-bg shadow-2xl">
				<input
					ref={inputRef}
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setCursor(0);
					}}
					onKeyDown={(e) => {
						if (e.key === 'ArrowDown') {
							e.preventDefault();
							move(1);
						} else if (e.key === 'ArrowUp') {
							e.preventDefault();
							move(-1);
						} else if (e.key === 'Enter' && results[cursor]) {
							location.href = results[cursor].url;
						}
					}}
					placeholder="제목·태그로 검색"
					aria-label="검색어"
					className="w-full border-b border-border bg-transparent px-4 py-3 text-[0.9375rem] outline-none placeholder:text-fg-muted"
				/>

				{entries === null ? (
					<p className="px-4 py-6 text-[0.875rem] text-fg-muted">불러오는 중…</p>
				) : results.length === 0 ? (
					<p className="px-4 py-6 text-[0.875rem] text-fg-muted">결과가 없습니다.</p>
				) : (
					<ul className="max-h-[50vh] overflow-y-auto py-1">
						{results.map((entry, i) => (
							<li key={entry.url}>
								<a
									href={entry.url}
									onMouseEnter={() => setCursor(i)}
									aria-current={i === cursor ? 'true' : undefined}
									className={`block px-4 py-2.5 hover:no-underline ${i === cursor ? 'bg-bg-subtle' : ''}`}
								>
									<span className="block text-[0.9375rem] font-semibold text-fg">{entry.title}</span>
									<span className="mt-0.5 block text-[0.8125rem] text-fg-muted">
										{entry.date.replaceAll('-', '.')} · {entry.tags.map((tag) => `#${tag}`).join(' ')}
									</span>
								</a>
							</li>
						))}
					</ul>
				)}

				<p className="border-t border-border px-4 py-2 text-[0.75rem] text-fg-muted">↑↓ 이동 · Enter 열기 · ESC 닫기</p>
			</div>
		</div>
	);
}
