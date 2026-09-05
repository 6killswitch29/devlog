# devlog

개발일지 블로그. Next.js 16 + MDX로 만든 정적 사이트.
이름은 인디 개발 씬에서 개발일지를 부르는 말 "development log"에서 왔다.

## 요구 사항

- Node 22.12+ (nvm: `nvm use 22`)
- pnpm

## 시작하기

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # 전 라우트 정적 생성
pnpm start      # 빌드 결과 서빙
pnpm typecheck
```

pnpm 워크스페이스다. 앱은 `apps/web`에 있고 루트 스크립트가 그리로 넘긴다.

## 글 쓰기

`apps/web/content/blog/YYYY-MM-DD-slug.md` 파일을 만들고 frontmatter를 채운다.

```md
---
title: 'Next.js로 블로그 옮기기'
description: '개발일지 블로그를 Astro에서 Next.js 16으로 옮긴 기록'
pubDate: 2026-09-05
tags: [nextjs, migration]
# updatedDate: 2026-09-10
# draft: true            # 쓰는 중이면 켠다. dev에서만 보이고 빌드에서 빠진다.
# series: '블로그 만들기'  # 연재물이면 같은 이름을 붙인다.
# seriesOrder: 2         # 연재 순서
---
```

파일명이 그대로 URL slug가 된다 (`/blog/2026-09-05-nextjs-migration/`).
코드 블록에 파일명을 붙이려면 ` ```ts title="src/lib/posts.ts" `.

프로젝트 카드는 `apps/web/content/projects/<slug>.md`의 frontmatter로 관리한다.

## 화면

- `/` 글 목록 (정렬 토글, 사이드바 태그 필터, ⌘K 검색)
- `/blog/<slug>/` 글 상세 (목차 스크롤 스파이, 시리즈 이동, 읽기 진행바)
- `/series/`, `/projects/`, `/about/`, `/tags/`, `/tags/<tag>/`
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/search.json`

## 배포

Vercel. Root Directory는 `apps/web`. `main` 푸시 → 프로덕션, PR → 프리뷰.

## 문서

- `CLAUDE.md` — 스택·구조·글 작성 규칙·디자인 규약
- `MIGRATION.md` — Astro 7 → Next.js 16 전환 설계와 파리티 검증 기록 (롤백 지점: 태그 `astro-final`)
- `docs/개인 개발 블로그 와이어프레임.pdf` — 화면 설계 원본
