/**
 * 읽는 데 걸리는 시간(분). 목록과 글 머리에 "N분"으로 나온다.
 *
 * 한국어 기술 글 기준 분당 500자로 잡는다. 코드 블록은 읽는 속도가 다르고
 * 길이도 들쭉날쭉해서 본문 글자 수에서 뺀 뒤, 블록당 15초를 따로 더한다.
 */
export function readingMinutes(body: string): number {
	const codeBlocks = body.match(/^```[\s\S]*?^```/gm) ?? [];
	const prose = body
		.replace(/^```[\s\S]*?^```/gm, '')
		.replace(/`[^`\n]*`/g, '')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크·이미지는 표시 텍스트만
		.replace(/[#>*_~|-]/g, '');

	const chars = prose.replace(/\s/g, '').length;
	const seconds = (chars / 500) * 60 + codeBlocks.length * 15;
	return Math.max(1, Math.round(seconds / 60));
}
