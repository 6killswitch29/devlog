---
title: 로딩 상태를 컴포넌트마다 만들지 않기
description: isLoading 분기가 화면마다 다르게 생겼다. 경계를 위로 올려 정리했다.
pubDate: 2026-06-25
tags:
  - react
  - typescript
  - frontend
draft: true
---

## 문제

컴포넌트마다 `isLoading` 분기가 있고, 스켈레톤 모양이 제각각이었다.

## 정리

데이터 경계를 화면 단위로 올리고, 그 아래는 데이터가 있다고 가정하고 그린다.
분기가 사라지니 컴포넌트가 훨씬 짧아졌다.
