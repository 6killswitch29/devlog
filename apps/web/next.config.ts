import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Astro가 만들던 URL 형태(`/blog/<slug>/`)를 그대로 유지한다.
	trailingSlash: true,
	// 끝 슬래시 정규화는 Vercel(apps/web/vercel.json)에 맡긴다.
	// Next가 하면 그 규칙이 우리 리다이렉트보다 먼저 걸려 /blog → /blog/ → / 로 두 번 튄다.
	skipTrailingSlashRedirect: true,
	async redirects() {
		return [
			{ source: '/blog', destination: '/', permanent: true },
			// Astro의 @astrojs/sitemap이 쓰던 경로 → Next의 app/sitemap.ts 경로
			{ source: '/sitemap-index.xml', destination: '/sitemap.xml', permanent: true },
		];
	},
};

export default nextConfig;
