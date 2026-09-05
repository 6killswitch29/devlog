'use client';

import { useEffect } from 'react';

/**
 * 라이트/다크 토글. 현재 테마는 <html data-theme>가 단일 진실이라
 * 컴포넌트는 상태를 들고 있지 않는다(= 서버/클라이언트 렌더가 항상 같다).
 * 초기값은 layout.tsx의 인라인 스크립트가 첫 페인트 전에 세팅한다.
 */
export default function ThemeToggle() {
	useEffect(() => {
		// 저장된 선택이 없을 때만 시스템 설정 변화를 따라간다.
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = (e: MediaQueryListEvent) => {
			try {
				if (localStorage.getItem('theme')) return;
			} catch {}
			document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	function toggle() {
		const root = document.documentElement;
		const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
		root.dataset.theme = next;
		try {
			localStorage.setItem('theme', next);
		} catch {}
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label="라이트/다크 테마 전환"
			title="테마 전환"
			className="inline-flex size-8 items-center justify-center rounded-[var(--radius)] border border-transparent text-fg-muted hover:border-border hover:text-fg"
		>
			<svg
				className="hidden dark:block"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
			</svg>
			<svg
				className="block dark:hidden"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
			</svg>
		</button>
	);
}
