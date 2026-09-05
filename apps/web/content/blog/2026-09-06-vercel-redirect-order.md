---
title: '리다이렉트가 두 번 튀는 이유는 순서에 있었다'
description: 'Vercel에 올린 Next 앱에서 /blog 가 /blog/ 를 거쳐 / 로 갔다. 라우팅 배열을 직접 열어보고 알았다.'
pubDate: 2026-09-06
tags:
  - nextjs
  - vercel
  - troubleshooting
draft: true
series: 'devlog 다시 만들기'
seriesOrder: 3
---

블로그를 옮기면서 예전 주소 하나를 유지해야 했다. `/blog`로 들어오면 목록(`/`)으로 보내는 것.
`next.config.ts`에 리다이렉트를 적었다.

```ts title="next.config.ts"
trailingSlash: true,
async redirects() {
  return [{ source: '/blog', destination: '/', permanent: true }];
}
```

배포하고 확인했더니 이랬다.

```
/blog   308 → /blog/
/blog/  308 → /
```

목적지에는 닿는다. 그런데 두 번 튄다. `vercel.json`에도 같은 리다이렉트를 넣어봤지만 그대로였다.

## 추측 대신 라우팅 배열을 연다

Next는 빌드할 때 `.next/routes-manifest.json`에 리다이렉트 목록을 순서대로 적어둔다. 열어봤다.

```
1  /:file(...\.\w+)/    → /:file        308  internal: true
2  /:notfile(...)       → /:notfile/    308  internal: true
3  /blog                → /             308
4  /sitemap-index.xml   → /sitemap.xml  308
```

2번이 범인이었다. `trailingSlash: true`를 켜면 Next가 **끝 슬래시 정규화 규칙을 internal
리다이렉트로 만들어 배열 맨 앞에** 넣는다. `/blog`는 3번에 닿기 전에 2번에 걸려 `/blog/`로 튄다.
내 규칙은 그다음이라 두 번째 요청에서야 동작한다.

Vercel까지 포함한 최종 순서는 `vercel build`로 확인할 수 있다.
`.vercel/output/config.json`에 실제 배포되는 라우팅이 전부 들어 있다.

```
1  (Next internal) 파일 경로의 끝 슬래시 제거
2  (Next internal) 그 외 경로에 끝 슬래시 추가   ← 여기서 잡힌다
3  vercel.json 의 redirects
4  next.config 의 redirects
```

`vercel.json`이 프레임워크 설정보다 먼저 평가되긴 하지만, **Next의 internal 규칙보다는 뒤**였다.
그래서 어디에 적든 소용이 없었다.

## 정규화를 내가 선언한다

Next에는 이 자동 정규화를 끄는 옵션이 있다.

```ts title="next.config.ts"
trailingSlash: true,            // 빌드 산출물과 내부 링크는 끝 슬래시 유지
skipTrailingSlashRedirect: true // 정규화 리다이렉트는 만들지 않는다
```

그리고 필요한 순서대로 `vercel.json`에 직접 적었다. 별칭을 먼저, 정규화를 마지막에.

```json title="apps/web/vercel.json"
{
  "redirects": [
    { "source": "/blog", "destination": "/", "permanent": true },
    { "source": "/blog/", "destination": "/", "permanent": true },
    { "source": "/sitemap-index.xml", "destination": "/sitemap.xml", "permanent": true },
    { "source": "/:path((?!_next|api)(?:[^/]+/)*[^/.]+)", "destination": "/:path/", "permanent": true }
  ]
}
```

마지막 규칙이 "확장자 없고 `_next`·`api`로 시작하지 않는 경로에 끝 슬래시를 붙인다"이다.
확장자로 파일을 걸러내므로 `/rss.xml`, `/favicon.svg`, `/_next/static/*.js`는 건드리지 않는다.

## 배포 전에 정규식을 직접 돌려본다

이런 규칙은 배포하고 눌러보면서 고치면 비싸다. `vercel build`가 만든 config에서 정규식을 꺼내
경로들을 직접 매칭해봤다.

```python
rules = [(r['src'], r['headers']['Location']) for r in config['routes']
         if r.get('status') in (301, 308)]

for p in ['/blog', '/blog/x-y', '/about', '/rss.xml', '/_next/static/a.js']:
    for src, loc in rules:
        if re.match(src, p):
            print(p, '→', loc); break
```

```
/blog              → /
/blog/2026-09-05-x → /blog/2026-09-05-x/
/about             → /about/
/rss.xml           → (리다이렉트 없음)
/_next/static/a.js → (리다이렉트 없음)
```

배포 후 실제 응답도 같았다. `/blog`는 한 번에 `/`로 간다.

## 덤: POST가 308을 맞는다

정규화 규칙을 만들고 나서 API가 이상해졌다. `POST /api/admin/save`가 308을 먼저 받고 있었다.
확장자가 없는 경로라 정규화 규칙에 걸린 것이다. 308은 메서드와 본문을 유지하므로 최종적으로는
동작하지만, 저장할 때마다 왕복이 한 번 더 생긴다.

위 정규식의 `(?!_next|api)`가 그래서 들어갔다. 고치고 나니 401 JSON이 곧바로 온다.

## 남는 것

프레임워크가 만들어주는 규칙에는 **내가 못 끼어드는 순서**가 있다. 설정 파일 두 곳에 같은 규칙을
적어보는 것보다, 실제 배포되는 라우팅 배열을 한 번 열어보는 쪽이 훨씬 빨랐다.

- Next: `.next/routes-manifest.json`
- Vercel: `vercel build` 후 `.vercel/output/config.json`

둘 다 사람이 읽을 수 있는 JSON이다.
