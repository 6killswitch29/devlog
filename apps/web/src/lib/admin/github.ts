import { ADMIN } from './config';

const API = 'https://api.github.com';

async function gh(token: string, path: string, init?: RequestInit) {
	const res = await fetch(`${API}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			...(init?.body ? { 'Content-Type': 'application/json' } : {}),
			...init?.headers,
		},
		cache: 'no-store',
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`GitHub API ${res.status}: ${body.slice(0, 300)}`);
	}
	return res.json();
}

export interface RepoFile {
	name: string;
	path: string;
	sha: string;
}

/** 글 디렉터리의 .md/.mdx 파일 목록. 최신 파일명이 위로. */
export async function listPosts(token: string): Promise<RepoFile[]> {
	const items = (await gh(
		token,
		`/repos/${ADMIN.owner}/${ADMIN.repo}/contents/${ADMIN.postsDir}?ref=${ADMIN.branch}`,
	)) as { name: string; path: string; sha: string; type: string }[];

	return items
		.filter((item) => item.type === 'file' && /\.mdx?$/.test(item.name))
		.map(({ name, path, sha }) => ({ name, path, sha }))
		.sort((a, b) => b.name.localeCompare(a.name));
}

/** 파일 하나를 읽는다. sha는 저장할 때 그대로 돌려줘야 덮어쓰기 충돌을 막는다. */
export async function getFile(token: string, path: string): Promise<{ text: string; sha: string }> {
	const data = (await gh(token, `/repos/${ADMIN.owner}/${ADMIN.repo}/contents/${path}?ref=${ADMIN.branch}`)) as {
		content: string;
		encoding: string;
		sha: string;
	};
	if (data.encoding !== 'base64') throw new Error(`예상 못 한 인코딩: ${data.encoding}`);
	return { text: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
}

/**
 * 파일을 쓰고 커밋한다. sha가 없으면 새 파일, 있으면 수정.
 * 커밋은 로그인한 사용자의 토큰으로 하므로 본인 이름으로 남는다.
 */
export async function putFile(
	token: string,
	path: string,
	text: string,
	message: string,
	sha?: string,
): Promise<{ commitUrl: string; sha: string }> {
	const data = (await gh(token, `/repos/${ADMIN.owner}/${ADMIN.repo}/contents/${path}`, {
		method: 'PUT',
		body: JSON.stringify({
			message,
			content: Buffer.from(text, 'utf8').toString('base64'),
			branch: ADMIN.branch,
			...(sha ? { sha } : {}),
		}),
	})) as { commit: { html_url: string }; content: { sha: string } };

	return { commitUrl: data.commit.html_url, sha: data.content.sha };
}

/** 로그인한 GitHub 사용자 확인 */
export async function getViewer(token: string): Promise<{ login: string }> {
	return (await gh(token, '/user')) as { login: string };
}
