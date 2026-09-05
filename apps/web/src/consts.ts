// 사이트 전역 상수. 어디서든 import해서 쓴다.

export const SITE_TITLE = 'devlog';
export const SITE_DESCRIPTION = '김용현의 개발일지 — 배운 것, 만든 것, 삽질한 것';
export const AUTHOR = '김용현';

/** sitemap·RSS·canonical에 쓰는 절대 URL. 프로덕션 도메인과 같아야 한다. */
export const SITE_URL = 'https://devlog-hazel-three.vercel.app';

/** 사이드바 프로필. 비어 있는 값은 렌더하지 않는다. */
export const PROFILE = {
	// TODO: 한 줄 역할. 예: 'backend / systems'
	role: '',
};

// TODO: 실제 URL로 채운다. 빈 문자열이면 해당 링크는 렌더하지 않는다.
export const SOCIAL = {
	github: '',
	portfolio: '', // showreel 배포 주소
	email: '',
};

/**
 * 소개 페이지 내용. 비어 있는 항목은 렌더하지 않는다.
 * TODO: stack·timeline·resume을 실제 내용으로 채운다. 상세 이력은 포트폴리오(showreel)가 담당.
 */
export const ABOUT = {
	/** 문단 단위 소개글 */
	intro: [`${AUTHOR}의 개발일지입니다. 배운 것, 만든 것, 삽질한 것을 기록합니다.`],
	/** 예: ['TypeScript', 'Rust', 'Postgres'] */
	stack: [] as string[],
	/** 예: [{ period: '2024-', label: '결제 플랫폼 · 백엔드' }] */
	timeline: [] as { period: string; label: string }[],
	/** public/ 아래 이력서 PDF 경로. 예: '/resume.pdf' */
	resume: '',
};
