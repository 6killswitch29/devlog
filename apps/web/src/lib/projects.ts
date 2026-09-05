import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * 프로젝트 카드 데이터. content/projects/<slug>.md의 frontmatter만 읽는다.
 * 본문은 지금 쓰지 않는다(카드에는 summary만 나온다).
 */
export const projectSchema = z.object({
	name: z.string(),
	summary: z.string(),
	year: z.number().int(),
	/** 예: '개인', '팀 4명' */
	role: z.string().optional(),
	stack: z.array(z.string()).default([]),
	github: z.url().optional(),
	demo: z.url().optional(),
	/** 관련 글을 묶는 태그. 있으면 카드에 "관련 글 N편 →"이 붙는다. */
	tag: z.string().optional(),
	/** public/ 아래 스크린샷 경로. 예: '/projects/litequeue.png' */
	shot: z.string().optional(),
	/** 맨 위 큰 카드로 낼지 */
	featured: z.boolean().default(false),
});

export type ProjectData = z.infer<typeof projectSchema>;
export interface Project extends ProjectData {
	slug: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content/projects');

/** featured 먼저, 그다음 연도 내림차순. 디렉터리가 없으면 빈 배열. */
export async function getProjects(): Promise<Project[]> {
	if (!fs.existsSync(CONTENT_DIR)) return [];

	const files = fs.readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f));
	const projects = files.map((file) => {
		const { data } = matter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
		const parsed = projectSchema.safeParse(data);
		if (!parsed.success) {
			throw new Error(`frontmatter가 스키마와 맞지 않습니다: content/projects/${file}\n${parsed.error.message}`);
		}
		return { slug: file.replace(/\.mdx?$/, ''), ...parsed.data };
	});

	return projects.sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year);
}
