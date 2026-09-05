# devlog 마이그레이션 설계도 — Astro 7 → Next.js 16 + Express 5 + Tailwind CSS v4

작성일 2026-09-05 · 대상 저장소 `dev-portfolio/devlog` · 참조 `../showreel`(Next 16 선례)

> **✅ 완료 (2026-09-05, PR #5).** Phase 0~4·6·7을 실행했다. Express(§7, §9-B)는 채택하지 않았다.
> 롤백 지점은 태그 `astro-final`. 이 문서는 그때의 설계 판단과 파리티 검증 방법을 남겨 두려고 보관한다.

---

## 0. 먼저 짚을 것 — Express의 위치

솔직하게 말하면, **지금의 devlog에는 Express가 필요한 일이 하나도 없다.** 글은 git에 있는
마크다운이고, 목록·태그·RSS·sitemap은 전부 빌드 타임에 결정된다. Next.js App Router의
Route Handler(`app/api/*/route.ts`)만으로도 BFF 역할은 충분하고, Next 16 문서도 이를 권장한다.

그래도 Express를 넣는 게 합리적인 경우는 셋이다.

1. **포트폴리오 목적** — 채용 담당자에게 보여줄 백엔드 코드가 필요하다. (showreel의 목적을 생각하면 이게 가장 유력하다)
2. **Vercel Function으로 처리하기 나쁜 것** — 커넥션 풀 유지, 배치/크론, 오래 걸리는 작업.
3. **`../cofounder`와 API를 공유**할 계획이 있다.

이 문서는 **1번을 전제로** 설계한다. 즉 Express는 "Next의 서버"가 아니라
**블로그의 동적 기능만 담당하는 독립 서비스**다. Next를 Express 커스텀 서버로 감싸는 구성은
채택하지 않는다 (Vercel 배포·ISR·이미지 최적화를 전부 잃는다).

> 만약 목적이 순수하게 "블로그를 더 잘 만들기"라면 → Express를 빼고 Next Route Handler로 가는 게 맞다.
> 그 경우 이 문서에서 §7, §9-B만 빼면 나머지는 그대로 유효하다.

---

## 1. 현재 상태 인벤토리

```
Astro 7 + MDX / Sätteri 마크다운 / Shiki 듀얼 테마 / 순수 CSS(토큰 359줄) / Pretendard
정적 출력(dist) → Vercel · 글 1편(style-guide, draft) · 총 소스 ~1,640줄
```

| 현재 (Astro) | 역할 | 이관 대상 (Next) | 난이도 |
| --- | --- | --- | --- |
| `src/content.config.ts` (zod) | frontmatter 스키마 | `src/lib/schema.ts` (zod 그대로 재사용) | 낮음 |
| `src/lib/posts.ts` | getPosts/getAllTags/getSeries/postUrl | `src/lib/posts.ts` (fs + gray-matter로 로더만 교체) | **중** |
| `src/content/blog/*.md` | 글 본문 | **그대로 이동** (수정 0) | 없음 |
| `src/layouts/Base.astro` | 공통 셸 | `src/app/layout.tsx` | 낮음 |
| `src/layouts/BlogPost.astro` | 글 레이아웃 + 복사버튼 스크립트 | `app/blog/[slug]/page.tsx` + `CopyButton.tsx`(client) | 중 |
| `src/pages/index.astro` | 프로필 + 카드 그리드 | `app/page.tsx` | 낮음 |
| `src/pages/blog/[...slug].astro` | 글 상세 | `app/blog/[slug]/page.tsx` + `generateStaticParams` | 중 |
| `src/pages/tags/index.astro`, `[tag].astro` | 태그 | `app/tags/page.tsx`, `app/tags/[tag]/page.tsx` | 낮음 |
| `src/pages/about.astro` | 소개 | `app/about/page.tsx` | 없음 |
| `src/pages/rss.xml.js` (`@astrojs/rss`) | RSS | `app/rss.xml/route.ts` (직접 생성) | 중 |
| `@astrojs/sitemap` | sitemap | `app/sitemap.ts` (Next 파일 규약) | 낮음 |
| `BaseHead.astro` | head + 테마 인라인 스크립트 | `layout.tsx` metadata + `<script>` 인라인 | 중 |
| `ThemeToggle.astro` | 다크모드 토글 | `ThemeToggle.tsx` (client) | 낮음 |
| `TableOfContents.astro` | h2/h3 목차 | `lib/toc.ts` + `Toc.tsx` | **중상** |
| `PostCard/PostList/PostNav/SeriesList/Tag/FormattedDate` | 표시용 | 동명 `.tsx` (RSC, Tailwind 클래스로 재작성) | 낮음 |
| `styles/global.css` (359줄) | 토큰 + `.prose` | `app/globals.css` (`@theme inline` + `@layer`) | **중상** |
| Shiki 듀얼 테마 (Astro 내장) | 코드 하이라이트 | `@shikijs/rehype` (동일 옵션) | 중 |
| `astro.config.mjs#redirects` `/blog → /` | 리다이렉트 | `next.config.ts#redirects()` | 낮음 |

**소실 위험이 있는 것**: Astro의 `astro:content` 타입 추론, `render()`가 주는 `headings` 배열,
scoped `<style>`. 각각 §4, §4.3, §6에서 대체안을 정한다.

---

## 2. 목표 아키텍처

```
                         ┌─────────────────────────────┐
   git push (main)  ───▶ │  Vercel                     │
                         │  ┌───────────────────────┐  │
   src/content/blog/*.md │  │ Next.js 16 (App Rtr)  │  │
        ↓ 빌드 타임 읽기  │  │  · SSG: /, /blog/*,   │  │
   gray-matter + zod ────┼─▶│    /tags/*, /about    │  │
   @shikijs/rehype       │  │  · route: /rss.xml    │  │
   next-mdx-remote/rsc   │  │  · app/sitemap.ts     │  │
                         │  └───────────┬───────────┘  │
                         └──────────────┼──────────────┘
                                        │ 브라우저에서 fetch (CORS)
                                        ▼
                         ┌─────────────────────────────┐
                         │  Railway / Render / Fly     │
                         │  Express 5 + TypeScript     │
                         │  · GET/POST /v1/views/:slug │
                         │  · POST /v1/reactions       │
                         │  · GET  /v1/search?q=       │
                         │  · POST /v1/contact         │
                         │  · POST /v1/hooks/revalidate│──▶ Next revalidateTag
                         └──────────────┬──────────────┘
                                        ▼
                                  Neon Postgres
```

**렌더링 전략의 핵심 원칙**: 글 페이지는 **100% 정적**을 유지한다. 조회수·반응 같은 동적 데이터는
서버에서 가져오지 않고 **클라이언트 컴포넌트가 마운트 후 fetch**한다. 이렇게 해야
Express가 죽어도 블로그는 멀쩡하고, LCP도 지금(정적 사이트) 수준을 지킨다.

---

## 3. 저장소 구조

### 권장: devlog 단일 저장소 안에 pnpm 워크스페이스

```
devlog/
├── pnpm-workspace.yaml        # packages: ["apps/*"]
├── apps/
│   ├── web/                   # Next.js 16
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── content/blog/      # ★ 글 원본 (src 밖으로 빼서 빌드 대상과 분리)
│   │   ├── mdx-components.tsx
│   │   ├── public/{og.png,favicon.svg}
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx          globals.css
│   │       │   ├── page.tsx            (홈: 프로필 + 카드 그리드)
│   │       │   ├── about/page.tsx
│   │       │   ├── blog/[slug]/page.tsx
│   │       │   ├── tags/page.tsx
│   │       │   ├── tags/[tag]/page.tsx
│   │       │   ├── rss.xml/route.ts
│   │       │   ├── sitemap.ts          robots.ts
│   │       │   └── not-found.tsx
│   │       ├── components/
│   │       │   ├── ui/      PostCard PostList PostNav SeriesList Tag FormattedDate Header Footer
│   │       │   ├── post/    Toc CopyButton (client)
│   │       │   └── client/  ThemeToggle ViewCounter Reactions SearchBox (client)
│   │       ├── lib/
│   │       │   ├── schema.ts    zod frontmatter 스키마
│   │       │   ├── posts.ts     getPosts/getAllTags/getSeries/postUrl  ← Astro판과 시그니처 동일
│   │       │   ├── mdx.ts       compile 옵션(rehype/remark 플러그인 체인)
│   │       │   ├── toc.ts       headings 추출
│   │       │   └── api.ts       Express 클라이언트 (baseURL, 타입)
│   │       └── consts.ts
│   └── api/                   # Express 5
│       ├── src/{index.ts,app.ts,routes/,db/,middleware/}
│       ├── drizzle/           # 마이그레이션 SQL
│       └── Dockerfile
└── .github/workflows/ci.yml
```

**왜 모노레포인가**: 글 슬러그 타입, API 응답 타입을 한 곳에서 공유할 수 있고, Vercel은
Root Directory를 `apps/web`으로 지정하면 그대로 동작한다. 나중에 `packages/types`를 뽑기도 쉽다.

**대안**: `devlog`(Next) / `devlog-api`(Express) 두 저장소로 분리. 배포는 단순해지지만
타입 공유가 사라지고 커밋이 두 군데로 흩어진다. **모노레포를 권장.**

---

## 4. 콘텐츠 파이프라인 (가장 중요한 설계)

Astro는 `astro:content`가 로딩·검증·렌더·타입을 전부 해줬다. Next에는 없으므로 직접 만든다.
**메타데이터와 본문을 분리 처리**하는 게 핵심이다.

```
목록/태그/RSS/sitemap/generateStaticParams  ←  frontmatter만  ←  fs + gray-matter + zod   (빠름)
글 상세 페이지 본문                          ←  MDX 컴파일    ←  next-mdx-remote/rsc      (느림, 필요할 때만)
```

이렇게 나누면 홈 렌더링에 MDX 컴파일이 전혀 개입하지 않는다 (Astro의 `getCollection` 동작과 동일).

### 4.1 스키마 — `src/lib/schema.ts`

현재 `content.config.ts`의 zod 스키마를 **그대로** 옮긴다. 필드 변경 없음.

```ts
import { z } from 'zod'

export const postFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).min(1),
  draft: z.boolean().default(false),
  series: z.string().optional(),
})

export type PostMeta = z.infer<typeof postFrontmatter>
export type Post = { slug: string; data: PostMeta; body: string; filePath: string }
```

### 4.2 로더 — `src/lib/posts.ts`

**공개 API(함수 이름·시그니처)를 Astro판과 동일하게 유지한다.** 컴포넌트 포팅 시 로직을 안 건드리려는 의도.

```ts
import 'server-only'
import { cache } from 'react'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { postFrontmatter, type Post } from './schema'

const DIR = path.join(process.cwd(), 'content/blog')

/** 공개 글 목록. dev에서는 draft 포함, 프로덕션 빌드에서는 제외. pubDate 내림차순. */
export const getPosts = cache(async (): Promise<Post[]> => {
  const files = (await fs.readdir(DIR)).filter((f) => /\.mdx?$/.test(f))
  const posts = await Promise.all(files.map(read))
  return posts
    .filter((p) => process.env.NODE_ENV === 'development' || !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
})

async function read(file: string): Promise<Post> {
  const raw = await fs.readFile(path.join(DIR, file), 'utf8')
  const { data, content } = matter(raw)
  const parsed = postFrontmatter.safeParse(data)
  if (!parsed.success) {
    // Astro는 빌드를 실패시켰다. 동작을 맞춘다.
    throw new Error(`[posts] ${file} frontmatter 오류\n${JSON.stringify(parsed.error.issues, null, 2)}`)
  }
  return { slug: file.replace(/\.mdx?$/, ''), data: parsed.data, body: content, filePath: file }
}

export const getAllTags = cache(async () => { /* Astro판 로직 그대로 */ })
export const getSeries = cache(async (name: string) => { /* 그대로 */ })
export const postUrl = (post: Post) => `/blog/${post.slug}/`
```

- `cache()`(React)로 감싸 한 번의 렌더 패스에서 디스크를 여러 번 읽지 않게 한다.
- `import 'server-only'`로 클라이언트 번들 유입을 컴파일 타임에 차단한다.
- **주의**: `getPosts()`가 `fs`를 쓰므로 이 모듈을 import하는 컴포넌트는 전부 서버 컴포넌트여야 한다.

### 4.3 본문 렌더 — `app/blog/[slug]/page.tsx`

Next 16에서 `params`는 **Promise**다. 타입은 자동 생성되는 `PageProps<"/blog/[slug]">`를 쓴다.

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import { getPosts, getSeries } from '@/lib/posts'
import { mdxOptions } from '@/lib/mdx'
import { extractToc } from '@/lib/toc'

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const post = (await getPosts()).find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: post.data.title,
    description: post.data.description,
    openGraph: { type: 'article', publishedTime: post.data.pubDate.toISOString() },
  }
}

