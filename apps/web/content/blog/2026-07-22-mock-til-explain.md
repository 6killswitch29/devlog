---
title: 'TIL: EXPLAIN에서 rows는 추정치다'
description: 실행 계획의 rows를 실제 읽은 행 수로 착각하고 있었다.
pubDate: 2026-07-22
tags:
  - til
  - mysql
draft: true
---

`EXPLAIN`의 `rows`는 옵티마이저의 **추정치**다. 실제로 읽은 행은 `EXPLAIN ANALYZE`로 본다.

통계가 낡으면 추정이 크게 빗나가고, 그 상태로 잘못된 인덱스를 고른다.
