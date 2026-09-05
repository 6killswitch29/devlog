import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeShiki from '@shikijs/rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { Post } from './posts';
import { rehypeCollectHeadings, type TocItem } from './toc';

/**
 * 글 본문을 렌더한다. Astro(Sätteri + 내장 Shiki)가 만들던 것과 같은 HTML을 목표로 한다.
 *
 * - .md는 순수 마크다운으로 파싱하고(rehype-raw로 원시 HTML 통과), .mdx만 MDX 문법을 쓴다.
 *   .md를 MDX로 파싱하면 본문의 `{`, `<` 한 글자에 빌드가 깨진다.
 * - 목차는 렌더 중에 모은다. rehype-slug가 붙인 id를 그대로 쓰므로 본문 앵커와 항상 일치한다.
 */
export async function renderPost(post: Post) {
	const toc: TocItem[] = [];

	const { content } = await compileMDX({
		source: post.body,
		options: {
			parseFrontmatter: false,
			mdxOptions: {
				format: post.format,
				remarkPlugins: [remarkGfm],
				remarkRehypeOptions: {
					// 각주 섹션 라벨. Astro의 satteri({ features: { gfm: { footnotes } } })와 같은 문구.
					footnoteLabel: '각주',
					footnoteBackLabel: (referenceIndex: number) => `본문 ${referenceIndex + 1}번 참조로 돌아가기`,
				},
				rehypePlugins: [
					...(post.format === 'md' ? [rehypeRaw] : []),
					rehypeSlug,
					[
						rehypeShiki,
						{
							// 라이트/다크 듀얼 테마. 색은 --shiki-light / --shiki-dark 변수로 나오고
							// globals.css에서 data-theme에 따라 골라 쓴다.
							themes: { light: 'github-light', dark: 'github-dark' },
							defaultColor: false,
						},
					],
					[rehypeCollectHeadings, { toc }],
				],
			},
		},
	});

	return { content, toc };
}
