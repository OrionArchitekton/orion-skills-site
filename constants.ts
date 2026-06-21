import { ProductData } from './types';

const GITHUB = 'https://github.com/OrionArchitekton/orion-skills';
const RELEASE = 'https://github.com/OrionArchitekton/orion-skills/releases/tag/v0.1.0';
const AGENTSKILLS = 'https://www.agentskills.io';

/**
 * Single source of truth for the orion-skills microsite.
 *
 * All copy is GROUNDED in the real repo (README.md, the skills/ catalog, and the
 * v0.1.0 GitHub release). orion-skills is a curated skills LIBRARY (not a CLI or
 * package): install = copy a folder into ~/.claude/skills/. No fabricated metrics.
 */
export const PRODUCT_DATA: ProductData = {
  name: 'orion-skills',
  tagline:
    'A curated library of original Claude Code skills for disciplined agent workflows — finish discipline, scope control, and durable handoffs, loaded on demand.',
  credibility:
    'Open source (MIT) · 10 skills · No plugin or marketplace · Loaded on demand · Engine-portable.',
  canonical: 'https://orion-skills.danmercede.com/',
  metaDescription:
    'orion-skills is a small, curated, MIT-licensed library of original Claude Code skills for disciplined agent workflows — finish discipline, scope guarding, pre-PR checks, incident-as-code, learning capture, goal-prompt authoring, and pre-compact handoffs. Each is a folder with a SKILL.md the agent loads on demand; install by copying into ~/.claude/skills/. No plugin or marketplace required.',

  problem: {
    heading: 'The problem',
    body:
      'An autonomous coding agent will happily say “done” before runtime is verified, edit outside the scope you set, lose the lesson it just learned, and bloat its base prompt with procedures it rarely needs. The gap isn’t capability — it’s discipline: the boring, high-leverage habits a senior engineer applies without thinking.',
  },

  whatItDoes: {
    heading: 'What it is',
    body:
      'A small, curated set of workflow- and finish-discipline skills — not tool wrappers. Each is a folder with a SKILL.md (YAML frontmatter plus a Markdown body) that Claude Code loads on demand when the task matches, keeping specialized procedure out of the base prompt. They encode the habits that keep an agent honest: don’t claim done until runtime is verified, don’t write outside your declared scope, capture what you learned, and turn a loose task into a fire-ready autonomous prompt.',
  },

  cta: {
    primaryLabel: 'View on GitHub',
    primaryUrl: GITHUB,
    secondaryLabel: 'Read the v0.1.0 release',
    secondaryUrl: RELEASE,
  },

  quickstart: {
    heading: 'Install',
    intro:
      'Claude Code auto-loads skills from ~/.claude/skills/ (v2.1.157+) — no marketplace or plugin required. Copy the skills you want, then invoke by name or let the model auto-invoke when the description matches.',
    blocks: [
      {
        title: 'One skill',
        command: ['cp -r skills/ship ~/.claude/skills/ship'].join('\n'),
      },
      {
        title: '…or all of them',
        command: ['cp -r skills/* ~/.claude/skills/'].join('\n'),
      },
      {
        title: 'Invoke by name in Claude Code',
        note: 'or let the model auto-invoke on match',
        command: ['/ship', '/pre-pr', '/pre-compact'].join('\n'),
      },
    ],
  },

  // The skill catalog — verified against README.md + the skills/ directory.
  commands: [
    {
      name: 'readonly',
      description:
        'Structural read-only session mode — sets a marker a PreToolUse hook reads to DENY every file-mutating tool until cleared. For an audit/census where nothing should change.',
    },
    {
      name: 'scope-guard',
      description:
        'Declares and self-audits write scope; with a paired hook, blocks out-of-scope writes mechanically. For infra or multi-file work that must stay inside a boundary.',
    },
    {
      name: 'ship',
      description:
        'Finish-discipline gates: RED/GREEN tests → PR → adversarial fail-open review → independent runtime verification before “done”.',
    },
    {
      name: 'pre-pr',
      description:
        'Repo-contract-aware preflight: detect the base branch, run repo-local checks, secret-scan the diff, and report severity-graded findings before you open a PR.',
    },
    {
      name: 'incident-as-code',
      description:
        'Closes a resolved incident by committing a docs/solutions/ doc (and a runbook when recurrent) into the affected repo — the incident isn’t closed until that lands.',
    },
    {
      name: 'learn-capture',
      description:
        'The compound loop’s closing step: filter a lesson against the non-obvious / reusable / actionable test and route it to a durable home (agent memory vs repo AGENTS.md).',
    },
    {
      name: 'goal-prompt',
      description:
        'Turns a loose task into a fire-ready autonomous goal prompt: recon-grounded, rails-locked, with a transcript-checkable terminal condition. Builds the prompt; never fires it.',
    },
    {
      name: 'pre-compact',
      description:
        'Captures a session into a persistent, queryable context pack so a fresh instance resumes from evidence, not narrative. Engine-agnostic.',
    },
    {
      name: 'x',
      description:
        'Post to X — manually or autonomously — behind a fail-closed harness: a redactor that abstains rather than leak, a per-day cap, and an arm-flag so it ships DISARMED. Direct OAuth1.0a, stdlib-only.',
    },
    {
      name: 'gist',
      description:
        'Publish an embeddable PUBLIC gist of already-public content — fetched over the unauthenticated raw URL so world-readability is structural, not a promise. Redactor backstop, per-day cap, ships DISARMED.',
    },
  ],

  demo: {
    heading: 'How it works',
    intro:
      'Install is a copy; invocation is a slash command (or an auto-invoke when the model sees a matching task). Each skill loads its full procedure only when used.',
    lines: [
      { kind: 'comment', text: '# Install — Claude Code auto-loads ~/.claude/skills/ (no plugin, no marketplace)' },
      { kind: 'command', text: 'cp -r skills/* ~/.claude/skills/' },
      { kind: 'output', text: '' },
      { kind: 'comment', text: '# Invoke by name — or let the model auto-invoke when the task matches:' },
      { kind: 'command', text: '/ship' },
      { kind: 'output', text: '→ RED/GREEN tests · PR · adversarial review · runtime verify — before “done”', tone: 'muted' },
      { kind: 'command', text: '/pre-pr' },
      { kind: 'output', text: '→ detect base branch · run repo checks · secret-scan the diff · severity-graded report', tone: 'muted' },
      { kind: 'command', text: '/pre-compact' },
      { kind: 'output', text: '→ verify what shipped · write a durable context pack · point LATEST.md at it', tone: 'ok' },
    ],
  },

  differentiators: {
    heading: 'Why it is different',
    points: [
      {
        title: 'Discipline, not tools',
        body:
          'These don’t wrap an API or a service. They encode the finish-discipline habits that keep an autonomous agent honest — verify before “done”, stay inside declared scope, capture the lesson — extracted from real production operator workflows.',
      },
      {
        title: 'No plugin, no marketplace',
        body:
          'Native ~/.claude/skills/ loading (Claude Code v2.1.157+). Copying a folder is the install. The skills are plain Markdown plus a SKILL.md, so the pattern is engine-portable.',
      },
      {
        title: 'Loaded on demand',
        body:
          'A sharp description is the only thing the model sees when deciding to invoke — so a skill is pulled in only when the task matches, keeping specialized procedure out of the base prompt (progressive disclosure).',
      },
      {
        title: 'Curated and opinionated',
        body:
          'A small, deliberately-bounded set — not a sprawling community catalog. New-skill PRs are generally declined on purpose; the value is the curation.',
      },
    ],
  },

  links: [
    { label: 'GitHub repository', url: GITHUB, primary: true },
    { label: 'v0.1.0 release', url: RELEASE, primary: true },
    { label: 'What are Agent Skills?', url: AGENTSKILLS },
    { label: 'Dan Mercede', url: 'https://www.danmercede.com' },
  ],

  footerNote: 'MIT licensed. Built by Dan Mercede.',
};
