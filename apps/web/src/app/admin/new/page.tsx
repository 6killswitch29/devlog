import PostEditor from '@/components/admin/PostEditor';
import { readSession } from '@/lib/admin/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
	const session = await readSession();
	if (!session) redirect('/admin');

	const today = new Date().toISOString().slice(0, 10);

	return (
		<PostEditor
			isNew
			initial={{
				slug: `${today}-`,
				title: '',
				description: '',
				pubDate: today,
				updatedDate: '',
				tags: '',
				draft: true,
				series: '',
				seriesOrder: '',
				body: '',
			}}
		/>
	);
}
