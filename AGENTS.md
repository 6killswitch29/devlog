## Development

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.3/bin:$PATH"   # Node 22 필수
pnpm dev        # http://localhost:3000
pnpm build      # 전 라우트 정적 생성
pnpm typecheck
```

개발 서버를 오래 띄워 둘 때는 백그라운드로 실행하고, 끝나면 반드시 정리한다.

## Documentation

Next 16은 학습 데이터와 다른 부분이 있다. **추측하지 말고 저장소에 들어 있는 문서를 먼저 본다**:
`apps/web/node_modules/next/dist/docs/` (예: `01-app/02-guides/preventing-flash-before-hydration.md`).

특히 자주 틀리는 것:

- `params`는 Promise다. `const { slug } = await params`
- 페이지 props 타입은 자동 생성된다: `PageProps<'/blog/[slug]'>`, `LayoutProps<'/'>`
- `middleware.ts`는 deprecated → `proxy.ts`
- Tailwind v4는 `tailwind.config.js` 없이 CSS의 `@theme` / `@custom-variant`로 설정한다

온라인 문서: https://nextjs.org/docs · https://tailwindcss.com/docs
