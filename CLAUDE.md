# devlog — 개발일지 블로그

@AGENTS.md

## 프로젝트 목적

김용현의 개발일지(학습 기록, 트러블슈팅, 프로젝트 회고)를 쌓는 정적 블로그.
글이 주인공이므로 디자인은 단순하게, 읽기 편하게 유지한다.

## 스택

- **Next.js 16 (App Router) + React 19**, 전 라우트 SSG. 서버 런타임에 의존하는 기능을 넣지 않는다.
- **Tailwind CSS v4** (`@tailwindcss/postcss`). `tailwind.config.js`는 없다 — 설정은 CSS의 `@theme` / `@custom-variant`.
- 마크다운: `next-mdx-remote/rsc` + `remark-gfm` + `rehype-slug` + `rehype-raw` + `@shikijs/rehype`.
  frontmatter는 `gray-matter`, 검증은 `zod`.
- 폰트: `pretendard` npm 패키지 (동적 서브셋 CSS를 `globals.css`에서 import)
- 타입 검사: `tsc --noEmit` (TypeScript 5.x)
- 패키지 매니저: pnpm 워크스페이스 (`apps/*`)
- Node **22.12 이상 필수** (`package.json#engines`)

> 2026-09-05에 Astro 7에서 옮겨왔다. 전환 설계와 파리티 검증 기록은 `MIGRATION.md`,
> 롤백 지점은 태그 `astro-final`.

## 환경 주의사항 (중요)

이 머신은 `/usr/local/bin/node`가 Node 20이고, nvm에 Node 22가 설치되어 있다.
셸의 `node` 함수는 nvm default를 쓰지만 pnpm/npx는 PATH 순서대로 Node 20을 잡을 수 있다.
명령 실행 전에 항상 Node 22를 앞에 둔다:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
```

(또는 `nvm use 22`.)

## 자주 쓰는 명령

루트에서 실행하면 `apps/web`으로 넘어간다.

```bash
pnpm dev         # 개발 서버 http://localhost:3000
pnpm build       # 프로덕션 빌드 (전 라우트 정적 생성)
pnpm start       # 빌드 결과 서빙
pnpm typecheck   # tsc --noEmit
```

## 구조

```
apps/web/
├── content/
│   ├── blog/            # 글 본문 (.md / .mdx) — 파일명이 URL slug가 된다
│   └── projects/        # 프로젝트 카드 (frontmatter만 읽는다). 없으면 /projects 네비가 숨는다
├── public/              # og.png, favicon.svg
└── src/
    ├── app/
    │   ├── layout.tsx           # html/body + 다크모드 인라인 스크립트 + 검색 오버레이
    │   ├── page.tsx             # 홈 = 글 목록 (SCREEN 1)
    │   ├── blog/[slug]/page.tsx # 글 상세 (SCREEN 2)
    │   ├── projects/page.tsx    # 프로젝트 (SCREEN 3)
    │   ├── about/page.tsx       # 소개 (SCREEN 4)
    │   ├── series/page.tsx      # 시리즈 인덱스
    │   ├── tags/page.tsx, tags/[tag]/page.tsx
    │   ├── rss.xml/route.ts, search.json/route.ts, sitemap.ts, robots.ts
    │   ├── admin/               # 글 편집기(로그인 필요, 동적). actions.ts = 미리보기 서버 액션
    │   ├── api/admin/           # OAuth 로그인·콜백·로그아웃, 저장(커밋)
    │   ├── not-found.tsx, globals.css
    ├── components/
    │   ├── ui/       Shell SidebarProfile SidebarNav SidebarFooter TagChips ListSidebar FormattedDate
    │   ├── post/     PostListView Toc SeriesNav PostNav PostAside
    │   ├── admin/    PostEditor (마크다운 텍스트 편집 + 미리보기)
    │   └── client/   ThemeToggle SearchOverlay SearchTrigger CopyButtons ReadingProgress
    ├── lib/
    │   ├── schema.ts        글 frontmatter zod 스키마
    │   ├── posts.ts         getPosts/getPost/getAllTags/getSeries/getAllSeries/getPostSummaries/postUrl
    │   ├── projects.ts      프로젝트 스키마 + getProjects
    │   ├── mdx.ts           렌더 파이프라인(플러그인 체인, 코드블록 title)
    │   ├── admin/           config·session(JWE 쿠키)·github(Contents API)·post-file·frontmatter
    │   ├── toc.ts           h2·h3 수집 (rehype-slug가 붙인 id를 그대로 쓴다)
    │   └── reading-time.ts  분당 500자 + 코드블록당 15초
    └── consts.ts            SITE_TITLE/DESCRIPTION/URL, AUTHOR, PROFILE, SOCIAL, ABOUT
