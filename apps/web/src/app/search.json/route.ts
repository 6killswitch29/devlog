import { getPostSummaries } from '@/lib/posts';

// 빌드 타임에 만들어 두는 검색 인덱스. ⌘K 오버레이가 처음 열릴 때 한 번 받아간다.
export const dynamic = 'force-static';

export async function GET() {
	const posts = await getPostSummaries();
	const index = posts.map(({ url, title, description, tags, date }) => ({ url, title, description, tags, date }));

	return Response.json(index);
}
