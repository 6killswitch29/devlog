---
title: 'Astro에서 Next.js로 옮기며 "같은 HTML"을 증명한 방법'
description: '정적 블로그를 Astro 7에서 Next.js 16으로 옮겼다. 어려운 건 포팅이 아니라 옮긴 결과가 원본과 같다는 걸 확인하는 일이었다.'
pubDate: 2026-09-05
tags:
  - nextjs
  - astro
  - migration
draft: true
series: 'devlog 다시 만들기'
seriesOrder: 1
---

이 블로그는 Astro 7로 만들었다가 Next.js 16으로 옮겼다. 옮긴 이유는 성능이나 취향이 아니라
화면 때문이다. 새로 그린 와이어프레임에 ⌘K 검색 오버레이, 정렬 토글, 스크롤 스파이 목차가 있었고,
이런 클라이언트 상태를 Astro의 scoped script로 계속 쌓는 것보다 React 컴포넌트로 가는 게 낫다고 봤다.

포팅 자체는 지루한 작업이다. 진짜 문제는 따로 있었다. **옮긴 뒤에 "전과 같은가"를 어떻게 확인하는가.**
글은 마크다운 한 벌인데 렌더러가 통째로 바뀌었다. Astro 7의 기본 처리기(Sätteri)에서
remark/rehype 체인으로 갈아탔으니, 표·각주·코드블록이 미묘하게 달라져도 눈으로는 모른다.

## 눈으로 보지 말고 구조를 비교한다

두 개발 서버를 동시에 띄웠다. Astro는 4321, Next는 3000. 같은 글을 양쪽에서 받아
**DOM 스켈레톤**으로 바꿔 diff했다. 태그 이름, id, class, 그리고 텍스트만 남기고
나머지는 버리는 파서를 하나 짰다.

```python title="skel.py"
class Skel(HTMLParser):
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        parts = [tag]
        if d.get('id'): parts.append('#' + d['id'])
        cls = d.get('class')
        if cls:
            # 하이라이터가 붙이는 테마 클래스는 이름만 다르므로 비교에서 뺀다
            keep = [c for c in cls.split()
                    if c not in ('astro-code', 'shiki', 'github-light', 'github-dark')]
            if keep: parts.append('.' + '.'.join(sorted(keep)))
        self.out.append('  ' * self.depth + '<' + ' '.join(parts) + '>')
```

368줄 대 364줄. diff는 네 군데뿐이었고, 전부 설명이 되는 차이였다.

- `<pre class="astro-code-themes">` → `<pre class="shiki">` — 하이라이터가 붙이는 클래스 이름
- diff 코드블록에서 `-`/`+` 기호를 감싸는 `<span>` 한 겹 차이 — 색은 동일
- 체크박스의 `disabled` 속성 표기 (`disabled` vs `disabled=""`)
- 내가 임시로 넣은 `<h1>`

색까지 확인해야 했다. 듀얼 테마라 색이 인라인 CSS 변수로 나오는데, 양쪽 모두
`--shiki-light:#24292e;--shiki-dark:#e1e4e8`였고 토큰 색(`#D73A49`)도 같았다.
각주 라벨은 `각주`, 백링크의 `aria-label`은 `본문 1번 참조로 돌아가기`까지 일치했다.

목차는 따로 확인했다. 렌더 중에 모은 slug 8개가 실제 `<h2 id>`와 정확히 같은지,
각주 섹션 제목이 목차에서 빠지는지를 비교했다.

RSS는 더 단순하다. `@astrojs/rss`가 내던 XML과 새로 만든 라우트의 출력을 문자로 비교했다.
`<link>`와 `<guid>`가 한 글자라도 다르면 구독자 전원에게 전부 새 글로 보인다.

## 이번에 배운 함정 다섯

**`.md`를 MDX로 파싱하면 안 된다.** `next-mdx-remote`는 확장자와 무관하게 MDX로 읽는다.
그러면 본문에 중괄호 하나만 있어도 빌드가 깨진다. 한국어 기술 글에서 `{`나 `<`는 흔하다.
확장자에 따라 파서를 갈랐다.

```ts title="src/lib/mdx.ts"
mdxOptions: {
  format: post.format,                       // .md는 'md', .mdx만 'mdx'
  rehypePlugins: [
    ...(post.format === 'md' ? [rehypeRaw] : []),
    rehypeSlug,
    [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }],
  ],
}
```

**코드 펜스의 meta는 도중에 사라진다.** `` ```ts title="a.ts" ``의 `title=...`은
mdast에는 있지만 remark-rehype가 hast로 옮길 때 버린다. 하이라이터가 읽을 수 있는 속성으로
직접 넘겨야 한다.

```ts title="src/lib/mdx.ts"
function remarkCodeMeta() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;
      node.data = { ...node.data, hProperties: { metastring: node.meta } };
    });
  };
}
```

이걸 넣기 전까지는 파일명이 조용히 안 나왔다. 에러가 아니라 그냥 없었다.

**Tailwind preflight가 목록 마커를 지운다.** 본문 스타일을 그대로 옮겼는데 불릿이 사라졌다.
preflight가 `ul, ol`의 `list-style`을 없애기 때문이다. 본문에서만 되살렸다.

**개발 서버에서 새 글이 안 보였다.** 파일을 모듈 스코프에 캐시했더니 서버를 다시 띄우기 전까지
새 글이 목록에 안 나왔다. Astro의 콘텐츠 컬렉션은 이걸 알아서 해줬었다.

```ts title="src/lib/posts.ts"
// dev에서는 캐시하지 않는다 — 글을 새로 만들 때마다 서버를 다시 띄우지 않아도 되게
if (cache && process.env.NODE_ENV === 'production') return cache;
```

**초안이 배포에 섞이지 않는지는 산출물로 확인한다.** `draft: true`가 실제로 빠졌는지
빌드 결과의 sitemap·RSS·글 페이지를 직접 grep했다. 코드를 읽어서 "빠질 것이다"라고 믿는 것과
산출물에 없는 걸 확인하는 것은 다르다.

## 정리

라이브러리를 갈아타는 작업의 8할은 "같은지 확인하는 방법"을 만드는 데 있다.
이번에는 마크다운 요소를 전부 담은 글 한 편을 회귀 테스트로 두고, DOM 스켈레톤 비교와
RSS 문자 비교를 붙였다. 덕분에 옮긴 뒤에 발견한 문제가 하나도 없었다.

반대로 말하면, 그 글이 없었다면 코드블록 파일명이 사라진 걸 몇 주 뒤에나 알았을 것이다.
