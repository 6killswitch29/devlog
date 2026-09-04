# devlog

개발일지 블로그. Astro 7 + MDX로 만든 정적 사이트. 이름은 인디 개발 씬에서 개발일지를 부르는 말 "development log"에서 왔다.

## 요구 사항

- Node 22.12+ (nvm: `nvm use 22`)
- pnpm

## 시작하기

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # dist/ 생성
pnpm preview
```

## 글 쓰기

`src/content/blog/YYYY-MM-DD-slug.md` 파일을 만들고 frontmatter를 채운다.

```md
---
title: 'Astro로 블로그 세팅하기'
description: '개발일지 블로그를 Astro 7 + MDX로 만든 기록'
pubDate: 2026-09-04
tags: [astro, setup]
# draft: true          # 쓰는 중이면 켠다. dev에서만 보이고 빌드에서 빠진다.
# series: '블로그 만들기'  # 연재물이면 같은 이름을 붙인다.
---

본문...
```

`pubDate` 기준으로 홈 목록에 정렬되고, 태그 페이지(`/tags/<tag>/`), RSS(`/rss.xml`), sitemap이 자동 생성된다.
디자인 규약(색 토큰, 폰트, 다크 모드)은 `CLAUDE.md`를 참고.

## 구조

| 경로 | 역할 |
| --- | --- |
| `src/content/blog/` | 글 (Markdown / MDX) |
| `src/content.config.ts` | frontmatter 스키마 |
| `src/pages/` | 라우트 (index, blog, about, rss) |
| `src/lib/posts.ts` | 글 목록·태그·시리즈 헬퍼 |
| `src/layouts/Base.astro`, `BlogPost.astro` | 공통 셸, 글 레이아웃 |
| `src/styles/global.css` | 디자인 토큰, 본문 스타일 |
| `src/consts.ts` | 사이트 제목·설명·작성자·외부 링크 |

## 배포

`pnpm build` 결과물(`dist/`)을 Vercel, Cloudflare Pages, GitHub Pages 중 어디든 올리면 된다.
배포 전 `astro.config.mjs`의 `site` 값을 실제 도메인으로 바꿔야 RSS/sitemap 링크가 맞는다.

## 관련 프로젝트

- [`../showreel`](../showreel) — 이력서·경력기술서 포트폴리오 사이트
- [`../cofounder`](../cofounder) — 1인 창업자를 위한 AI 코파운더 서비스
