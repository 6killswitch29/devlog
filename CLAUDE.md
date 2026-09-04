# devlog — 개발일지 블로그

@AGENTS.md

## 프로젝트 목적

김용현의 개발일지(학습 기록, 트러블슈팅, 프로젝트 회고)를 쌓는 정적 블로그.
글이 주인공이므로 디자인은 단순하게, 읽기 편하게 유지한다.

## 스택

- Astro 7 + MDX (`@astrojs/mdx`), RSS (`@astrojs/rss`), sitemap (`@astrojs/sitemap`)
- 마크다운 처리기: Astro 7 기본인 Sätteri (`@astrojs/markdown-satteri`의 `satteri()`를 `markdown.processor`에 전달).
  remark/rehype 플러그인·`remarkRehype` 옵션은 **동작하지 않는다** (`@astrojs/markdown-remark`가 없음).
  각주 라벨 등은 `satteri({ features: { gfm: { footnotes: … } } })`로 설정한다.
- 폰트: `pretendard` npm 패키지 (동적 서브셋 CSS를 `global.css`에서 import)
- 타입 검사: `@astrojs/check` + `typescript` **6.x** (7.x는 `astro check`가 아직 지원하지 않는다. 올리지 말 것)
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
pnpm astro check         # 타입 검사 (@astrojs/check)
pnpm astro add <integ>   # 통합 추가 (예: tailwind, react)
```

## 구조

```
src/
├── content/blog/        # 글 본문 (.md / .mdx) — 파일명이 URL slug가 된다
├── content.config.ts    # 글 frontmatter 스키마 (zod)
├── lib/posts.ts         # getPosts(draft 필터+정렬), getAllTags, getSeries, postUrl — 목록·RSS는 반드시 이걸 쓴다
├── layouts/
│   ├── Base.astro       # 공통 셸 (head + Header + main + Footer). 모든 페이지가 이걸 감싼다
│   └── BlogPost.astro   # 글 페이지: 글 헤더 → TOC → .prose 본문 → 시리즈 → 이전/다음
├── pages/               # index(글 목록), blog/[...slug], tags/index, tags/[tag], about, rss.xml.js
├── components/          # BaseHead, Header, Footer, ThemeToggle, PostList, Tag, TableOfContents, PostNav, SeriesList, FormattedDate
├── consts.ts            # SITE_TITLE, SITE_DESCRIPTION, AUTHOR, SOCIAL(github/portfolio URL — 비어 있으면 링크 미표시)
└── styles/global.css    # 디자인 토큰 + .prose 본문 스타일 (아래 "디자인 규약")
public/og.png            # OG 기본 이미지 (sharp로 생성), favicon.svg
```

`/blog`는 `/`로 리다이렉트된다(`astro.config.mjs#redirects`). 글 URL은 `/blog/<slug>/`.

## 글 작성 규칙

- 파일명: `YYYY-MM-DD-slug.md` (예: `2026-09-04-astro-blog-setup.md`). slug는 영문 소문자·하이픈.
- frontmatter 필수: `title`, `description`, `pubDate`, `tags`(1개 이상 배열). 선택: `updatedDate`, `draft`, `series`.
  - `tags`: 영문 소문자 권장 (예: `[astro, troubleshooting]`). 태그마다 `/tags/<tag>/` 페이지가 생긴다.
  - `draft: true`: dev에서만 보이고(목록에 "초안" 표시) 빌드·RSS·sitemap에서 빠진다.
  - `series: '이름'`: 같은 이름의 글이 글 하단에 연재 순서(pubDate 오름차순)로 나열된다.
  - 히어로 이미지는 쓰지 않는다. OG 이미지는 사이트 공통 `public/og.png`.
- 본문은 한국어. 코드/식별자/명령은 원문 그대로. 본문 이미지는 `src/assets/`에 두고 상대경로로 참조.
- 스키마를 바꾸면 `src/content.config.ts`와 기존 글, 이 문서를 함께 수정한다.
- `2026-09-05-style-guide.md`는 마크다운 전 요소를 담은 **스타일 회귀 확인용 draft 글**이다. 지우지 말고,
  스타일을 바꾸면 dev에서 이 글을 열어 확인한다.

## 디자인 규약

톤은 **텍스트 중심 미니멀**. 글 목록에 이미지 없음, 본문 폭 좁게, 타이포 위주.

