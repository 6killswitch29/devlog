'use client';

import { usePathname } from 'next/navigation';

export interface NavItem {
	href: string;
	label: string;
	count?: number;
}

/** 사이드바 주 메뉴. 활성 항목은 좌측 바 + 볼드로 표시한다. */
export default function SidebarNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();

	return (
		<nav aria-label="주 메뉴">
			<ul className="flex flex-col gap-1">
				{items.map((item) => {
					const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
					return (
						<li key={item.href}>
							<a
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={`flex items-baseline gap-1.5 border-l-2 py-0.5 pl-3 hover:no-underline ${
									active
										? 'border-fg font-bold text-fg'
										: 'border-transparent text-fg-muted hover:border-border hover:text-fg'
								}`}
							>
								<span>{item.label}</span>
								{item.count !== undefined && <span className="text-[0.75rem] text-fg-muted">{item.count}</span>}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
