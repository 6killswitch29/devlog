import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/consts';
import { getPosts, postUrl } from '@/lib/posts';

// 빌드 타임에 한 번 생성한다(정적 파일과 같다).
export const dynamic = 'force-static';

function escape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * RSS 2.0 피드. @astrojs/rss가 내던 것과 같은 필드·순서를 유지한다.
 * link와 guid가 바뀌면 구독자에게 전부 새 글로 보이므로 형식을 함부로 바꾸지 않는다.
 */
export async function GET() {
	const posts = await getPosts();

	const items = posts
		.map((post) => {
			const url = new URL(postUrl(post), SITE_URL).href;
			const categories = post.data.tags.map((tag) => `<category>${escape(tag)}</category>`).join('');
			return (
				`<item>` +
				`<title>${escape(post.data.title)}</title>` +
				`<link>${url}</link>` +
				`<guid isPermaLink="true">${url}</guid>` +
				`<description>${escape(post.data.description)}</description>` +
				`<pubDate>${post.data.pubDate.toUTCString()}</pubDate>` +
				categories +
				`</item>`
			);
		})
		.join('');

	const xml =
		`<?xml version="1.0" encoding="UTF-8"?>` +
		`<rss version="2.0"><channel>` +
		`<title>${escape(SITE_TITLE)}</title>` +
		`<description>${escape(SITE_DESCRIPTION)}</description>` +
		`<link>${SITE_URL}/</link>` +
		items +
		`</channel></rss>`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
