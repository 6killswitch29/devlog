'use client';

import { usePathname } from 'next/navigation';

export interface NavItem {
	href: string;
	label: string;
	count?: number;
}

/**
 * 사이드바 주 메뉴. 활성 항목은 데스크톱에서 좌측 바, 모바일에서 밑줄로 표시한다.
 */
export default function SidebarNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();

	return (
		<nav aria-label="주 메뉴">
			<ul className="-mx-1 flex flex-row gap-x-1 overflow-x-auto lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible">
				{items.map((item) => {
					const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
					return (
						<li key={item.href} className="shrink-0">
							<a
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={`flex items-baseline gap-1.5 whitespace-nowrap border-b-2 px-1 py-0.5 hover:no-underline lg:border-b-0 lg:border-l-2 lg:pl-3 ${
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
