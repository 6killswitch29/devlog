// 사이트 전역 상수. 어디서든 import해서 쓴다.

export const SITE_TITLE = 'devlog';
export const SITE_DESCRIPTION = '김용현의 개발일지 — 배운 것, 만든 것, 삽질한 것';
export const AUTHOR = '김용현';

/** sitemap·RSS·canonical에 쓰는 절대 URL. 프로덕션 도메인과 같아야 한다. */
export const SITE_URL = 'https://devlog-hazel-three.vercel.app';

/** 사이드바 프로필. 비어 있는 값은 렌더하지 않는다. */
export const PROFILE = {
	role: 'Full stack',
};

// 빈 문자열이면 해당 링크는 렌더하지 않는다.
export const SOCIAL = {
	github: 'https://github.com/6killswitch29',
	portfolio: '', // TODO: showreel 배포 후 주소를 넣는다
	email: 'aaron.kim@gmail.com',
};

/**
 * 소개 페이지 내용. 비어 있는 항목은 렌더하지 않는다.
 * TODO: timeline(연도별 이력)을 채우면 소개 페이지에 타임라인 섹션이 생긴다.
 */
export const ABOUT = {
	/** 문단 단위 소개글 */
	intro: [
		'Google Workspace 보안 도메인의 B2B SaaS에서 2년 10개월간 일한 백엔드 중심 풀스택 개발자입니다.',
		'멀티테넌트 보안 운영 플랫폼을 빈 저장소에서 시작해 요구사항·DB 설계·백엔드·인프라·운영까지 단독으로 만들고 30개 이상 고객 도메인을 관제하는 서비스로 키웠습니다.',
		'문제가 생기면 먼저 측정 수단을 만들어 원인을 확인하고, 재발은 사람의 주의가 아니라 DB 제약·점진 롤아웃 같은 구조로 막는 편입니다.',
		'직접 만든 코드의 결함도 검수 단계에서 찾아내 근거를 문서로 남기고 고쳐온 만큼, 운영 중인 시스템을 깨지 않고 바꾸는 일에 익숙합니다.',
		'최근에는 Google ADK 기반 에이전트를 단독으로 구축했고, 쓰기 동작에 확인 단계를 강제하는 등 보안 관점을 AI 기능에도 그대로 적용하고 있습니다.',
	],
	/** 소개 페이지 STACK 섹션 */
	stack: [
		'TypeScript',
		'JavaScript',
		'Node.js',
		'React.js',
		'Angular',
		'Java',
		'Spring Boot',
		'Spring',
		'MySQL',
		'GCP',
		'Git',
		'HTML',
		'CSS',
	],
	/** 예: [{ period: '2024-', label: '결제 플랫폼 · 백엔드' }] */
	timeline: [] as { period: string; label: string }[],
	/** public/ 아래 이력서 PDF 경로. 예: '/resume.pdf' */
	resume: '',
};
