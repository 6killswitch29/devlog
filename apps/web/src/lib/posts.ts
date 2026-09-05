import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { readingMinutes } from './reading-time';
import { postSchema, type PostData } from './schema';

/** 글 원본 디렉터리. 파일명(확장자 제외)이 URL slug가 된다. */
const CONTENT_DIR = path.join(process.cwd(), 'content/blog');

export interface Post {
	/** 파일명에서 확장자를 뗀 값. Astro 콘텐츠 컬렉션의 entry.id와 같다. */
	id: string;
	data: PostData;
	/** frontmatter를 제외한 본문 */
	body: string;
	format: 'md' | 'mdx';
}

/**
 * 빌드 한 번에 파일을 여러 번 읽지 않도록 캐시한다.
 * dev에서는 캐시하지 않는다 — 글을 새로 만들거나 고쳤을 때 서버를 다시 띄우지 않아도 되게.
 */
let cache: Post[] | null = null;

function loadAll(): Post[] {
	if (cache && process.env.NODE_ENV === 'production') return cache;

	const files = fs.readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f));
	cache = files.map((file) => {
		const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
		const { data, content } = matter(raw);
		const parsed = postSchema.safeParse(data);
		if (!parsed.success) {
			throw new Error(`frontmatter가 스키마와 맞지 않습니다: content/blog/${file}\n${parsed.error.message}`);
		}
		return {
			id: file.replace(/\.mdx?$/, ''),
			data: parsed.data,
			body: content,
			format: file.endsWith('.mdx') ? ('mdx' as const) : ('md' as const),
		};
	});
	return cache;
}

/** 초안을 보여줄지. 개발 서버에서만 보인다(Astro의 import.meta.env.DEV와 같은 역할). */
function showDrafts(): boolean {
	return process.env.NODE_ENV !== 'production';
}

/** 공개 글 목록. dev에서는 draft도 포함, 빌드에서는 제외. pubDate 내림차순. */
export async function getPosts(): Promise<Post[]> {
	return loadAll()
		.filter((post) => showDrafts() || !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getPost(id: string): Promise<Post | undefined> {
	return (await getPosts()).find((post) => post.id === id);
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

/**
 * 같은 시리즈의 글을 연재 순서로. seriesOrder가 있으면 그 값이 우선이고,
 * 없는 글은 뒤로 밀린 뒤 pubDate 오름차순으로 정렬된다.
 */
export async function getSeries(name: string): Promise<Post[]> {
	const posts = await getPosts();
	return posts
		.filter((post) => post.data.series === name)
		.sort(
			(a, b) =>
				(a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER) ||
				a.data.pubDate.valueOf() - b.data.pubDate.valueOf(),
		);
}

/** 시리즈 이름 → 글 수. 사이드바 네비의 개수 배지에 쓴다. */
export async function getAllSeries(): Promise<{ name: string; count: number }[]> {
	const posts = await getPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		if (post.data.series) counts.set(post.data.series, (counts.get(post.data.series) ?? 0) + 1);
	}
	return [...counts]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}

export function postUrl(post: Post): string {
	return `/blog/${post.id}/`;
}

/** 목록·카드에서 쓰는 직렬화 가능한 요약. 클라이언트 컴포넌트로 넘길 수 있다. */
export interface PostSummary {
	id: string;
	url: string;
	title: string;
	description: string;
	/** YYYY-MM-DD */
	date: string;
	minutes: number;
	tags: string[];
	draft: boolean;
	series?: { name: string; index: number; total: number };
}

/** 최신순 요약 목록. 시리즈 배지(2/5)를 위해 시리즈별 순번을 미리 계산해 둔다. */
export async function getPostSummaries(): Promise<PostSummary[]> {
	const posts = await getPosts();

	const seriesIndex = new Map<string, { index: number; total: number }>();
	const names = new Set(posts.map((p) => p.data.series).filter((n): n is string => Boolean(n)));
	for (const name of names) {
		const ordered = await getSeries(name);
		ordered.forEach((post, i) => seriesIndex.set(post.id, { index: i + 1, total: ordered.length }));
	}

	return posts.map((post) => ({
		id: post.id,
		url: postUrl(post),
		title: post.data.title,
		description: post.data.description,
		date: post.data.pubDate.toISOString().slice(0, 10),
		minutes: readingMinutes(post.body),
		tags: post.data.tags,
		draft: post.data.draft,
		series: post.data.series ? { name: post.data.series, ...seriesIndex.get(post.id)! } : undefined,
	}));
}
