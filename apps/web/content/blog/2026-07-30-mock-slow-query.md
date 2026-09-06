---
title: 느린 쿼리를 찾기 전에 측정부터 붙였다
description: 느리다는 감각만 있고 근거가 없었다. 구간별 시간을 남기고 나서야 범인이 드러났다.
pubDate: 2026-07-30
tags:
  - mysql
  - performance
draft: true
---

## 감각은 자주 틀린다

API가 느리다는 제보를 받고 쿼리부터 의심했는데, 실제로는 직렬화 단계가 절반을 먹고 있었다.

```ts title="src/lib/trace.ts"
const t0 = performance.now();
const rows = await repo.find(query);
const t1 = performance.now();
const dto = rows.map(toDto);
logger.info({ query_ms: t1 - t0, map_ms: performance.now() - t1 });
```

## 결과

쿼리 120ms, 직렬화 210ms. 페이지 크기를 줄이는 것으로 끝났다.
