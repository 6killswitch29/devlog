// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://devlog-hazel-three.vercel.app',
	integrations: [mdx(), sitemap()],
	redirects: {
		'/blog': '/',
	},
	markdown: {
		// Astro 7 기본 마크다운 처리기(Sätteri). 각주 섹션 라벨을 한국어로.
		processor: satteri({
			features: {
				gfm: {
					footnotes: {
						label: '각주',
						backLabel: '본문 {reference}번 참조로 돌아가기',
					},
				},
			},
		}),
		shikiConfig: {
			// 라이트/다크 듀얼 테마. 색은 --shiki-light / --shiki-dark CSS 변수로 나오고
			// global.css에서 data-theme에 따라 골라 쓴다.
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			defaultColor: false,
		},
	},
});
