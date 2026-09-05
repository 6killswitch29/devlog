import matter from 'gray-matter';
import { postSchema } from '@/lib/schema';
import type { PostForm } from './post-file';

/** 파일 텍스트 → 폼 */
export function toForm(slug: string, text: string): PostForm {
	const { data, content } = matter(text);
	const date = (value: unknown): string => {
		if (value instanceof Date) return value.toISOString().slice(0, 10);
		return typeof value === 'string' ? value.slice(0, 10) : '';
	};

	return {
		slug,
		title: typeof data.title === 'string' ? data.title : '',
		description: typeof data.description === 'string' ? data.description : '',
		pubDate: date(data.pubDate),
		updatedDate: date(data.updatedDate),
		tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
		draft: data.draft === true,
		series: typeof data.series === 'string' ? data.series : '',
		seriesOrder: typeof data.seriesOrder === 'number' ? String(data.seriesOrder) : '',
		body: content.replace(/^\n+/, ''),
	};
}

/** 저장 전에 스키마로 검증한다. 잘못된 frontmatter가 커밋되면 빌드가 깨진다. */
export function validate(text: string): { ok: true } | { ok: false; message: string } {
	const { data } = matter(text);
	const parsed = postSchema.safeParse(data);
	if (parsed.success) return { ok: true };
	const first = parsed.error.issues[0];
	return { ok: false, message: `${first.path.join('.') || 'frontmatter'}: ${first.message}` };
}