export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const posts = await getPosts()
  const i = posts.findIndex((p) => p.slug === slug)
  if (i === -1) notFound()
  const post = posts[i]
  const toc = extractToc(post.body)                       // h2·h3만
  const series = post.data.series ? await getSeries(post.data.series) : []

  return (
    <article>
      {/* header / toc / prose / series / nav — BlogPost.astro 구조 그대로 */}
      <div className="prose">
        <MDXRemote source={post.body} options={{ mdxOptions }} />
      </div>
    </article>
  )
}
```

### 4.4 마크다운 플러그인 체인 — `src/lib/mdx.ts`

Astro 7의 Sätteri는 **떠난다.** remark/rehype 생태계로 돌아오므로 오히려 선택지가 넓어진다.
현재 얻고 있던 동작을 1:1로 재현하는 조합:

| 현재 동작 | 대체 |
| --- | --- |
| GFM (표, 각주, 체크박스) | `remark-gfm` |
| 각주 라벨 한국어 (`label: '각주'`) | `remarkRehypeOptions: { footnoteLabel: '각주', footnoteBackLabel: '본문 {reference}번 참조로 돌아가기' }` (`@mdx-js/mdx` compile 옵션) |
| Shiki 듀얼 테마 (`--shiki-light`/`--shiki-dark`) | `@shikijs/rehype` — `{ themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }` **옵션 이름과 값이 동일**하므로 CSS를 안 고쳐도 된다 |
| 헤딩 id (목차 링크용) | `rehype-slug` |
| — (신규) 헤딩 앵커 | `rehype-autolink-headings` (선택) |

```ts
export const mdxOptions = {
  remarkPlugins: [remarkGfm],
  remarkRehypeOptions: {
    footnoteLabel: '각주',
    footnoteBackLabel: '본문 {reference}번 참조로 돌아가기',
  },
  rehypePlugins: [
    rehypeSlug,
    [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }],
  ],
}
```

### 4.5 목차(TOC) — `src/lib/toc.ts`

Astro의 `render()`가 주던 `headings: MarkdownHeading[]`가 없어진다.
**원문에서 직접 추출**한다 (MDX 컴파일 결과에 의존하지 않아 더 단순하고 빠르다).

```ts
import GithubSlugger from 'github-slugger'

