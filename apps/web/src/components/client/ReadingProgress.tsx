'use client';

import { useEffect, useState } from 'react';

/** 상단 읽기 진행바. 문서 스크롤 비율만큼 채운다. */
export default function ReadingProgress() {
	const [ratio, setRatio] = useState(0);

	useEffect(() => {
		const update = () => {
			const scrollable = document.documentElement.scrollHeight - window.innerHeight;
			setRatio(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
		};
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	}, []);

	return (
		<div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5">
			<div className="h-full bg-accent transition-[width] duration-75" style={{ width: `${ratio * 100}%` }} />
		</div>
	);
}