```

**목록·RSS·검색 인덱스는 반드시 `lib/posts.ts`를 쓴다.** draft 필터와 정렬이 여기 한 곳에만 있다.
`/blog`는 `/`로 리다이렉트된다. 글 URL은 `/blog/<slug>/` (URL 끝 슬래시 유지 — `trailingSlash: true`).

## 글 작성 규칙

- 파일명: `YYYY-MM-DD-slug.md` (예: `2026-09-04-astro-blog-setup.md`). slug는 영문 소문자·하이픈.
- frontmatter 필수: `title`, `description`, `pubDate`, `tags`(1개 이상 배열).
  선택: `updatedDate`, `draft`, `series`, `seriesOrder`.
  - `tags`: 영문 소문자 권장. 태그마다 `/tags/<tag>/` 페이지가 생긴다.
  - `draft: true`: dev에서만 보이고(목록에 "초안" 표시) 빌드·RSS·sitemap·검색에서 빠진다.
  - `series: '이름'` + `seriesOrder: 2`: 목록에 `SERIES 2/5` 배지가 붙고 글 사이드바에 연재 목차가 생긴다.
    `seriesOrder`가 없으면 pubDate 오름차순으로 밀린다.
  - 히어로 이미지는 쓰지 않는다. OG 이미지는 사이트 공통 `public/og.png`.
- 본문은 한국어. 코드/식별자/명령은 원문 그대로. 본문 이미지는 `public/` 아래에 두고 절대경로로 참조.
- 코드 블록에 파일명을 붙이려면 메타를 쓴다: <code>```ts title="src/lib/posts.ts"</code>
- `.md`는 순수 마크다운으로 파싱된다(본문에 `{`, `<`를 그대로 써도 안전).
  MDX 문법(컴포넌트·표현식)이 필요하면 확장자를 `.mdx`로 한다.
- 스키마를 바꾸면 `src/lib/schema.ts`와 기존 글, 이 문서를 함께 수정한다.
- `2026-09-05-style-guide.md`는 마크다운 전 요소를 담은 **스타일 회귀 확인용 draft 글**이다. 지우지 말고,
  스타일을 바꾸면 dev에서 이 글을 열어 확인한다.

## 프로젝트 카드

`content/projects/<slug>.md`의 frontmatter만 읽는다(본문은 아직 안 쓴다).

```md
---
name: litequeue
summary: SQLite 한 파일로 도는 작업 큐.
year: 2026
role: 개인            # 선택
stack: [Rust, SQLite] # 선택
github: https://...   # 선택
demo: https://...     # 선택
tag: rust             # 선택. 이 태그가 붙은 글 수로 "관련 글 N편"을 만든다
shot: /projects/litequeue.png  # 선택. 없으면 빗금 플레이스홀더
featured: true        # 맨 위 큰 카드로
---
```

## 디자인 규약

톤은 **텍스트 중심 미니멀**. 와이어프레임(`개인 개발 블로그 와이어프레임.pdf`)을 따른다.

- **2단 셸(`Shell.tsx`)**: 좌측 사이드바(17rem, 점선 세로 구분선) + 우측 본문. 전체 폭 70rem,
  글 본문은 `max-w-measure`(42rem).
  **1024px 아래에서는 사이드바가 본문 위의 가로 바**가 된다 — 프로필+검색 한 줄, 네비 가로 한 줄(활성은 밑줄),
  태그 칩 가로 스크롤 한 줄, 링크+토글 한 줄. 세로로 쌓으면 태그를 다 지나야 본문이 나온다.
  글 화면의 목차·시리즈는 모바일에서 `<details>`로 접힌다(`PostAside.tsx`).
  - 목록·프로젝트·소개 사이드바(`ListSidebar`): 프로필 → 검색 버튼(⌘K) → 네비(개수 배지) → TAGS 칩 → 하단 링크·테마 토글.
    항목이 0개인 메뉴(시리즈·프로젝트)는 내보내지 않는다.
  - 글 사이드바: `← 글 목록` → ON THIS PAGE(스크롤 스파이) → 시리즈 목차 → 하단 링크·테마 토글.
