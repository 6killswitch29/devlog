import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** 공개 글 목록. dev에서는 draft도 포함, 빌드에서는 제외. pubDate 내림차순. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 태그 → 글 수. 글 수 내림차순, 같으면 가나다순. */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
	const posts = await getPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return [...counts]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'));
}

/** 같은 시리즈의 글을 pubDate 오름차순(연재 순서)으로. */
export async function getSeries(name: string): Promise<Post[]> {
	const posts = await getPosts();
	return posts.filter((p) => p.data.series === name).reverse();
}

export function postUrl(post: Post): string {
	return `/blog/${post.id}/`;
}
