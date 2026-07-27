# orion-skills-site

Vite/React microsite for the `orion-skills` project page at
`https://www.danmercede.com/works/orion-skills/`.

## Role

This repo owns the marketing/presentation surface for `orion-skills`: layout,
copy, metadata, static assets, and Vercel routing/cache config. The source
project owns the skill library content and tests.

## Source Of Truth

- Product repo: `../orion-skills`
- Site copy: `constants.ts`
- Metadata: `index.html`
- Routing/cache: `vercel.json`

## Local Development

```bash
npm ci
npm run dev
```

## Validation

```bash
npm ci
npm audit --audit-level=high
npx tsc --noEmit
npm run build
npm run test:contract
```

## Boundaries

Keep claims grounded in the source project README, skill catalog, docs, and
released behavior. Do not change skill content from this repo.