- **홈(`/`)은 글 목록**이다. 행마다 `SERIES n/m` 배지 · `YYYY.MM.DD · N분 · #태그` · 제목 · description.
  카드에 description이 그대로 노출되므로 글의 description을 한 문장으로 성실히 쓴다.
- **색은 `globals.css`의 토큰으로만 쓴다.** 새 색을 하드코딩하지 않는다.

  | 토큰 | 라이트 | 다크 | 용도 | Tailwind |
  | --- | --- | --- | --- | --- |
  | `--bg` | `#ffffff` | `#0f1115` | 페이지 배경 | `bg-bg` |
  | `--bg-subtle` | `#f5f6f8` | `#171a21` | 인라인 코드, 인용, 칩 배경 | `bg-bg-subtle` |
  | `--fg` | `#1a1a1a` | `#e6e6e6` | 본문 | `text-fg` |
  | `--fg-muted` | `#6b7280` | `#9aa3b2` | 날짜, 보조 텍스트 | `text-fg-muted` |
  | `--border` | `#e5e7eb` | `#2a2f3a` | 구분선, 표 | `border-border` |
  | `--accent` | `#2f6feb` | `#7aa2f7` | 링크, 활성 네비, 인용 좌측선 | `text-accent` |

- **CSS 레이어 규칙**: 요소 기본값은 `@layer base`(Tailwind preflight 뒤), 마크다운 본문은
  `@layer components`의 `.prose`. 그래야 유틸 클래스가 항상 이긴다.
  preflight가 목록 마커를 지우므로 `.prose`에서 `list-style`을 직접 되살려 뒀다.
- **다크 모드**: `<html data-theme="light|dark">`가 단일 진실. `layout.tsx`의 인라인 스크립트가 렌더 전에
  `localStorage.theme` → 없으면 시스템 설정 순으로 세팅하고, `ThemeToggle.tsx`가 바꾼다.
  Tailwind의 `dark:` 변형은 `@custom-variant dark`로 `[data-theme='dark']`에 물려 뒀다
  (`prefers-color-scheme` 미디어 쿼리 금지).
- **폰트**: 본문 `--font-sans` = Pretendard Variable(npm 동적 서브셋, 셀프호스팅).
  코드 `--font-mono` = 시스템 모노 스택. 웹폰트를 더 추가하지 않는다.
- **타이포**: 본문 17px / line-height 1.75, `word-break: keep-all`. h1 1.75rem, h2 1.375rem, h3 1.125rem.
- **마크다운 본문 스타일은 `.prose` 아래에만** 둔다. 목록·태그 페이지에는 적용되지 않는다.
- **컴포넌트 스타일은 Tailwind 유틸**로 쓴다. `.prose`와 토큰만 순수 CSS.
- **코드 블록**: Shiki 듀얼 테마(`github-light`/`github-dark`, `defaultColor: false`). 색은
  `--shiki-light`/`--shiki-dark` 변수로 나오고 `globals.css`가 `data-theme`에 따라 고른다.
  복사 버튼은 `CopyButtons.tsx`가 마운트 후 주입, 파일명 헤더는 `pre[data-title]::before`.
- **목차**: h2·h3만. 글 사이드바에 sticky, 스크롤 스파이로 현재 위치 표시.
- **날짜 표기**: 화면은 `YYYY.MM.DD`, 파일명 규약은 `YYYY-MM-DD`.

## 할 일 / 결정 필요

- [x] 배포 대상: **Vercel** (Root Directory `apps/web`). GitHub `main` 푸시 → 프로덕션, PR → 프리뷰.
- [x] `tags` 필드 + 태그별 목록 페이지, 코드 하이라이트 테마, 다크 모드.
- [x] Next.js 16 전환 + 와이어프레임 4개 화면.
- [ ] `src/consts.ts`의 `SOCIAL.github` / `SOCIAL.portfolio` / `SOCIAL.email`, `PROFILE.role` 채우기
      (비어 있으면 사이드바 링크가 안 나온다).
- [ ] `ABOUT.intro` / `stack` / `timeline` / `resume`를 실제 내용으로 (상세 이력은 showreel이 담당).
- [ ] `consts.ts`의 `SITE_URL`을 커스텀 도메인으로 교체할지 (현재 `devlog-hazel-three.vercel.app`).
      sitemap·RSS·canonical에 쓰이므로 프로덕션 도메인과 같아야 한다.
- [ ] 프로젝트(`content/projects/`)를 실제로 채울지, showreel과 역할을 어떻게 나눌지.
- [ ] 글이 50개를 넘으면 홈 목록 페이지네이션 + 검색 인덱스 분리.

