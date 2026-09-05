import { AUTHOR, PROFILE } from '@/consts';

/** 사이드바 맨 위 프로필: 이니셜 아바타 + 이름 + 한 줄 역할. */
export default function SidebarProfile() {
	return (
		<div className="flex items-center gap-3">
			<span
				aria-hidden="true"
				className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg-subtle text-base font-extrabold text-fg-muted"
			>
				{AUTHOR.slice(0, 1)}
			</span>
			<div className="min-w-0 leading-tight">
				<a href="/" className="block text-[1.0625rem] font-bold text-fg hover:text-accent hover:no-underline">
					{AUTHOR}
				</a>
				{PROFILE.role && <p className="mt-0.5 text-[0.8125rem] text-fg-muted">{PROFILE.role}</p>}
			</div>
		</div>
	);
}
