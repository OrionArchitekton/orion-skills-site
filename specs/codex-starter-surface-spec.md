# Codex Starter Surface Specification

## Purpose

The Orion Skills product page must let a Codex user discover and install the
verified Codex starter set without implying that the full Orion Skills library
has been validated for Codex.

The canonical domain term is **Codex starter set**: the exact three portable
verification disciplines validated by the Orion Skills source project.
“Codex-compatible library,” “all skills support Codex,” and similar broad
phrases are not synonyms and must not replace it.

## Source contract

The full library contains 26 skills and targets Claude Code. The Codex starter
set contains exactly:

1. `reprobe-stale-premise`
2. `prove-control-binds`
3. `prove-deploy-is-live`

Each Codex skill is installed directly from its source-project directory with a
separate `$skill-installer` request pinned to reviewed source commit
`c334ca499beed06892ba0a51b2698ce75e4a3e05`. This is local skill installation,
not a plugin-directory or marketplace listing.

## Scenarios

### Scenario 1: Discover the supported hosts

Given a visitor reaches the Orion Skills product page,
when they read the hero, credibility line, or page metadata,
then they learn that the full 26-skill library targets Claude Code,
and that a narrower three-skill starter set is verified for Codex,
without seeing a claim that all 26 skills support Codex.

### Scenario 2: Install the Codex starter set

Given a Codex user reaches the install section,
when they inspect the copyable commands,
then they receive one exact `$skill-installer` request for each starter skill,
and the page tells them to run each request separately.

The copied commands must target the reviewed source commit in the canonical
public Orion Skills repository and must not require a plugin marketplace. If a
destination already exists, the page must tell the user to inspect or
deliberately update it and continue with the other requests.

### Scenario 3: Discover the install path without JavaScript

Given a crawler or user agent does not execute JavaScript,
when it reads the production HTML,
then the baked page body still contains the three exact Codex installer
requests, the three-skill scope, and the no-marketplace boundary.

### Scenario 4: Share or index the page

Given a search engine or social platform reads page metadata,
when it inspects the document title, description, social metadata, or
structured data,
then Claude Code and Codex are both named,
and structured data records both supported runtime surfaces without implying
that the full library is validated for Codex.

The social card must match the current 26-skill library, the three-skill Codex
starter set, and the canonical `/works/orion-skills/` URL. Its metadata URL must
be content-versioned so a crawler cannot reuse the former Claude-only card for
this surface.

## Constraints

- Preserve the existing page design and interaction model.
- Keep all claims grounded in reviewed Orion Skills source commit
  `c334ca499beed06892ba0a51b2698ce75e4a3e05`.
- Keep the `v0.5.0` release link as historical release navigation; do not claim
  that the Codex starter set shipped in that release.
- Add no service, credential, connector, plugin, marketplace, or runtime
  dependency.
- Do not change the skill catalog content from this repository.

## Acceptance criteria

- The human-rendered install section exposes the exact three Codex installer
  requests as separate copyable blocks.
- Existing-skill collision guidance prevents one destination from stopping the
  remaining starter-set installs.
- The built raw HTML contains the same three installer requests.
- The built raw HTML is rendered from the same application tree the browser
  hydrates, so crawler and JavaScript claim surfaces cannot drift.
- Copy controls are natively disabled in the server-rendered/no-JavaScript
  surface and become interactive only after the browser confirms clipboard
  support.
- Hero, install copy, metadata, and structured data consistently distinguish
  the Claude-targeted full library from the Codex starter set.
- Broad Codex compatibility claims are absent.
- Runtime claim sources are fail closed: inert templates, nested browsing
  contexts, base redirects, inline styles, CSS-generated text, and ungoverned
  stylesheets are rejected by the artifact contract.
- The Open Graph image remains 1200 by 630 pixels and visually carries the
  current skill count, Codex starter count, and canonical URL.
- Open Graph and Twitter metadata reference the same content-versioned image
  copied into the production artifact.
- Type checking, production build, and the built-artifact contract suite pass.

## Test seam

The primary seam is the production build artifact, `dist/index.html`. One
contract suite reads that artifact to exercise metadata, JSON-LD, the
JavaScript-free baked body, exact installer prompts, scope language, and
overclaim guards. The body is server-rendered from the actual application
component at build time and hydrated by the browser, so this seam covers both
the crawler body and the browser's initial DOM rather than a second handwritten
rendering. The suite parses HTML using browser semantics so character
references, attribute casing, equivalent root spellings, ancestor context, and
inert content cannot bypass the contract. It also parses the emitted local CSS
and rejects generated text or ungoverned visual dependencies. Content digests
bind the reviewed HTML, stylesheet, and hydrated runtime bundle so any
production-byte change requires an explicit contract update and review.

The same suite reads the Open Graph PNG header to enforce its 1200 by 630
delivery contract. Visual text accuracy remains an explicit review check.
