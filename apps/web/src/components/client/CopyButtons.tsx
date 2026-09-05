'use client';

import { useEffect } from 'react';

/** 코드 블록마다 복사 버튼을 붙인다. 본문은 서버에서 그린 HTML이라 마운트 후 주입한다. */
export default function CopyButtons() {
	useEffect(() => {
		const cleanups: (() => void)[] = [];

		for (const pre of document.querySelectorAll<HTMLPreElement>('.prose pre')) {
			const code = pre.querySelector('code');
			if (!code || pre.querySelector('.copy-btn')) continue;

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'copy-btn';
			btn.textContent = '복사';
			btn.setAttribute('aria-label', '코드 복사');

			const onClick = async () => {
				const text = code.innerText;
				let ok = false;
				try {
					await navigator.clipboard.writeText(text);
					ok = true;
				} catch {
					// 클립보드 API를 못 쓰는 환경(포커스 없음, 비보안 컨텍스트)용 폴백
					const ta = document.createElement('textarea');
					ta.value = text;
					ta.setAttribute('readonly', '');
					ta.style.position = 'fixed';
					ta.style.opacity = '0';
					document.body.appendChild(ta);
					ta.select();
					try {
						ok = document.execCommand('copy');
					} catch {}
					ta.remove();
				}
				btn.textContent = ok ? '복사됨' : '실패';
				if (ok) btn.dataset.copied = '';
				setTimeout(() => {
					btn.textContent = '복사';
					delete btn.dataset.copied;
				}, 1500);
			};

			btn.addEventListener('click', onClick);
			pre.appendChild(btn);
			cleanups.push(() => {
				btn.removeEventListener('click', onClick);
				btn.remove();
			});
		}

		return () => cleanups.forEach((fn) => fn());
	}, []);

	return null;
}
