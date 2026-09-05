import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

export interface TocItem {
	depth: 2 | 3;
	slug: string;
	text: string;
}

/** 제목 노드 안의 텍스트만 뽑는다(인라인 코드·강조 포함). */
function toText(node: Element): string {
	let out = '';
	visit(node, 'text', (text) => {
		out += text.value;
	});
	return out.trim();
}

/**
 * 렌더 파이프라인에서 h2·h3를 모아 목차로 넘긴다.
 * rehype-slug 뒤에 두어야 실제 <h2 id>와 같은 slug가 잡힌다.
 * 각주 섹션 제목(footnote-label)은 목차에서 뺀다 — Astro판 TableOfContents와 같은 규칙.
 */
export function rehypeCollectHeadings({ toc }: { toc: TocItem[] }) {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
			const slug = typeof node.properties?.id === 'string' ? node.properties.id : '';
			if (!slug || slug === 'footnote-label') return;
			toc.push({ depth: node.tagName === 'h2' ? 2 : 3, slug, text: toText(node) });
		});
	};
}