export type Heading = { depth: 2 | 3; slug: string; text: string }

export function extractToc(body: string): Heading[] {
  const slugger = new GithubSlugger()   // rehype-slug와 동일한 알고리즘 → id가 일치한다
  const out: Heading[] = []
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }   // 코드블록 안의 # 무시
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue
    const text = m[2].replace(/`([^`]+)`/g, '$1')                      // 인라인 코드 백틱 제거
    out.push({ depth: m[1].length as 2 | 3, slug: slugger.slug(text), text })
  }
  return out
}
```

`rehype-slug`도 `github-slugger`를 쓰므로 **id가 정확히 일치한다.** 중복 헤딩의 `-1` 접미사까지 동일.

### 4.6 대안 검토

| 방식 | 장점 | 단점 | 판정 |
| --- | --- | --- | --- |
| **A. gray-matter + next-mdx-remote/rsc** | 목록/본문 분리, Astro 로직 그대로 이식, 의존성 적음 | 로더를 직접 쓴다 (~120줄) | **채택** |
| B. `@next/mdx` 파일 라우팅 (`app/blog/x/page.mdx`) | Next 1st party | 목록·태그·RSS를 만들려면 어차피 fs 로더 필요. 파일 이동 필요 | 기각 |
| C. Velite / Content Collections | Astro content collections와 가장 유사, zod 그대로 | 빌드 스텝 추가, 락인 | 보류 (글 50편 넘고 로더가 무거워지면 재검토) |
| D. Contentlayer | — | 사실상 미유지보수 | 기각 |
| E. 글을 Postgres로 이관 (Express가 서빙) | "진짜 백엔드"처럼 보임 | git으로 글 쓰는 워크플로 상실, SSG 불가, 백업 부담 | **강하게 기각** |

