import { z } from 'zod';

/**
 * 글 frontmatter 스키마. Astro의 src/content.config.ts를 그대로 옮긴 것에
 * seriesOrder만 추가했다. 필드를 바꾸면 CLAUDE.md의 "글 작성 규칙"도 같이 고친다.
 */
export const postSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	/** 최소 1개. 태그별 페이지(/tags/[tag])가 생성된다. */
	tags: z.array(z.string()).min(1),
	/** true면 개발 서버에서만 보이고 빌드·RSS·sitemap에서 제외된다. */
	draft: z.boolean().default(false),
	/** 같은 시리즈 글은 사이드바와 글 하단에 연재 순서로 나열된다. */
	series: z.string().optional(),
	/** 시리즈 안에서의 순서(1부터). 없으면 pubDate 오름차순으로 밀린다. */
	seriesOrder: z.number().int().positive().optional(),
});

export type PostData = z.infer<typeof postSchema>;
