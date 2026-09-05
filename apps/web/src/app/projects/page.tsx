import type { Metadata } from 'next';
import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';
import { getPostSummaries } from '@/lib/posts';
import { getProjects, type Project } from '@/lib/projects';

export const metadata: Metadata = {
	title: '프로젝트',
	description: '만든 것들',
	alternates: { canonical: '/projects/' },
};

/** 스크린샷 자리. 이미지가 없으면 빗금 플레이스홀더를 둔다. */
function Shot({ project, className = '' }: { project: Project; className?: string }) {
	if (project.shot) {
		// eslint-disable-next-line @next/next/no-img-element -- 원본 크기를 모르는 정적 이미지라 <img>로 둔다
		return <img src={project.shot} alt="" loading="lazy" className={`w-full object-cover ${className}`} />;
	}
	return (
		<div
			aria-hidden="true"
			className={`w-full bg-bg-subtle ${className}`}
			style={{
				backgroundImage:
					'repeating-linear-gradient(45deg, transparent, transparent 8px, var(--border) 8px, var(--border) 9px)',
			}}
		/>
	);
}

export default async function ProjectsPage() {
	const [projects, posts] = await Promise.all([getProjects(), getPostSummaries()]);
	// 맨 앞 항목이 featured면 큰 카드로, 나머지는 2열 카드로 낸다.
	const featured = projects[0]?.featured ? projects[0] : undefined;
	const rest = featured ? projects.slice(1) : projects;

	const relatedCount = (project: Project) =>
		project.tag ? posts.filter((post) => post.tags.includes(project.tag!)).length : 0;

	const linkRow = (project: Project) => (
		<div className="flex flex-wrap gap-4 border-t border-border px-5 py-3 text-[0.9375rem]">
			{project.github && (
				<a href={project.github} className="text-fg-muted hover:text-accent">
					GitHub ↗
				</a>
			)}
			{project.demo && (
				<a href={project.demo} className="text-fg-muted hover:text-accent">
					데모 ↗
				</a>
			)}
			{project.tag && relatedCount(project) > 0 && (
				<a href={`/tags/${project.tag}/`} className="text-fg-muted hover:text-accent">
					관련 글 {relatedCount(project)}편 →
				</a>
			)}
		</div>
	);

	return (
		<Shell sidebar={<ListSidebar />}>
			<h1 className="mb-6">프로젝트</h1>

			{projects.length === 0 ? (
				<p className="text-fg-muted">아직 정리한 프로젝트가 없습니다.</p>
			) : (
				<div className="flex flex-col gap-6">
					{featured && (
						<article className="overflow-hidden rounded-[10px] border border-border">
							<Shot project={featured} className="aspect-[21/9]" />
							<div className="px-5 pt-4 pb-3">
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<h2 className="font-mono text-[1.25rem]">{featured.name}</h2>
									<p className="text-[0.8125rem] text-fg-muted">
										{featured.year}
										{featured.role && ` · ${featured.role}`}
									</p>
								</div>
								<p className="mt-2 text-[0.9375rem] text-fg-muted">{featured.summary}</p>
								{featured.stack.length > 0 && (
									<ul className="mt-3 flex flex-wrap gap-2">
										{featured.stack.map((item) => (
											<li key={item} className="rounded-[var(--radius)] border border-border px-2.5 py-0.5 text-[0.8125rem]">
												{item}
											</li>
										))}
									</ul>
								)}
							</div>
							{linkRow(featured)}
						</article>
					)}

					{rest.length > 0 && (
						<ul className="grid gap-4 sm:grid-cols-2">
							{rest.map((project) => (
								<li key={project.slug} className="overflow-hidden rounded-[10px] border border-border">
									<Shot project={project} className="aspect-[16/9]" />
									<div className="px-4 py-3">
										<h2 className="font-mono text-[1.0625rem]">{project.name}</h2>
										<p className="mt-1 text-[0.9375rem] text-fg-muted">{project.summary}</p>
										<p className="mt-2 text-[0.8125rem] text-fg-muted">
											{project.stack[0] ? `${project.stack[0]} · ` : ''}
											{project.year}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</Shell>
	);
}
