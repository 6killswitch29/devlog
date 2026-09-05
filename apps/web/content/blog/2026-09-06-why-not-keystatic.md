---
title: 'CMS가 내 마크다운을 다시 쓴다 — Keystatic을 접은 이유'
description: '브라우저에서 글을 쓰려고 git 기반 CMS를 붙여봤다. 저장 버튼 한 번에 표가 사라지고 코드블록 파일명이 날아갔다.'
pubDate: 2026-09-06
tags:
  - cms
  - keystatic
  - markdown
draft: true
series: 'devlog 다시 만들기'
seriesOrder: 2
---

블로그를 옮기고 나서 다음으로 하고 싶었던 건 브라우저에서 글을 쓰는 것이었다. 조건은 셋이었다.

1. 로그인해서 **내 계정만** 글을 쓸 수 있을 것
2. 글은 계속 **git 안의 마크다운**으로 남을 것
3. DB를 만들지 않을 것

이 조건에 [Keystatic](https://keystatic.com)이 정확히 맞아 보였다. git 백엔드 CMS라 편집 결과가
저장소에 커밋되고, GitHub 모드는 무료이며, 편집 권한이 **저장소 write 권한**으로 결정된다.
1번이 코드 없이 해결된다는 뜻이다.

## 붙이는 것까지는 30분

`@keystatic/core` 0.6.9와 `@keystatic/next` 5.0.5는 Next 16 / React 19에서 문제없이 돌았다.
컬렉션 스키마를 선언하니 내 frontmatter가 그대로 폼이 됐다 — 제목, 파일명, 설명, 발행일, 수정일,
태그 배열, 초안 체크박스, 시리즈 이름과 순서까지.

```ts title="keystatic.config.ts"
posts: collection({
  label: '글',
  path: 'content/blog/*',
  slugField: 'title',
  format: { data: 'yaml', contentField: 'content' },
  schema: {
    title: fields.slug({ name: { label: '제목' }, slug: { label: '파일명' } }),
    // ...
    content: fields.mdx({ label: '본문', extension: 'md' }),
  },
}),
```

여기서 `extension: 'md'`가 핵심처럼 보였다. 파일이 `.mdx`가 아니라 `.md`로 저장되니
기존 파이프라인을 안 건드려도 되겠다고 생각했다.

## 첫 번째 벽: 확장자만 바뀌고 파서는 그대로

기존 글을 열자 편집기가 아예 뜨지 않았다.

```
Field validation failed: content: 5:22: Unexpected end of file in expression,
expected a corresponding closing brace for `{`
```

5행 22열은 본문의 이 문장이었다. "중괄호 { 와 꺾쇠 < 도 그냥 쓴다."

`extension: 'md'`는 **파일명만 바꾼다.** 파서는 여전히 MDX다. 원시 HTML이 있는 글은 더 명확하게 막혔다.

```
Missing component definition for cite, kbd, kbd, kbd, mark, sub, sup, abbr, details, summary
```

`<kbd>`나 `<details>` 같은 태그를 MDX가 컴포넌트로 보고 정의를 요구한 것이다.
마크다운에서는 그냥 HTML인데.

## 두 번째 벽: 읽기는 되는데 쓰기가 다르다

`fields.mdx` 대신 `fields.markdoc({ extension: 'md' })`으로 바꿨더니 읽기가 됐다.
`{`도, `<kbd>`도 그대로 통과했고 편집기에 표와 코드블록이 제대로 그려졌다.

문제는 저장이었다. 테스트 글을 편집기에서 저장하고 파일을 diff했다.

```diff
-```ts title="src/lib/posts.ts"
+```ts

-| 항목 | 값 |
-| --- | --- |
-| a | 1 |
+{% table %}
+- 항목
+- 값
+---
+- a
+- 1
+{% /table %}

-본문 문단이다. **굵게**, _기울임_
+본문 문단이다. **굵게**, *기울임*
```

세 가지가 일어났다.

- **GFM 표가 Markdoc 문법으로 바뀐다.** 내 렌더러(remark-gfm)는 `{% table %}`을 표로 만들지 않는다.
  본문에 그 텍스트가 그대로 노출된다.
- **코드블록의 파일명이 사라진다.** 조용히. 에러도 경고도 없다.
- 강조 기호가 `_`에서 `*`로 바뀐다. 이건 무해하다.

Markdoc 방식으로 파일명을 붙여봤다. `` ```ts {% title="a.ts" %} ``.

```
Field validation failed: content: Key on object value "title" is not allowed
```

우회로가 없었다.

## 결론: 렌더러가 두 벌이면 하나가 진다

정리하면 이렇다. **Keystatic에서 저장하는 순간, 내 마크다운의 표준이 Keystatic 쪽으로 넘어간다.**
편집기가 파싱할 수 있는 것만 쓸 수 있고, 저장하면 편집기가 아는 문법으로 다시 쓰인다.

WYSIWYG 편집기는 본문을 문자열이 아니라 **문서 트리**로 다룬다. 트리로 바꿨다가 다시 문자열로
쓰는 과정에서, 그 트리에 표현할 수 없는 것은 사라진다. 코드블록의 meta는 Keystatic의 트리에
자리가 없었고, 그래서 없어졌다.

표와 코드 파일명을 일상적으로 쓰는 블로그에서는 이 손실이 크다. 그래서 접었다.
대신 마크다운을 **텍스트 그대로** 다루는 작은 편집기를 직접 만들었다. WYSIWYG는 없지만,
저장한 파일이 내가 쓴 것과 바이트 단위로 같다.

선택 기준은 이렇게 정리해두면 될 것 같다.

- 본문이 표준 마크다운 범위 안에서만 논다 → CMS의 편집 경험이 이긴다
- 코드 펜스 옵션, 원시 HTML, 각주처럼 **도구별 확장**을 쓴다 → 텍스트 편집기가 이긴다

기능 목록만 보고 고르면 두 번째 경우를 놓친다. 도구를 붙이기 전에, 내 글에서 제일 특이한 문법이
들어간 파일 하나를 골라 **열었다가 저장하고 diff**해보는 게 30분짜리 확실한 검증이다.
