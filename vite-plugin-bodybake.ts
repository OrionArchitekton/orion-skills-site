import type { Plugin } from 'vite';
import { PRODUCT_DATA } from './constants';
import type { ProductData } from './types';

/**
 * Build-time body-bake (mirrors danmercede-info template).
 *
 * Non-Google answer engines (ChatGPT/GPTBot, Perplexity, ClaudeBot) fetch raw
 * HTML and do NOT execute JavaScript. An empty `<div id="root"></div>` is
 * invisible to them. This plugin injects a static, crawlable HTML skeleton —
 * derived from the single source of truth (`PRODUCT_DATA` in constants.ts) —
 * INTO `#root` at build time.
 *
 * React's `createRoot(...).render(...)` clears `#root` children on mount, so the
 * baked markup is the crawler payload and is replaced by the live app for human
 * visitors (prerender-into-root / progressive-enhancement pattern).
 *
 * This is a no-SSR, browserless, build-time string emission — NOT a framework or
 * SSR-runtime migration.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Exported so tests can assert render parity (the baked crawler body vs
// PRODUCT_DATA / App.tsx) without invoking the build.
export function renderBakedBody(data: ProductData): string {
  const {
    name,
    tagline,
    credibility,
    problem,
    whatItDoes,
    quickstart,
    commands,
    differentiators,
    links,
  } = data;

  const linksList = links
    .map(
      (link) =>
        `<li><a href="${escapeHtml(link.url)}" rel="noopener noreferrer">${escapeHtml(
          link.label,
        )}</a></li>`,
    )
    .join('');

  const commandsList = commands
    .map(
      (cmd) =>
        `<li><strong>${escapeHtml(cmd.name)}</strong>: ${escapeHtml(cmd.description)}</li>`,
    )
    .join('');

  const differentiatorsList = differentiators.points
    .map(
      (point) =>
        `<li><strong>${escapeHtml(point.title)}</strong>: ${escapeHtml(point.body)}</li>`,
    )
    .join('');

  // First quickstart block is the install command — the most load-bearing line
  // for an answer engine summarizing "how do I install this".
  const installBlock = quickstart.blocks[0];

  // Self-contained, answer-first product passage for raw-HTML crawlers, wrapped
  // in the same <main id="main-content"> landmark + skip link the live app
  // provides (no-JS / pre-hydration a11y parity).
  return [
    `<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:rounded focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:no-underline">Skip to main content</a>`,
    `<main id="main-content" tabindex="-1">`,
    `<header>`,
    `<h1>${escapeHtml(name)}</h1>`,
    `<p>${escapeHtml(tagline)}</p>`,
    `<p>${escapeHtml(credibility)}</p>`,
    `</header>`,
    `<section>`,
    `<h2>${escapeHtml(problem.heading)}</h2>`,
    `<p>${escapeHtml(problem.body)}</p>`,
    `<p>${escapeHtml(whatItDoes.body)}</p>`,
    `</section>`,
    `<section>`,
    `<h2>${escapeHtml(quickstart.heading)}</h2>`,
    `<p>${escapeHtml(quickstart.intro)}</p>`,
    `<p>${escapeHtml(installBlock.title)}${installBlock.note ? ` (${escapeHtml(installBlock.note)})` : ''}:</p>`,
    `<pre><code>${escapeHtml(installBlock.command)}</code></pre>`,
    `</section>`,
    `<section>`,
    `<h2>Command surface</h2>`,
    `<ul>${commandsList}</ul>`,
    `</section>`,
    `<section>`,
    `<h2>${escapeHtml(differentiators.heading)}</h2>`,
    `<ul>${differentiatorsList}</ul>`,
    `</section>`,
    `<section>`,
    `<h2>Links</h2>`,
    `<ul>${linksList}</ul>`,
    `</section>`,
    `</main>`,
  ].join('');
}

export function bodyBake(): Plugin {
  return {
    name: 'orion-skills-body-bake',
    // Apply only to the production build; the dev server keeps the empty root.
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        const baked = renderBakedBody(PRODUCT_DATA);
        // Fail loud if the rendered body is empty/headingless — prefer a hard
        // build failure over silently shipping a blank crawler body.
        if (!/<h1[ >]/.test(baked) || !/<p[ >]/.test(baked)) {
          throw new Error(
            'body-bake: rendered body is missing an <h1> or <p> — refusing to emit empty crawler content',
          );
        }
        // Use a replacer function so any `$` in `baked` (dynamic data) is treated
        // literally, not as a `$&`/`$1`/etc. replacement pattern.
        const replaced = html.replace(
          /<div id="root">\s*<\/div>/,
          () => `<div id="root">${baked}</div>`,
        );
        if (replaced === html) {
          // Fail loud at build time if the root anchor ever changes shape.
          throw new Error(
            'body-bake: could not find `<div id="root"></div>` to inject crawlable body content',
          );
        }
        return replaced;
      },
    },
  };
}
