import type { Metadata } from 'next';
import { AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/consts';
import ThemeToggle from '@/components/client/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
	description: SITE_DESCRIPTION,
	authors: [{ name: AUTHOR }],
	icons: { icon: '/favicon.svg' },
};

/**
 * 다크 모드: CSS가 그려지기 전에 <html data-theme>를 세팅해 깜빡임을 막는다.
 * 저장된 값이 없으면 시스템 설정을 따른다. 토글은 ThemeToggle.
 */
const themeScript = `(()=>{let t;try{t=localStorage.getItem('theme')}catch(e){}
if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="ko" data-theme="light" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body className="flex min-h-dvh flex-col">
				<div className="container flex justify-end pt-4">
					<ThemeToggle />
				</div>
				<main className="container flex-1 py-8">{children}</main>
			</body>
		</html>
	);
}
