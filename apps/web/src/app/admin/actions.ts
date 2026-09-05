'use server';

import type { ReactNode } from 'react';
import matter from 'gray-matter';
import { renderMarkdown } from '@/lib/mdx';
import { readSession } from '@/lib/admin/session';

/**
 * 미리보기. 배포와 **같은 파이프라인**으로 렌더한 결과를 그대로 돌려준다.
 * (HTML 문자열로 만들지 않고 RSC 엘리먼트를 넘기므로 렌더러가 한 벌만 존재한다)
 */
export async function previewAction(text: string): Promise<{ node?: ReactNode; error?: string }> {
	const session = await readSession();
	if (!session) return { error: '로그인이 필요합니다.' };

	try {
		const { content } = matter(text.startsWith('---') ? text : `---\n---\n${text}`);
		const { content: node } = await renderMarkdown(content, 'md');
		return { node };
	} catch (error) {
		return { error: error instanceof Error ? error.message : '렌더 실패' };
	}
}
