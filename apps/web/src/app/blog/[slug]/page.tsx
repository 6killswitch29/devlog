import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CopyButtons from '@/components/client/CopyButtons';
import ReadingProgress from '@/components/client/ReadingProgress';
import PostNav from '@/components/post/PostNav';
import SeriesNav from '@/components/post/SeriesNav';
import Toc from '@/components/post/Toc';
import Shell from '@/components/ui/Shell';
import SidebarFooter from '@/components/ui/SidebarFooter';
import { renderPost } from '@/lib/mdx';
import { SITE_TITLE } from '@/consts';
import { getPost, getPostSummaries, getPosts, postUrl } from '@/lib/posts';
import { readingMinutes } from '@/lib/reading-time';

// 목록에 없는 slug는 404. 글은 전부 빌드 타임에 생성된다.
export const dynamicParams = false;

export async function generateStaticParams() {
	const posts = await getPosts();
	return posts.map((post) => ({ slug: post.id }));
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPost(slug);
	if (!post) return {};

	const { title, description, pubDate, updatedDate, tags } = post.data;
	return {
		title,
		description,
		alternates: { canonical: postUrl(post) },
		openGraph: {
			type: 'article',
			title: `${title} · ${SITE_TITLE}`,
			description,
			url: postUrl(post),
			publishedTime: pubDate.toISOString(),
			modifiedTime: updatedDate?.toISOString(),
			tags,
			images: ['/og.png'],
		},
	};
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
	const { slug } = await params;
	const post = await getPost(slug);
	if (!post) notFound();

	const { content, toc } = await renderPost(post);
	const summaries = await getPostSummaries();
	const index = summaries.findIndex((s) => s.id === post.id);
	const seriesPosts = post.data.series ? summaries.filter((s) => s.series?.name === post.data.series) : [];

	return (
		<>
			<ReadingProgress />
			<Shell
				sidebar={
					<>
						<a href="/" className="text-[0.875rem] text-fg-muted hover:text-fg hover:no-underline">
							← 글 목록
						</a>
						<Toc items={toc} />
						{post.data.series && (
							<SeriesNav
								name={post.data.series}
								posts={[...seriesPosts].sort((a, b) => (a.series!.index ?? 0) - (b.series!.index ?? 0))}
								currentId={post.id}
							/>
						)}
						<SidebarFooter />
					</>
				}
			>
				<article className="max-w-measure">
					<header className="mb-6">
						<p className="mb-2 flex flex-wrap items-center gap-2 text-[0.8125rem] text-fg-muted">
							<time dateTime={post.data.pubDate.toISOString().slice(0, 10)}>
								{post.data.pubDate.toISOString().slice(0, 10).replaceAll('-', '.')}
							</time>
							<span>·</span>
							<span>{readingMinutes(post.body)}분 읽기</span>
							{post.data.updatedDate && (
								<span>· 수정 {post.data.updatedDate.toISOString().slice(0, 10).replaceAll('-', '.')}</span>
							)}
							{post.data.draft && (
								<span className="rounded border border-dashed border-fg-muted px-1.5 text-[0.6875rem]">초안</span>
							)}
						</p>
						<h1 className="mb-3">{post.data.title}</h1>
						<ul className="flex flex-wrap gap-1.5">
							{post.data.tags.map((tag) => (
								<li key={tag}>
									<a
										href={`/tags/${tag}/`}
										className="inline-block rounded-full border border-border px-2.5 py-0.5 text-[0.8125rem] text-fg-muted hover:border-accent hover:text-accent hover:no-underline"
									>
										#{tag}
									</a>
								</li>
							))}
						</ul>
					</header>

					<div className="prose">{content}</div>
					<CopyButtons />

					<PostNav older={summaries[index + 1]} newer={summaries[index - 1]} />
				</article>
			</Shell>
		</>
	);
}
