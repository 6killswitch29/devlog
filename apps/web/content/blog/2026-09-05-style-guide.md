---
title: '스타일 가이드 — 마크다운 요소 점검용'
description: '블로그 스타일 회귀 확인용 글. draft라서 배포에는 포함되지 않는다.'
pubDate: 2026-09-05
tags: [meta, astro]
draft: true
---

이 글은 `src/styles/global.css`와 `BlogPost.astro`가 마크다운의 모든 요소를 제대로 그리는지 확인하기 위한
글이다. `draft: true`라서 `pnpm dev`에서만 보이고 빌드·RSS에는 들어가지 않는다. 스타일을 바꿀 때마다 이
글을 열어 깨진 곳이 없는지 본다.

## 문단과 줄바꿈

한글 본문은 `word-break: keep-all`이라 단어 중간이 아니라 어절 단위로 줄이 바뀌어야 한다. 이 문단은 그것을
확인하기 위해 일부러 길게 쓴다. 정적 사이트 생성기는 빌드 시점에 모든 페이지를 HTML로 만들어 두기 때문에
서버가 필요 없고, CDN에 올리기만 하면 되며, 글이 몇백 개가 되어도 요청당 비용이 사실상 0에 가깝다는 장점이
있다. 반면 댓글이나 검색처럼 동적인 기능은 외부 서비스나 클라이언트 스크립트로 붙여야 한다.

아주긴영문식별자도끊겨야한다: `SomeExtremelyLongIdentifierThatShouldWrapInsteadOfOverflowingTheContainerWidth`
그리고 URL도 마찬가지다: https://docs.astro.build/en/guides/content-collections/#defining-collections

**굵게**, _기울임_, ~~취소선~~, [링크](https://astro.build), 인라인 코드 `pnpm build`.

### 3단계 제목

#### 4단계 제목

4단계 아래는 목차에 올라가지 않는다.

## 목록

- 순서 없는 목록
- 두 번째 항목
  - 중첩 항목
  - 또 중첩
    - 3단계
- 세 번째 항목

1. 순서 있는 목록
2. 두 번째
   1. 중첩 번호
   2. 또 중첩
3. 세 번째

- [ ] 할 일 (GFM 체크박스)
- [x] 한 일

## 코드 블록

TypeScript:

```ts
import { getCollection } from 'astro:content';

export async function getPosts() {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
```

셸:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"
pnpm astro dev --background
```

diff:

```diff
- theme: 'dracula',
+ themes: { light: 'github-light', dark: 'github-dark' },
+ defaultColor: false,
```

가로로 긴 줄은 블록 안에서만 스크롤되어야 한다:

```json
{ "veryLongKeyNameForTesting": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
```

## 인용

> 인용문. 여러 줄로 이어질 수 있고 **마크다운**도 안에서 동작한다.
> — <cite>출처 표기</cite>

## 표

| 항목 | 라이트 | 다크 | 용도 |
| --- | --- | --- | --- |
| `--bg` | `#ffffff` | `#0f1115` | 페이지 배경 |
| `--fg` | `#1a1a1a` | `#e6e6e6` | 본문 |
| `--accent` | `#2f6feb` | `#7aa2f7` | 링크, 활성 네비 |

## 이미지

![사이트 기본 OG 이미지](/og.png)

## 기타 요소

<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>를 누르면 커맨드 팔레트가 뜬다.
<mark>강조 표시</mark>도 된다. H<sub>2</sub>O, x<sup>2</sup>, <abbr title="Static Site Generator">SSG</abbr>.

각주도 쓴다[^1]. 접히는 상세 블록:

<details>
<summary>펼쳐 보기</summary>

숨겨진 내용. 코드도 들어갈 수 있다: `hidden`

</details>

---

수평선 아래 마지막 문단.

[^1]: 각주 본문은 글 맨 아래에 모인다.
