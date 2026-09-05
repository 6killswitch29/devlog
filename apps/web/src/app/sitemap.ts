import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/consts';
import { getAllSeries, getAllTags, getPosts, postUrl } from '@/lib/posts';
import { getProjects } from '@/lib/projects';

/** draft 글은 getPosts가 빌드에서 이미 걸러낸다. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [posts, tags, series, projects] = await Promise.all([
		getPosts(),
		getAllTags(),
		getAllSeries(),
		getProjects(),
	]);
	const url = (path: string) => new URL(path, SITE_URL).href;

	return [
		{ url: url('/'), lastModified: posts[0]?.data.pubDate },
		{ url: url('/about/') },
		...(series.length > 0 ? [{ url: url('/series/') }] : []),
		...(projects.length > 0 ? [{ url: url('/projects/') }] : []),
		{ url: url('/tags/') },
		...tags.map(({ tag }) => ({ url: url(`/tags/${tag}/`) })),
		...posts.map((post) => ({
			url: url(postUrl(post)),
			lastModified: post.data.updatedDate ?? post.data.pubDate,
		})),
	];
}
