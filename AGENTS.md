# AGENTS.md - orion-skills-site

## Repo Role

`orion-skills-site` is the Vite/React microsite for the `orion-skills` project
page. It owns presentation, metadata, static assets, and redirect/cache config
for the site surface.

## Boundaries

- Owns site copy, layout, Open Graph metadata, Vercel config, and static assets.
- Does not own the `orion-skills` skill library content or installation targets.
- Keep public claims grounded in the source project README, skill catalog, docs,
  and released behavior.

## Authority Order

1. `/home/orion/src/orion-estate/platform/orion-estate-audit/AGENTS.md`
2. Source project: `../orion-skills/README.md` and `../orion-skills/skills/`
3. This repo's `README.md`, `constants.ts`, `index.html`, and `vercel.json`
4. Vite build output and package scripts

## Validation

```bash
npm install
npm run build
```

For docs-only changes, run `git diff --check` at minimum.
