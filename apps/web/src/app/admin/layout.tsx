import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: '관리',
	robots: { index: false, follow: false },
};

/** 편집기는 사이트 셸(사이드바) 없이 넓게 쓴다. */
export default function AdminLayout({ children }: { children: ReactNode }) {
	return <div className="mx-auto w-full max-w-[72rem] px-5 py-8">{children}</div>;
}
