import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeShiki from '@shikijs/rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { Code, Root as MdastRoot } from 'mdast';
import type { ShikiTransformer } from 'shiki';
import { visit } from 'unist-util-visit';
import type { Post } from './posts';
import { rehypeCollectHeadings, type TocItem } from './toc';

/**
 * 글 본문을 렌더한다. Astro(Sätteri + 내장 Shiki)가 만들던 것과 같은 HTML을 목표로 한다.
 *
 * - .md는 순수 마크다운으로 파싱하고(rehype-raw로 원시 HTML 통과), .mdx만 MDX 문법을 쓴다.
 *   .md를 MDX로 파싱하면 본문의 `{`, `<` 한 글자에 빌드가 깨진다.
 * - 목차는 렌더 중에 모은다. rehype-slug가 붙인 id를 그대로 쓰므로 본문 앵커와 항상 일치한다.
 */
/**
 * remark-rehype는 코드 펜스의 meta(``` 뒤에 붙는 문자열)를 버린다.
 * @shikijs/rehype가 읽는 metastring 속성으로 넘겨준다.
 */
function remarkCodeMeta() {
	return (tree: MdastRoot) => {
		visit(tree, 'code', (node: Code) => {
			if (!node.meta) return;
			node.data = { ...node.data, hProperties: { ...(node.data?.hProperties ?? {}), metastring: node.meta } };
		});
	};
}

/**
 * ```ts title="lib/posts.ts" 처럼 적은 파일명을 <pre data-title>로 옮긴다.
 * 실제 표시는 globals.css의 .prose pre[data-title]::before가 한다.
 */
const transformerTitle: ShikiTransformer = {
	name: 'devlog:title',
	pre(node) {
		const raw = (this.options.meta as { __raw?: string } | undefined)?.__raw;
		const title = raw?.match(/title="([^"]+)"/)?.[1];
		if (title) node.properties['data-title'] = title;
	},
};

export async function renderPost(post: Post) {
	return renderMarkdown(post.body, post.format);
}

/** 본문 문자열을 렌더한다. 글 페이지와 관리자 미리보기가 같은 경로를 쓴다. */
export async function renderMarkdown(body: string, format: 'md' | 'mdx') {
	const toc: TocItem[] = [];

	const { content } = await compileMDX({
		source: body,
		options: {
			parseFrontmatter: false,
			mdxOptions: {
				format,
				remarkPlugins: [remarkGfm, remarkCodeMeta],
				remarkRehypeOptions: {
					// 각주 섹션 라벨. Astro의 satteri({ features: { gfm: { footnotes } } })와 같은 문구.
					footnoteLabel: '각주',
					footnoteBackLabel: (referenceIndex: number) => `본문 ${referenceIndex + 1}번 참조로 돌아가기`,
				},
				rehypePlugins: [
					...(format === 'md' ? [rehypeRaw] : []),
					rehypeSlug,
					[
						rehypeShiki,
						{
							// 라이트/다크 듀얼 테마. 색은 --shiki-light / --shiki-dark 변수로 나오고
							// globals.css에서 data-theme에 따라 골라 쓴다.
							themes: { light: 'github-light', dark: 'github-dark' },
							defaultColor: false,
							transformers: [transformerTitle],
						},
					],
					[rehypeCollectHeadings, { toc }],
				],
			},
		},
	});

	return { content, toc };
}
