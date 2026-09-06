---
title: 멀티테넌트에서 테넌트 격리를 앱이 아니라 DB로 옮긴 이유
description: WHERE tenant_id를 빠뜨린 쿼리 하나가 사고가 된다. 격리를 코드 리뷰가 아니라 제약으로 강제한 과정.
pubDate: 2026-08-28
tags:
  - mysql
  - backend
  - security
draft: true
series: '멀티테넌트 설계'
seriesOrder: 1
---

## 앱에서 막으면 언젠가 샌다

테넌트별 데이터를 한 테이블에 담으면 모든 쿼리에 `tenant_id` 조건이 붙어야 한다.
사람이 매번 붙이는 방식은 리뷰를 잘해도 결국 하나가 빠진다.

```sql title="schema.sql"
CREATE TABLE document (
  id          BIGINT PRIMARY KEY,
  tenant_id   BIGINT NOT NULL,
  owner_id    BIGINT NOT NULL,
  CONSTRAINT fk_owner FOREIGN KEY (tenant_id, owner_id)
    REFERENCES member (tenant_id, id)
);
```

복합 외래키로 묶으면 다른 테넌트의 사용자를 소유자로 넣는 시도가 DB에서 막힌다.

## 남는 구멍

읽기 쿼리는 여전히 앱의 몫이다. 리포지토리 계층에서 테넌트 조건을 강제로 주입하고,
그 계층을 우회하는 쿼리는 정적 검사로 잡는다.

## 정리

제약으로 막을 수 있는 것은 제약으로 막고, 남는 것만 규칙으로 관리한다.