## 글 편집기 (`/admin`)

브라우저에서 글을 쓰고 저장하면 **저장소에 커밋**된다. 마크다운을 텍스트 그대로 다루므로
파일이 우리가 쓴 그대로 남는다(코드블록 `title=`, GFM 표 포함).

- 로그인: GitHub OAuth. `ADMIN_GITHUB_LOGIN` 계정 하나만 통과한다. 세션은 암호화된 JWT 쿠키
  하나가 전부고 서버에 저장하는 것이 없다 → **DB 없음**.
- 저장: 로그인한 사용자의 토큰으로 커밋하므로 **본인 이름으로 커밋**된다. sha를 함께 보내
  다른 곳에서 먼저 고쳤으면 409로 막는다. 저장 전에 zod 스키마로 frontmatter를 검증한다.
- 미리보기: `app/admin/actions.ts`의 서버 액션이 **글 페이지와 같은 파이프라인**으로 렌더한
  RSC 엘리먼트를 돌려준다(렌더러를 두 벌 만들지 않는다).
- 환경변수 4개: `ADMIN_GITHUB_LOGIN` `ADMIN_SESSION_SECRET` `GITHUB_OAUTH_CLIENT_ID`
  `GITHUB_OAUTH_CLIENT_SECRET`. 하나라도 없으면 로그인 화면이 안내만 하고 아무것도 하지 않는다.
- GitHub OAuth App은 콜백 URL이 하나뿐이다 → 프로덕션 도메인 기준으로 등록한다.
  로컬에서 로그인까지 시험하려면 콜백이 localhost인 앱을 따로 만든다.
- 이미지 업로드는 아직 없다. `public/` 아래에 직접 넣는다.

> Keystatic 같은 git 백엔드 CMS도 검토했지만, 저장할 때 본문을 자기 방언으로 다시 써서
> (GFM 표 → `{% table %}`, 코드블록 `title=` 소실) 채택하지 않았다. 근거는 이슈 #6 참고.

## 배포 (Vercel)

- Vercel 프로젝트가 GitHub `6killswitch29/devlog`에 연결돼 있다. **Root Directory는 `apps/web`**,
  framework는 Next.js. `main`에 푸시하면 프로덕션, PR 브랜치는 프리뷰 URL이 생긴다.
- **끝 슬래시 정규화는 Vercel이 한다.** `next.config.ts`는 `trailingSlash: true`(빌드 산출물·내부 링크용)에
  `skipTrailingSlashRedirect: true`를 같이 켜 두었다. Next이 정규화를 하면 그 규칙이 **내부 리다이렉트라
  항상 맨 앞**에 붙어서 `/blog` → `/blog/` → `/`로 두 번 튄다.
  `apps/web/vercel.json`의 `redirects` 배열이 순서대로 먼저 평가되므로, 거기서 `/blog`·`/sitemap-index.xml`을
  먼저 처리하고 **맨 마지막에 정규화 규칙**(`/:path((?!_next)(?:[^/]+/)*[^/.]+)` → `/:path/`)을 둔다.
  확인 방법: `npx vercel build` 후 `.vercel/output/config.json`의 `routes` 순서를 본다.
- `next.config.ts`에도 같은 리다이렉트가 있다(vercel.json이 안 먹는 로컬 dev용).
- `.vercel/`은 커밋하지 않는다.

## 하지 말 것

- 애니메이션 라이브러리(motion 등)를 넣지 않는다 (포트폴리오 사이트 `../showreel`의 역할).
- 색을 하드코딩하지 않는다. `globals.css` 토큰과 Tailwind 유틸(`text-fg-muted` 등)로만 쓴다.
- 추가 웹폰트를 넣지 않는다. `@tailwindcss/typography`도 쓰지 않는다(한글 튜닝을 전부 다시 덮어야 한다).
- **공개 페이지(글·목록·태그·소개)는 100% 정적**을 유지한다. ISR·미들웨어·DB를 넣지 않고
  `cacheComponents`/`use cache`도 켜지 않는다. 동적인 것은 `/admin`과 `/api/admin/*`뿐이고,
  이들은 빌드 산출물에서 ƒ로 표시된다(정적 라우트가 ƒ가 되면 뭔가 잘못된 것이다).
- `.md` 글을 MDX로 파싱하도록 바꾸지 않는다 (본문의 `{`, `<` 한 글자에 빌드가 깨진다).
