import ThemeToggle from '@/components/client/ThemeToggle';
import { SOCIAL } from '@/consts';

/** 사이드바 맨 아래 줄: 바깥 링크 + 테마 토글. */
export default function SidebarFooter() {
	const link = 'text-[0.75rem] tracking-wide text-fg-muted hover:text-fg hover:no-underline';

	return (
		<div className="mt-auto flex items-center gap-3 pt-6">
			{SOCIAL.github && (
				<a href={SOCIAL.github} className={link}>
					GH
				</a>
			)}
			<a href="/rss.xml" className={link}>
				RSS
			</a>
			{SOCIAL.email && (
				<a href={`mailto:${SOCIAL.email}`} className={link} aria-label="이메일">
					✉
				</a>
			)}
			<span className="ml-auto">
				<ThemeToggle />
			</span>
		</div>
	);
}
