---
title: 'TIL: 스트림을 그냥 await 하면 메모리가 터진다'
description: 큰 CSV를 한 번에 읽고 있었다. 파이프라인으로 바꾸니 상수 메모리로 끝났다.
pubDate: 2026-05-28
tags:
  - til
  - node.js
draft: true
---

```ts title="import.ts"
// 전부 메모리에 올린다
const text = await fs.readFile(path, 'utf8');

// 흘려보낸다
await pipeline(
  createReadStream(path),
  parseCsv(),
  writeRows(),
);
```

150MB 파일에서 프로세스 메모리가 1.2GB → 90MB로 줄었다.