- **색은 `global.css`의 토큰으로만 쓴다.** 새 색을 하드코딩하지 않는다.

  | 토큰 | 라이트 | 다크 | 용도 |
  | --- | --- | --- | --- |
  | `--bg` | `#ffffff` | `#0f1115` | 페이지 배경 |
  | `--bg-subtle` | `#f5f6f8` | `#171a21` | 인라인 코드, 인용, 태그 칩 배경 |
  | `--fg` | `#1a1a1a` | `#e6e6e6` | 본문 |
  | `--fg-muted` | `#6b7280` | `#9aa3b2` | 날짜, 보조 텍스트 |
  | `--border` | `#e5e7eb` | `#2a2f3a` | 구분선, 표 |
  | `--accent` | `#2f6feb` | `#7aa2f7` | 링크, 활성 네비, 인용 좌측선 |

- **다크 모드**: `<html data-theme="light|dark">`가 단일 진실. `BaseHead.astro`의 인라인 스크립트가 렌더 전에
  `localStorage.theme` → 없으면 시스템 설정 순으로 세팅하고, `ThemeToggle.astro`가 바꾼다.
  다크 전용 스타일은 `:root[data-theme='dark']` 셀렉터로 쓴다 (`prefers-color-scheme` 미디어 쿼리 금지).
- **폰트**: 본문 `--font-sans` = Pretendard Variable(npm `pretendard` 동적 서브셋을 `global.css`에서 import, 셀프호스팅).
  코드 `--font-mono` = 시스템 모노 스택. 웹폰트를 더 추가하지 않는다.
- **타이포**: 본문 17px / line-height 1.75, `word-break: keep-all`. h1 1.75rem, h2 1.375rem, h3 1.125rem.
- **폭·간격**: 본문 최대 폭 `--measure`(42rem). 헤더·본문·푸터 모두 `.container`로 같은 폭. 간격은 `--space-1`~`--space-6`.
- **마크다운 본문 스타일은 `.prose` 아래에만** 둔다. 목록·태그 페이지에는 적용되지 않는다.
- **코드 블록**: 내장 Shiki 듀얼 테마(`github-light`/`github-dark`, `defaultColor: false`). 테마 색은
  `--shiki-light`/`--shiki-dark` 변수로 나오고 `global.css`가 `data-theme`에 따라 고른다. 복사 버튼은
  `BlogPost.astro`의 스크립트가 주입.
- **목차**: h2·h3만. 1100px 이상은 본문 오른쪽 sticky, 그 아래는 본문 위 `<details>` 접힘.
- **날짜 표기**: `YYYY-MM-DD` (`FormattedDate.astro`). 파일명 규약과 동일.
- 스타일링은 순수 CSS + Astro scoped `<style>`. Tailwind 등 CSS 프레임워크를 넣지 않는다.

## 할 일 / 결정 필요

- [ ] `astro.config.mjs`의 `site`를 실제 도메인으로 교체 (현재 `https://example.com`) — sitemap/RSS 링크에 쓰인다.
- [ ] 배포 대상 결정: Vercel / Cloudflare Pages / GitHub Pages (모두 `pnpm build` 산출물 `dist/`를 그대로 올리면 된다).
- [x] `tags` 필드 + 태그별 목록 페이지.
- [x] 코드 하이라이트 테마, 다크 모드.
- [ ] `src/consts.ts`의 `SOCIAL.github`, `SOCIAL.portfolio` URL 채우기 (비어 있으면 링크가 안 나온다).
- [ ] `src/pages/about.astro`를 실제 소개로 교체 (상세 이력은 showreel 프로젝트가 담당).
- [ ] 글이 50개를 넘으면 홈 목록 페이지네이션.

## 하지 말 것

- 이 프로젝트에 React/애니메이션 라이브러리를 넣지 않는다 (포트폴리오 사이트 `../showreel`의 역할).
- Tailwind 등 CSS 프레임워크, 추가 웹폰트를 넣지 않는다. 색은 `global.css` 토큰으로만.
- `typescript`를 7.x로 올리지 않는다 (`astro check`가 깨진다).
- `remarkPlugins`/`rehypePlugins`/`remarkRehype`를 `astro.config.mjs`에 넣지 않는다 (Sätteri에서는 무시되고 설정 오류가 난다).
- `AGENTS.md`는 Astro가 관리하는 파일이므로 직접 수정하지 않는다.
