/** 편집기 폼 값. 클라이언트와 서버가 같이 쓰므로 의존성이 없어야 한다. */
export interface PostForm {
	slug: string;
	title: string;
	description: string;
	pubDate: string;
	updatedDate: string;
	tags: string;
	draft: boolean;
	series: string;
	seriesOrder: string;
	body: string;
}

function quote(value: string): string {
	// YAML에서 따옴표가 필요한 경우만 감싼다.
	if (/^[^\s#'"&*!|>%@`,{}[\]-][^:#]*$/.test(value) && !/: /.test(value)) return value;
	return `'${value.replace(/'/g, "''")}'`;
}

/** 폼 → 파일 텍스트. 필드 순서를 손으로 쓴 글과 똑같이 맞춘다. */
export function toFileText(form: PostForm): string {
	const lines = [
		'---',
		`title: ${quote(form.title)}`,
		`description: ${quote(form.description)}`,
		`pubDate: ${form.pubDate}`,
	];
	if (form.updatedDate) lines.push(`updatedDate: ${form.updatedDate}`);

	const tags = form.tags
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
	lines.push('tags:');
	for (const tag of tags) lines.push(`  - ${quote(tag)}`);

	if (form.draft) lines.push('draft: true');
	if (form.series) lines.push(`series: ${quote(form.series)}`);
	if (form.seriesOrder) lines.push(`seriesOrder: ${form.seriesOrder}`);
	lines.push('---', '');

	return `${lines.join('\n')}\n${form.body.replace(/\s*$/, '')}\n`;
}

/** 파일명 규약: YYYY-MM-DD-영문소문자-하이픈 */
export function isValidSlug(slug: string): boolean {
	return /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