---

## 5. 라우트 매핑 — URL 파리티

**현재 URL을 하나도 바꾸지 않는다.** RSS 구독자·검색엔진 색인이 이미 존재한다(Vercel 배포됨).

| URL | Astro | Next 16 | 비고 |
| --- | --- | --- | --- |
| `/` | `pages/index.astro` | `app/page.tsx` | 정적 |
| `/blog/<slug>/` | `pages/blog/[...slug].astro` | `app/blog/[slug]/page.tsx` + `generateStaticParams` | `[...slug]`(rest) → `[slug]`로 축소. 현재 글이 전부 1depth |
| `/blog` → `/` | `astro.config#redirects` | `next.config.ts#redirects()` (`permanent: true`) | |
| `/tags/` | `pages/tags/index.astro` | `app/tags/page.tsx` | |
| `/tags/<tag>/` | `pages/tags/[tag].astro` | `app/tags/[tag]/page.tsx` | 태그에 한글/특수문자가 들어가면 `encodeURIComponent` 확인 |
| `/about/` | `pages/about.astro` | `app/about/page.tsx` | |
| `/rss.xml` | `pages/rss.xml.js` | `app/rss.xml/route.ts` | §5.1 |
| `/sitemap-index.xml` | `@astrojs/sitemap` | `app/sitemap.ts` → `/sitemap.xml` | **URL이 바뀐다.** `next.config` redirect로 흡수 |
| `/404` | 기본 | `app/not-found.tsx` | |

> ⚠️ **트레일링 슬래시**: Astro 기본은 `/blog/foo/`, Next 기본은 `/blog/foo`다.
> `next.config.ts`에 **`trailingSlash: true`를 반드시 설정**한다. 안 그러면 기존 링크가 전부 301을 타고,
> RSS의 `<link>`·`<guid>`가 바뀌어 구독자 피드에 **모든 글이 새 글로 다시 뜬다.**

### 5.1 RSS — `app/rss.xml/route.ts`

`@astrojs/rss`가 없으므로 직접 만든다. 출력 XML을 현재와 **바이트 수준으로 비슷하게** 맞춘다 (guid 유지가 목적).

```ts
import { getPosts, postUrl } from '@/lib/posts'
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '@/consts'

export const dynamic = 'force-static'   // 빌드 시 정적 생성

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!))

export async function GET() {
  const posts = await getPosts()
  const items = posts.map((p) => `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${SITE_URL}${postUrl(p)}</link>
      <guid isPermaLink="true">${SITE_URL}${postUrl(p)}</guid>
      <description>${esc(p.data.description)}</description>
      <pubDate>${p.data.pubDate.toUTCString()}</pubDate>
${p.data.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>${esc(SITE_TITLE)}</title>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <link>${SITE_URL}/</link>
${items}
</channel></rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
```

`app/sitemap.ts`는 Next 파일 규약을 그대로 쓴다 (`MetadataRoute.Sitemap` 반환).

---

## 6. 스타일 마이그레이션 — Tailwind CSS v4

현재 `global.css` 359줄은 **CSS 변수 토큰 + `.prose` 본문 스타일**로, 한글 타이포(`word-break: keep-all`,
17px/1.75)에 맞춰 손으로 튜닝돼 있다. 이걸 버리고 Tailwind 유틸로 전부 다시 쓰는 건 손해다.

### 전략: 토큰은 Tailwind로 승격, `.prose`는 그대로 유지

```css
/* app/globals.css */
@import "tailwindcss";
@import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';

/* ① 다크모드를 data-theme 기반으로 바꾼다.
   Tailwind v4 기본 dark: 는 prefers-color-scheme이라 현재 방식(localStorage 우선)과 충돌한다. */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

/* ② 기존 토큰을 그대로 옮긴다 — 단일 진실은 여전히 CSS 변수 */
:root {
  color-scheme: light;
  --bg: #ffffff;  --bg-subtle: #f5f6f8;  --fg: #1a1a1a;
  --fg-muted: #6b7280;  --border: #e5e7eb;  --accent: #2f6feb;
  --measure: 42rem;
}
:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0f1115;  --bg-subtle: #171a21;  --fg: #e6e6e6;
  --fg-muted: #9aa3b2;  --border: #2a2f3a;  --accent: #7aa2f7;
}

