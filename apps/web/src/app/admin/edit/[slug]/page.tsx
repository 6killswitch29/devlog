import { notFound, redirect } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';
import { ADMIN } from '@/lib/admin/config';
import { toForm } from '@/lib/admin/frontmatter';
import { getFile } from '@/lib/admin/github';
import { readSession } from '@/lib/admin/session';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: PageProps<'/admin/edit/[slug]'>) {
	const session = await readSession();
	if (!session) redirect('/admin');

	const { slug } = await params;
	try {
		const file = await getFile(session.token, `${ADMIN.postsDir}/${slug}.md`);
		return <PostEditor initial={toForm(slug, file.text)} sha={file.sha} />;
	} catch {
		notFound();
	}
}
