import type { Metadata } from 'next';
import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';
import TagChips from '@/components/ui/TagChips';
import { getAllTags, getPosts } from '@/lib/posts';

export const metadata: Metadata = {
	title: '태그',
	description: '태그별 글 목록',
	alternates: { canonical: '/tags/' },
};

export default async function TagsPage() {
	const [tags, posts] = await Promise.all([getAllTags(), getPosts()]);

	return (
		<Shell sidebar={<ListSidebar />}>
			<h1 className="mb-6">태그</h1>
			<TagChips tags={tags} total={posts.length} />
		</Shell>
	);
}
