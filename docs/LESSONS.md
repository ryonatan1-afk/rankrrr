# Rankr — Lessons Learned

Gotchas that cost time and will bite again if forgotten.

---

## Next.js 16: middleware.ts → proxy.ts

**What changed:** Next.js 16 renamed the middleware file convention from `middleware.ts` to `proxy.ts`. Using `middleware.ts` starts the server but throws a runtime error in Turbopack.

**Fix:** Name the file `proxy.ts` at the project root. Same export shape, same `config.matcher` — just the filename changed.

---

## Prisma v7: No `url` in schema.prisma

**What changed:** Prisma v7 removed `url = env("DATABASE_URL")` from the `datasource` block in `schema.prisma`. Leaving it in causes a `P1012` validation error and blocks `prisma generate`.

**Fix:** Remove `url` from the datasource in `schema.prisma`. Put the connection string in `prisma.config.ts` under `datasource.url`. Install `dotenv` as a dev dependency so `prisma.config.ts` can load `.env`.

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

---

## Clerk v7: Show, not SignedIn/SignedOut

**What changed:** Clerk v7 deprecated `<SignedIn>` and `<SignedOut>`. Using them causes a TS2724 "no exported member" error.

**Fix:** Use `<Show when="signed-in">` and `<Show when="signed-out">` from `@clerk/nextjs`.

**Also:** `<ClerkProvider>` must wrap children inside `<body>`, not the `<html>` tag itself.

```tsx
// correct
<body>
  <ClerkProvider>
    <Show when="signed-out"><SignInButton /></Show>
    <Show when="signed-in"><UserButton /></Show>
    {children}
  </ClerkProvider>
</body>
```
