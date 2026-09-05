import ListSidebar from '@/components/ui/ListSidebar';
import PostListView from '@/components/post/PostListView';
import Shell from '@/components/ui/Shell';
import { getPostSummaries } from '@/lib/posts';

export default async function HomePage() {
	const posts = await getPostSummaries();

	return (
		<Shell sidebar={<ListSidebar />}>
			<PostListView posts={posts} />
		</Shell>
	);
}