/* ③ 토큰을 Tailwind 유틸로 노출 → bg-bg, text-fg-muted, border-border 가 생긴다 */
@theme inline {
  --color-bg: var(--bg);
  --color-bg-subtle: var(--bg-subtle);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --font-sans: 'Pretendard Variable', Pretendard, -apple-system, system-ui, 'Apple SD Gothic Neo', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --spacing-measure: 42rem;
}

/* ④ 마크다운 본문 스타일은 현재 CSS를 통째로 이식. 유틸로 바꾸지 않는다. */
@layer components {
  .prose { /* global.css의 .prose 블록 전체를 그대로 붙여넣기 */ }
}
```

**결정: `@tailwindcss/typography` 플러그인은 쓰지 않는다.** 플러그인의 기본값은 영문 기준이라
한글 `keep-all`·17px·1.75 튜닝을 전부 다시 override하게 되고, 결과적으로 지금 CSS보다 길어진다.

**컴포넌트는 Tailwind 유틸로 재작성한다.** Astro scoped `<style>`이 없어졌으므로,
`PostCard`·`Header`·`Footer` 등의 scoped CSS는 클래스 유틸로 옮기는 게 자연스럽다.

```
Astro scoped <style>          →  Tailwind 유틸 클래스        (컴포넌트 12개)
global.css 토큰               →  :root 변수 + @theme inline  (그대로)
global.css .prose             →  @layer components .prose    (그대로)
Shiki --shiki-light/dark 처리 →  그대로 (defaultColor: false 유지)
```

### 6.1 다크모드 FOUC 방지

Astro의 `BaseHead.astro` 인라인 스크립트를 `app/layout.tsx`에 그대로 옮긴다.
Next 문서의 `preventing-flash-before-hydration` 가이드와 동일한 패턴이다.

```tsx
<html lang="ko" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: `
      (function(){try{
        var t = localStorage.getItem('theme')
          || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = t;
      }catch(e){}})()` }} />
  </head>
