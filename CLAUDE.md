# devlog — 개발일지 블로그

@AGENTS.md

## 프로젝트 목적

김용현의 개발일지(학습 기록, 트러블슈팅, 프로젝트 회고)를 쌓는 정적 블로그.
글이 주인공이므로 디자인은 단순하게, 읽기 편하게 유지한다.

## 스택

- Astro 7 + MDX (`@astrojs/mdx`), RSS (`@astrojs/rss`), sitemap (`@astrojs/sitemap`)
- 패키지 매니저: pnpm
- Node **22.12 이상 필수** (`package.json#engines`)

## 환경 주의사항 (중요)

이 머신은 `/usr/local/bin/node`가 Node 20이고, nvm에 Node 22가 설치되어 있다.
셸의 `node` 함수는 nvm default를 쓰지만 pnpm/npx는 PATH 순서대로 Node 20을 잡을 수 있다.
명령 실행 전에 항상 Node 22를 앞에 둔다:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
```

(또는 `nvm use 22`.) Node 20에서는 create-astro/astro가 즉시 실패한다.

## 자주 쓰는 명령

```bash
pnpm dev                 # 개발 서버 (AGENTS.md 안내대로 astro dev --background 권장)
pnpm build               # ./dist 정적 빌드
pnpm preview             # 빌드 결과 미리보기
pnpm astro add <integ>   # 통합 추가 (예: tailwind, react)
```

## 구조

```
src/
├── content/blog/        # 글 본문 (.md / .mdx) — 파일명이 URL slug가 된다
├── content.config.ts    # 글 frontmatter 스키마 (zod)
├── layouts/BlogPost.astro
├── pages/               # index, blog/[...slug], about, rss.xml.js
├── components/          # BaseHead, Header, Footer, FormattedDate ...
├── consts.ts            # SITE_TITLE, SITE_DESCRIPTION
└── styles/global.css
```

## 글 작성 규칙

- 파일명: `YYYY-MM-DD-slug.md` (예: `2026-09-04-astro-blog-setup.md`). slug는 영문 소문자·하이픈.
- frontmatter 필수: `title`, `description`, `pubDate`. 선택: `updatedDate`, `heroImage`.
- 본문은 한국어. 코드/식별자/명령은 원문 그대로.
- 스키마를 바꾸면(`tags` 추가 등) `src/content.config.ts`와 기존 글을 함께 수정한다.
- 템플릿 샘플 글(`first-post.md` 등)은 첫 실제 글을 쓸 때 삭제한다.

## 할 일 / 결정 필요

- [ ] `astro.config.mjs`의 `site`를 실제 도메인으로 교체 (현재 `https://example.com`) — sitemap/RSS 링크에 쓰인다.
- [ ] 배포 대상 결정: Vercel / Cloudflare Pages / GitHub Pages (모두 `pnpm build` 산출물 `dist/`를 그대로 올리면 된다).
- [ ] `tags` 필드 + 태그별 목록 페이지.
- [ ] 코드 하이라이트 테마, 다크 모드.
- [ ] `src/pages/about.astro`를 실제 소개로 교체 (상세 이력은 showreel 프로젝트가 담당).

## 하지 말 것

- 이 프로젝트에 React/애니메이션 라이브러리를 넣지 않는다 (포트폴리오 사이트 `../showreel`의 역할).
- `AGENTS.md`는 Astro가 관리하는 파일이므로 직접 수정하지 않는다.
