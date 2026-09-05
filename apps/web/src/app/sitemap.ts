import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/consts';
import { getAllTags, getPosts, postUrl } from '@/lib/posts';

/** draft 글은 getPosts가 빌드에서 이미 걸러낸다. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [posts, tags] = await Promise.all([getPosts(), getAllTags()]);
	const url = (path: string) => new URL(path, SITE_URL).href;

	return [
		{ url: url('/'), lastModified: posts[0]?.data.pubDate },
		{ url: url('/about/') },
		{ url: url('/tags/') },
		...tags.map(({ tag }) => ({ url: url(`/tags/${tag}/`) })),
		...posts.map((post) => ({
			url: url(postUrl(post)),
			lastModified: post.data.updatedDate ?? post.data.pubDate,
		})),
	];
}