```

`suppressHydrationWarning`이 필요하다 (스크립트가 `<html>` 속성을 하이드레이션 전에 바꾸므로).

### 6.2 폰트

`pretendard` npm 동적 서브셋 CSS를 `globals.css`에서 `@import` — **현재 방식 그대로 유지**.
`next/font/local`로 바꾸면 unicode-range 서브셋(수십 개 woff2)을 수동으로 나열해야 해서 손해다.
대신 `<link rel="preload">`로 라틴 서브셋 하나만 미리 당겨오는 최적화는 나중에 검토.

---

## 7. Express API 설계

### 7.1 스택

```
Express 5 · TypeScript · tsx(dev) · zod(검증) · Drizzle ORM + Neon Postgres
helmet · cors · express-rate-limit · pino(로깅)
```

Express **5**를 쓴다 (async 핸들러의 rejection을 자동으로 next()에 넘겨준다 — `express-async-errors` 불필요).

### 7.2 엔드포인트

| 메서드 | 경로 | 용도 | 인증 | 캐시 |
| --- | --- | --- | --- | --- |
| `GET` | `/v1/views/:slug` | 조회수 읽기 | 없음 | `s-maxage=60` |
| `POST` | `/v1/views/:slug` | 조회수 +1 (IP 해시로 24h 중복 제거) | 없음, rate limit | no-store |
| `GET` | `/v1/reactions/:slug` | 반응 집계 | 없음 | `s-maxage=30` |
| `POST` | `/v1/reactions/:slug` | 반응 토글 (`{kind:'like'\|'idea'\|'bug'}`) | 익명 ID 쿠키 | no-store |
| `GET` | `/v1/search?q=&limit=` | 전문 검색 | 없음, rate limit | `s-maxage=300` |
| `POST` | `/v1/contact` | 문의 전송 | 없음, rate limit + 허니팟 | no-store |
| `POST` | `/v1/hooks/revalidate` | 배포 후 Next 캐시 무효화 | `x-webhook-secret` | — |
| `GET` | `/healthz` | 헬스체크 | 없음 | no-store |

### 7.3 스키마

```sql
create table post_views (
  slug        text primary key,
  count       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

create table view_events (          -- 24h 중복 제거용. 파티션 대신 주기적 삭제
  slug        text not null,
  visitor     text not null,        -- sha256(ip + ua + 일자 + salt). 원본 IP 저장 안 함
  created_at  timestamptz not null default now(),
  primary key (slug, visitor)
);

create table reactions (
  slug text not null, visitor text not null, kind text not null,
  created_at timestamptz not null default now(),
  primary key (slug, visitor, kind)
);

create table search_docs (          -- 배포 훅이 채운다
  slug text primary key, title text not null, description text not null,
  body text not null, tags text[] not null, pub_date date not null,
  tsv tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(body,''))
  ) stored
);
create index on search_docs using gin (tsv);
```

> **검색 주의**: Postgres 기본 FTS는 한국어 형태소 분석을 못 한다. `simple` 설정 + `ILIKE` 폴백으로
> 시작하고, 부족하면 `pg_bigm`(2-gram, Neon 지원 확인 필요) 또는 클라이언트 사이드 검색
> (빌드 시 생성한 JSON 인덱스 + Fuse.js)으로 전환한다. **글이 20편 미만이면 클라이언트 검색이 정답이다.**
> 즉 검색은 Express가 아니라 Next 빌드 산출물로 해결하는 게 낫다 → §12 결정 항목.

### 7.4 개인정보

CLAUDE.md의 "개인정보는 사이트에 올리지 않는다" 원칙을 API에도 적용한다.

- IP는 **저장하지 않는다.** `sha256(ip + user-agent + YYYY-MM-DD + SALT)` 해시만 저장하고 30일 후 삭제.
- 문의 폼은 이메일과 본문만 받고, 저장 없이 릴레이(Resend 등)만 한다.
- CORS는 `origin` 화이트리스트 (프로덕션 도메인 + `*.vercel.app` 프리뷰 패턴).

### 7.5 프론트 연동 — 정적 페이지를 깨지 않기

```tsx
'use client'
export function ViewCounter({ slug }: { slug: string }) {
  const [n, setN] = useState<number | null>(null)
  useEffect(() => {
    const c = new AbortController()
    fetch(`${API}/v1/views/${slug}`, { method: 'POST', signal: c.signal })
      .then((r) => r.json()).then((d) => setN(d.count))
      .catch(() => {})                         // ★ 실패해도 조용히 넘어간다
    return () => c.abort()
  }, [slug])
  return <span className="tabular-nums text-fg-muted">{n === null ? '—' : `${n} views`}</span>
}
```

레이아웃 시프트를 막기 위해 로딩 중에도 같은 폭을 차지하게 한다(`—` 플레이스홀더 + `tabular-nums`).

---

## 8. 단계별 실행 계획

각 단계 끝에 **완료 기준(DoD)**을 두고, 그걸 통과하기 전에는 다음 단계로 넘어가지 않는다.
Astro 저장소는 **컷오버 전까지 손대지 않는다** (언제든 롤백 가능).

### Phase 0 — 결정 확정 & 스캐폴딩 (0.5일)
- §12의 결정 항목을 먼저 정한다 (특히 Express 포함 여부, 검색 방식).
- `feat/next-migration` 브랜치. `apps/web` 스캐폴딩 (`create-next-app` 대신 showreel의 설정을 복사하는 게 빠르다: Next 16.3.4 + Tailwind v4 + pnpm이 이미 검증됨).
- `content/blog/`로 글 이동 (내용 수정 0), `public/` 복사.
- **DoD**: `pnpm dev`가 뜨고 빈 페이지가 나온다. Node 22 PATH 확인.

### Phase 1 — 콘텐츠 파이프라인 (1일) ★ 가장 위험한 구간
- `lib/schema.ts`, `lib/posts.ts`, `lib/mdx.ts`, `lib/toc.ts`.
- `app/blog/[slug]/page.tsx`에 스타일 없이 본문만 렌더.
- **DoD**: `style-guide.md`(스타일 회귀 확인용 글)가 렌더되고, **마크다운 전 요소**(표·각주·코드블록·인용·체크박스)가 Astro 결과와 동일한 HTML 구조로 나온다. `extractToc`가 뽑은 slug가 실제 `<h2 id>`와 일치한다.

### Phase 2 — 스타일 시스템 (1일)
- `globals.css`: 토큰 + `@theme inline` + `@custom-variant dark` + `.prose` 이식.
- 다크모드 인라인 스크립트, `ThemeToggle.tsx`.
- **DoD**: style-guide 글을 라이트/다크에서 열어 **Astro 배포본과 나란히 놓고 육안 비교**. 코드블록 색이 두 테마 모두 맞다. 새로고침 시 흰 화면 깜빡임 없다.

### Phase 3 — 라우트·컴포넌트 포팅 (1.5일)
- 홈(카드 그리드), 태그 2종, about, 404, Header/Footer.
- 컴포넌트 12개를 Tailwind 유틸로 재작성.
- 코드 복사 버튼을 `CopyButton.tsx`(client)로.
- **DoD**: 모든 라우트가 `pnpm build`에서 정적으로 생성된다(빌드 로그의 `○ (Static)` 확인). 홈 폭 62rem / 본문 42rem, 720px 브레이크포인트 동작.

### Phase 4 — 메타데이터·피드 (0.5일)
- `generateMetadata`, `app/sitemap.ts`, `app/robots.ts`, `app/rss.xml/route.ts`.
- `next.config.ts`: `trailingSlash: true`, `/blog → /` redirect, `/sitemap-index.xml → /sitemap.xml` redirect.
- **DoD**: 새 `/rss.xml`과 현재 배포본의 `/rss.xml`을 diff 했을 때 **`<link>`/`<guid>`가 완전히 동일**하다. sitemap에 draft 글이 없다.

### Phase 5 — Express API (1.5일) *(§12에서 채택한 경우에만)*
- `apps/api` 스캐폴딩, Drizzle 마이그레이션, `/healthz` + `/v1/views` 먼저.
- CORS/rate limit/helmet, 에러 핸들러, pino 로깅.
- 프론트에 `ViewCounter` 연결.
- **DoD**: API를 **꺼도** 블로그가 정상 동작한다(콘솔 에러 없이 `—` 표시). rate limit이 실제로 429를 낸다.

### Phase 6 — 배포 & 컷오버 (0.5일)
- Vercel 프로젝트의 Root Directory를 `apps/web`으로, Framework를 Next.js로 변경. `vercel.json` 갱신.
- 프리뷰 URL에서 전체 점검 → 프로덕션 승격.
- Express는 Railway/Render에 별도 배포, `NEXT_PUBLIC_API_URL` 환경변수 연결.
- **DoD**: 프로덕션 Lighthouse 성능 90+ / 접근성 95+. 기존 URL 10개를 직접 눌러 전부 200 (301 체인 없음).

### Phase 7 — 정리
- `astro.config.mjs`, `src/pages`, `src/layouts`, Astro 의존성 제거.
- `CLAUDE.md`·`README.md`·`AGENTS.md` 갱신 (**Astro AGENTS.md 블록 삭제, Next의 것으로 교체**).
- 태그: `astro-final` (롤백 지점).

**총 예상: 6~7일** (Express 제외 시 4.5일)

---

## 9. 배포 토폴로지

### A. Next (Vercel) — 현행 유지
```jsonc
// vercel.json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter web build"
}
```
Vercel 프로젝트 설정에서 Root Directory = `apps/web`. 어댑터 불필요.
`output: 'export'`는 **쓰지 않는다** — Route Handler(`/rss.xml`)와 향후 ISR을 위해 기본 SSR 모드를 유지한다.
(전부 정적 생성되므로 실질 성능은 정적 출력과 같다.)

### B. Express — Railway 권장
| 후보 | 장점 | 단점 |
| --- | --- | --- |
| **Railway** | 배포 간단, Postgres 내장, $5/월 | 무료 티어 없음 |
| Render | 무료 티어 | 무료는 15분 후 슬립 → 첫 요청 30초 |
| Fly.io | 리전 선택(icn), 저렴 | 설정 복잡 |
| Vercel Functions로 흡수 | 배포 1곳 | **Express를 쓰는 의미가 사라진다** |

DB는 **Neon**(서버리스 Postgres, 무료 티어) — Railway Postgres보다 백업·브랜칭이 낫다.

### C. 환경 변수
```
apps/web:  NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL, REVALIDATE_SECRET
apps/api:  DATABASE_URL, ALLOWED_ORIGINS, VISITOR_SALT, REVALIDATE_SECRET, RESEND_API_KEY
```

---

## 10. 리스크

| # | 리스크 | 영향 | 대응 |
| --- | --- | --- | --- |
| R1 | **트레일링 슬래시 불일치** | RSS 구독자에게 전 글 재알림, 색인 손실 | `trailingSlash: true` 필수. Phase 4 DoD에서 diff 검증 |
| R2 | Sätteri → remark 전환으로 HTML 구조 미묘하게 변경 | `.prose` CSS가 안 먹는 부분 발생 | style-guide 글로 회귀 확인 (이미 그 용도로 존재) |
| R3 | `next-mdx-remote`의 React 19 / Next 16 호환 | 빌드 실패 | Phase 1에서 **가장 먼저** 검증. 실패 시 `@mdx-js/mdx`의 `compile` + `run` 직접 사용 (의존성 1개) |
| R4 | Pretendard 동적 서브셋 CSS가 Turbopack에서 `node_modules` CSS import 처리 | 폰트 깨짐 | Phase 0에서 즉시 확인. 실패 시 `public/fonts`로 복사 후 `@font-face` 직접 작성 |
| R5 | 빌드 시간 증가 (MDX 컴파일) | 배포 느려짐 | 글 50편까지는 무시 가능. 넘으면 Velite(§4.6 C) 도입 |
| R6 | Express 콜드스타트/다운 | 조회수 미표시 | 프론트가 실패를 무시하도록 설계 (§7.5). 블로그 본문은 영향 없음 |
| R7 | 번들 크기 증가 (Astro 0KB JS → React 하이드레이션) | 성능 저하 | 클라이언트 컴포넌트를 ThemeToggle/CopyButton/ViewCounter **3개로 제한**. 나머지는 전부 RSC |
| R8 | Vercel 프로젝트 설정 변경 중 배포 실패 | 사이트 다운 | 새 Vercel 프로젝트를 따로 만들어 검증 후 도메인만 스위치 |

**롤백**: Phase 6 전까지 Astro `main`은 그대로 배포 중이다. 문제가 생기면 Vercel에서 이전 배포로
Instant Rollback, 또는 도메인을 옛 프로젝트로 되돌린다. `astro-final` 태그가 복귀 지점.

---

## 11. 마이그레이션으로 잃는 것 / 얻는 것

**잃는 것 (정직하게)**
- **JS 0KB.** Astro 정적 사이트는 하이드레이션이 없다. Next는 RSC라도 런타임 JS가 실린다 (~80KB gzip). 텍스트 중심 블로그에서 이건 순수한 손해다.
- 빌드 속도. Astro 정적 빌드가 더 빠르다.
- `astro:content`의 타입 자동 추론 (직접 zod로 유지해야 함).
- 설정의 단순함. `astro.config.mjs` 30줄 → `next.config.ts` + `postcss.config.mjs` + `mdx-components.tsx` + `lib/` 4개 파일.

**얻는 것**
- **showreel과 스택 통일.** Next 16 + Tailwind v4 + pnpm으로 둘 다 맞춰지면 컴포넌트·설정·CI를 공유할 수 있고, 두 사이트를 하나의 모노레포로 합치는 길도 열린다.
- remark/rehype 생태계 복귀 (Sätteri의 플러그인 제약이 사라진다).
- React 인터랙션 (검색, 반응, 필터링)을 자연스럽게 넣을 수 있다.
- **포트폴리오로서의 가치** — Next + Express + Postgres 풀스택 구성은 보여줄 게 있다.

> 판단: 순수하게 "블로그로서 더 좋아지는가"만 보면 **마이그레이션은 손해다.** 하지만
> "포트폴리오 전체의 일관성 + 보여줄 백엔드"가 목적이라면 타당하다.
> 지금 글이 1편뿐이라 **마이그레이션 비용이 가장 싼 시점**인 것도 사실이다.

---

## 12. 결정 필요 항목

| # | 항목 | 선택지 | 권장 |
| --- | --- | --- | --- |
| D1 | **Express를 정말 넣는가** | (a) 넣는다 — 조회수/반응/문의 (b) 안 넣는다 — Next Route Handler로 충분 (c) 나중에 | **(a), 단 포트폴리오 목적임을 명확히 하고** |
| D2 | 저장소 구조 | (a) devlog 안 pnpm 워크스페이스 (b) 저장소 2개 (c) showreel까지 합친 대형 모노레포 | **(a)** — (c)는 나중에 |
| D3 | 콘텐츠 로더 | (a) 직접 구현 (b) Velite | **(a)** |
| D4 | 검색 | (a) 빌드 시 JSON 인덱스 + 클라이언트 검색 (b) Postgres FTS via Express | **(a)** — 글 20편 미만에서 (b)는 과설계 |
| D5 | `.prose` 스타일 | (a) 현재 CSS 이식 (b) `@tailwindcss/typography` | **(a)** |
| D6 | Express 호스팅 | Railway / Render / Fly | **Railway** |
| D7 | 컷오버 시점 | (a) 지금 (글 1편) (b) 글 몇 편 더 쓰고 | **(a)** — 지금이 가장 싸다 |
| D8 | `astro.config#site` (현재 `devlog-hazel-three.vercel.app`) | 커스텀 도메인 붙일지 | 마이그레이션과 함께 정하면 리다이렉트를 한 번에 처리 |

