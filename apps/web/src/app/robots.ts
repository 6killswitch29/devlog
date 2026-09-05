import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/consts';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: { userAgent: '*', allow: '/', disallow: '/admin' },
		sitemap: new URL('/sitemap.xml', SITE_URL).href,
	};
}
