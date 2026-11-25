---
brand: "orion-skills-site"
name: "orion-skills"
archetype: "WorksInteractiveSandbox"
polarity: "dark"
tokens: "tokens/brand.tokens.json"
---

# orion-skills Design System (Archetype B: WorksInteractiveSandbox)

Dark interactive sandbox surface aligned with `danmercede.com` Navy continuity on a Deep Slate-Navy (`#040D24`) canvas, raised sandbox panels (`#091638`), progressive token-budget visualizer (`8,500` baseline comparison), and live skill catalog filter/search.

## Palette and Contrast Rules

- Canvas: `#040D24` (Deep Slate-Navy)
- Raised sandbox surface: `#091638`
- Elevated interactive card: `#102252`
- Primary ink: `#F8FAFC`
- Secondary prose ink: `#E2E8F0`
- Muted metadata: `#94A3B8` (`>=5.0:1` on `#102252`)
- Primary CTA fill: `#E68249` (Copper Mid), hover `#F0975A`, ink always `#020B29` (`>=7.07:1`)
- Accent markers/links on dark surfaces: `#F0975A`
- Focus ring: `#FFC08B`

## Typography and CSS Contract

- Typography uses local system UI sans, serif display (`Georgia, "Times New Roman", serif`), and monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`) stacks to satisfy the strict CSS governance contract (`assertCssCannotGenerateClaims`, zero `url(...)`, zero `content:`, zero inline `style` attributes).
- Mandatory `@media (prefers-reduced-motion: reduce)` disables all transitions and animations.
