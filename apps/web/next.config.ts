import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Astro가 만들던 URL 형태(`/blog/<slug>/`)를 그대로 유지한다.
	trailingSlash: true,
	async redirects() {
		return [
			{ source: '/blog', destination: '/', permanent: true },
			// Astro의 @astrojs/sitemap이 쓰던 경로 → Next의 app/sitemap.ts 경로
			{ source: '/sitemap-index.xml', destination: '/sitemap.xml', permanent: true },
		];
	},
};

export default nextConfig;