---

## 부록 A. 의존성 변화

**제거**: `astro`, `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@astrojs/markdown-satteri`, `@astrojs/check`
**유지**: `pretendard`, `sharp`(OG 생성용), `typescript`(→ 5.x로 되돌려도 됨. Astro check 제약 해제)

**apps/web 신규**
```
next@16.3.4  react@19  react-dom@19
tailwindcss@4  @tailwindcss/postcss
gray-matter  zod  github-slugger
next-mdx-remote  remark-gfm  rehype-slug  @shikijs/rehype  shiki
```
**apps/api 신규**
```
express@5  cors  helmet  express-rate-limit  pino  zod
drizzle-orm  @neondatabase/serverless   (dev: tsx  drizzle-kit  @types/express)
```

## 부록 B. Next 16 주의사항 (학습 데이터와 다른 부분)

`AGENTS.md` 규칙대로 `node_modules/next/dist/docs/`를 확인한 결과:

- **`params`는 Promise다.** `const { slug } = await params`. 동기 접근은 에러.
- **타입은 자동 생성된다.** `PageProps<'/blog/[slug]'>`, `LayoutProps<'/'>`를 쓴다 (showreel의 `layout.tsx`가 이미 이 방식).
- **`middleware.ts`는 deprecated → `proxy.ts`.** 코드모드: `npx @next/codemod@canary middleware-to-proxy .`
- **`cacheComponents`** 플래그로 `use cache` 디렉티브를 켤 수 있다. 이번 마이그레이션에서는 **켜지 않는다** (전부 정적이라 이득이 없고 변수만 늘린다).
- `next.config.ts`(TypeScript) 사용. Turbopack이 기본.
- Tailwind v4는 `tailwind.config.js` 없이 CSS의 `@theme` / `@custom-variant`로 설정한다.
- Node 22 필수: `export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"`
