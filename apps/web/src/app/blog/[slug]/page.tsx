import { notFound } from 'next/navigation';
import { renderPost } from '@/lib/mdx';
import { getPost, getPosts } from '@/lib/posts';

// 목록에 없는 slug는 404. 글은 전부 빌드 타임에 생성된다.
export const dynamicParams = false;

export async function generateStaticParams() {
	const posts = await getPosts();
	return posts.map((post) => ({ slug: post.id }));
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
	const { slug } = await params;
	const post = await getPost(slug);
	if (!post) notFound();

	const { content } = await renderPost(post);

	return (
		<article className="prose">
			<h1>{post.data.title}</h1>
			{content}
		</article>
	);
}
