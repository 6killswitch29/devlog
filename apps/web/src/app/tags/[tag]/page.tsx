import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostListView from '@/components/post/PostListView';
import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';
import { getAllTags, getPostSummaries } from '@/lib/posts';

export const dynamicParams = false;

export async function generateStaticParams() {
	const tags = await getAllTags();
	return tags.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<'/tags/[tag]'>): Promise<Metadata> {
	const { tag } = await params;
	const posts = (await getPostSummaries()).filter((post) => post.tags.includes(tag));
	return {
		title: `#${tag}`,
		description: `${tag} 태그가 붙은 글 ${posts.length}개`,
		alternates: { canonical: `/tags/${tag}/` },
	};
}

export default async function TagPage({ params }: PageProps<'/tags/[tag]'>) {
	const { tag } = await params;
	const posts = (await getPostSummaries()).filter((post) => post.tags.includes(tag));
	if (posts.length === 0) notFound();

	return (
		<Shell sidebar={<ListSidebar activeTag={tag} />}>
			<PostListView posts={posts} title={`#${tag}`} />
		</Shell>
	);
}
