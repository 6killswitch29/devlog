import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// src/content/blog/ 아래의 Markdown / MDX. 파일명이 URL slug가 된다.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// 최소 1개. 태그별 페이지(/tags/[tag])가 생성된다.
		tags: z.array(z.string()).min(1),
		// true면 dev에서만 보이고 빌드·RSS·sitemap에서 제외된다.
		draft: z.boolean().default(false),
		// 같은 시리즈 글은 글 하단에 순서대로 나열된다.
		series: z.string().optional(),
	}),
});

export const collections = { blog };
