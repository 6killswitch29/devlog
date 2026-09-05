import { NextResponse } from 'next/server';
import { ADMIN } from '@/lib/admin/config';
import { validate } from '@/lib/admin/frontmatter';
import { isValidSlug } from '@/lib/admin/post-file';
import { putFile } from '@/lib/admin/github';
import { readSession } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

/** 글 저장 = 저장소에 커밋. 커밋되면 Vercel이 다시 빌드한다. */
export async function POST(request: Request) {
	const session = await readSession();
	if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

	const { slug, text, sha, isNew } = (await request.json()) as {
		slug?: string;
		text?: string;
		sha?: string;
		isNew?: boolean;
	};

	if (!slug || !isValidSlug(slug)) {
		return NextResponse.json({ error: '파일명은 YYYY-MM-DD-slug 형식이어야 합니다.' }, { status: 400 });
	}
	if (typeof text !== 'string' || !text.trim()) {
		return NextResponse.json({ error: '내용이 비어 있습니다.' }, { status: 400 });
	}

	const checked = validate(text);
	if (!checked.ok) return NextResponse.json({ error: `frontmatter 오류 — ${checked.message}` }, { status: 400 });

	try {
		const result = await putFile(
			session.token,
			`${ADMIN.postsDir}/${slug}.md`,
			text,
			`${isNew ? '새 글' : '글 수정'}: ${slug}`,
			isNew ? undefined : sha,
		);
		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : '저장 실패';
		// 다른 곳(로컬 편집·다른 창)에서 먼저 고쳤을 때
		if (/409|does not match/i.test(message)) {
			return NextResponse.json(
				{ error: '이 글이 다른 곳에서 먼저 수정되었습니다. 새로고침해서 최신 내용을 받은 뒤 다시 저장하세요.' },
				{ status: 409 },
			);
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
