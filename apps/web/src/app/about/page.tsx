import type { Metadata } from 'next';
import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';
import { ABOUT, AUTHOR, SOCIAL } from '@/consts';

export const metadata: Metadata = {
	title: '소개',
	description: `${AUTHOR}의 개발일지 소개`,
	alternates: { canonical: '/about/' },
};

export default function AboutPage() {
	const button =
		'inline-flex h-10 items-center rounded-[var(--radius)] border border-border px-5 text-[0.9375rem] font-medium text-fg hover:border-accent hover:text-accent hover:no-underline';

	return (
		<Shell sidebar={<ListSidebar />}>
			<div className="max-w-measure">
				<h1 className="mb-4">소개</h1>

				{ABOUT.intro.map((paragraph) => (
					<p key={paragraph} className="mb-3 leading-relaxed">
						{paragraph}
					</p>
				))}

				{ABOUT.stack.length > 0 && (
					<section className="mt-8">
						<h2 className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted">STACK</h2>
						<ul className="flex flex-wrap gap-2">
							{ABOUT.stack.map((item) => (
								<li key={item} className="rounded-[var(--radius)] border border-border px-3 py-1 text-[0.9375rem]">
									{item}
								</li>
							))}
						</ul>
					</section>
				)}

				{ABOUT.timeline.length > 0 && (
					<section className="mt-8">
						<h2 className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-fg-muted">TIMELINE</h2>
						<ul className="flex flex-col gap-2 border-l border-border pl-4">
							{ABOUT.timeline.map((row) => (
								<li key={row.period} className="flex flex-wrap gap-x-6 gap-y-1">
									<span className="w-24 shrink-0 text-[0.9375rem] tabular-nums text-fg-muted">{row.period}</span>
									<span className="font-semibold">{row.label}</span>
								</li>
							))}
						</ul>
					</section>
				)}

				{(ABOUT.resume || SOCIAL.email || SOCIAL.portfolio) && (
					<div className="mt-8 flex flex-wrap gap-3">
						{ABOUT.resume && (
							<a href={ABOUT.resume} className={`${button} border-fg bg-fg text-bg hover:bg-accent hover:text-white`}>
								이력서 PDF ↓
							</a>
						)}
						{SOCIAL.email && (
							<a href={`mailto:${SOCIAL.email}`} className={button}>
								Email
							</a>
						)}
						{SOCIAL.portfolio && (
							<a href={SOCIAL.portfolio} className={button}>
								포트폴리오
							</a>
						)}
					</div>
				)}
			</div>
		</Shell>
	);
}
