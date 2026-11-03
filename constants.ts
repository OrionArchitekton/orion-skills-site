import { ProductData } from './types';

const GITHUB = 'https://github.com/OrionArchitekton/orion-skills';
const VERSION = 'v0.7.1';
const RELEASE = GITHUB + '/releases/tag/' + VERSION;
const AGENTSKILLS = 'https://www.agentskills.io';
const CODEX_VERIFIED_REF = 'c334ca499beed06892ba0a51b2698ce75e4a3e05';
const CODEX_SKILLS_ROOT = GITHUB + '/tree/' + CODEX_VERIFIED_REF + '/skills';

/**
 * Single source of truth for the orion-skills microsite.
 *
 * All copy is GROUNDED in the real repo (README.md, the skills/ catalog, and the
 * latest GitHub release). orion-skills is a curated skills LIBRARY (not a CLI or
 * package): the full library targets Claude Code and an exact three-skill starter
 * set is verified for Codex. No fabricated metrics or broad compatibility claims.
 */
export const PRODUCT_DATA: ProductData = {
  name: 'orion-skills',
  tagline:
    'A curated library of disciplined Agent Skills for Claude Code, with a verified Codex starter set for stale-premise, control-binding, and live-deploy proof.',
  credibility:
    'Open source (MIT) · 29 skills for Claude Code · 3 verified for Codex · Optional Claude Code plugin · No plugin marketplace.',
  canonical: 'https://www.danmercede.com/works/orion-skills/',
  metaDescription:
    'orion-skills is a curated, MIT-licensed library of 29 Agent Skills for Claude Code, plus a verified three-skill Codex starter set for stale-premise, control-binding, and live-deploy proof. Direct install or optional Claude Code plugin loading; no plugin marketplace.',

  family: {
    prefix: 'Part of',
    name: 'Cosmocrat OS',
    url: 'https://www.cosmocrat.ai/',
    description: 'Independent installation identifiers, releases, license and support boundaries.',
    workflowLabel: 'Choose a workflow',
    workflowUrl: 'https://www.cosmocrat.ai/docs',
  },

  problem: {
    heading: 'The problem',
    body:
      'An autonomous coding agent will happily say “done” before runtime is verified, edit outside the scope you set, lose the lesson it just learned, and bloat its base prompt with procedures it rarely needs. The gap isn’t capability — it’s discipline: the boring, high-leverage habits a senior engineer applies without thinking.',
  },

  whatItDoes: {
    heading: 'What it is',
    body:
      'A curated collection of Orion-authored and adapted workflow skills. This catalog describes the 29 skills in v0.7.1; GitHub main may contain unreleased changes. The full library targets Claude Code, subject to each skill’s host requirements and source notices. The Codex starter set is the exact three portable verification disciplines validated by the source project. Each is a folder with a SKILL.md that loads on demand when the task matches, keeping specialized procedure out of the base prompt.',
  },

  cta: {
    primaryLabel: 'View on GitHub',
    primaryUrl: GITHUB,
    secondaryLabel: 'Read the ' + VERSION + ' release',
    secondaryUrl: RELEASE,
  },

  quickstart: {
    heading: 'Install',
    intro:
      'Choose your host. Run the Claude Code copy commands from the extracted v0.7.1 source archive linked in the release above; review each skill’s setup and source notices. Claude Code can load the full library from ~/.claude/skills/. Codex users can install the verified three-skill starter set directly from GitHub. The Codex requests are pinned to reviewed source c334ca4; run each installer request as a separate Codex prompt. If one skill already exists, inspect or deliberately update that installation, then continue with the other prompts; one existing destination cannot prevent the other skills from being installed. Claude Code also offers optional session-local plugin loading from the same archive. No plugin marketplace is required.',
    pluginNote:
      'Optional plugin loading was validated for discovery on Claude Code 2.1.316; native model execution remains unqualified. Invoke bundled skills as /orion-skills:pre-pr. Loading adds no hooks or MCP servers and grants no permissions. Research requires a compatible Workflow tool; delegate plugin-only execution is unsupported.',
    blocks: [
      {
        title: 'Claude Code: one skill',
        command: ['cp -r skills/ship ~/.claude/skills/ship'].join('\n'),
      },
      {
        title: 'Claude Code: all 29 skills',
        command: ['cp -r skills/* ~/.claude/skills/'].join('\n'),
      },
      {
        title: 'Claude Code: optional plugin',
        note: 'use the absolute path to the extracted v0.7.1 archive',
        command: 'claude --plugin-dir "/absolute/path/to/orion-skills-0.7.1"',
      },
      {
        title: 'Codex CLI: re-probe stale premises',
        note: 'run as its own Codex prompt',
        command:
          '$skill-installer Install ' + CODEX_SKILLS_ROOT + '/reprobe-stale-premise',
      },
      {
        title: 'Codex CLI: prove a control binds',
        note: 'run as its own Codex prompt',
        command:
          '$skill-installer Install ' + CODEX_SKILLS_ROOT + '/prove-control-binds',
      },
      {
        title: 'Codex CLI: prove a deploy is live',
        note: 'run as its own Codex prompt',
        command:
          '$skill-installer Install ' + CODEX_SKILLS_ROOT + '/prove-deploy-is-live',
      },
    ],
  },

  codexStarter: [
    'reprobe-stale-premise',
    'prove-control-binds',
    'prove-deploy-is-live',
  ],

  // The skill catalog — verified against README.md + the skills/ directory.
  commands: [
    {
      name: 'readonly',
      description:
        // Literal releases force re-verification when VERSION changes:
        // v0.6.0 first shipped the hook; v0.7.1 retains it and its selftest.
        'Structural read-only session mode: sets a marker a PreToolUse hook reads to DENY the file-editing tools (Edit/Write/MultiEdit/NotebookEdit) until cleared. The hook ships on main and in the v0.7.1 release, executable, with a selftest that proves it denies. It first shipped in v0.6.0; v0.5.0 and earlier do not include it. Copying the skill does not arm it, you register the hook in your own settings; even then the hook stays inert until you set the marker with the bundled readonly-mode.sh helper. Shell writes via Bash stay outside the matcher.',
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
      name: 'reassert-guards-on-rewrite',
      description:
        'Traces original guards through a rewrite and probes denial before the protected effect on every affected entry point. Includes a synthetic tenant-write example.',
    },
    {
      name: 'apply-review-findings',
      description:
        'Revalidates attributed findings at the current target, records evidence-backed dispositions, and binds final verification to immutable source.',
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
      name: 'orion-deep-research',
      description:
        'Research workflow with honest abstention accounting, a bounded knowledge-gap loop, a judge gate and durable cited reports. The executable requires a compatible Claude Workflow tool; native execution support is unqualified. Dan Mercede attests that it was independently built with Claude’s assistance. See the research provenance notice below for the author record and its evidence limits.',
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
    {
      name: 'tdd-loop',
      description:
        'Drives a spec to a CI-green PR through a self-correcting RED→GREEN→REFACTOR loop where every “green” binds to an artifact — a computed diff fed to review, a clean secret-scan report, a captured test exit code — never self-reporting. Self-contained and harness-agnostic.',
    },
    {
      name: 'oss-loop',
      description:
        'Carries an OSS tool from idea to a shipped, published release through one operator-gates-only loop — the agent does everything reversible, a human touches only the irreversible gates (publish, merge, tag, DNS, secrets). Composes your prompt, research, TDD, and launch skills; verifies the live source of truth before “shipped”.',
    },
    {
      name: 'chain-launcher',
      description:
        'After a research/decision plan is approved, surfaces the exact next command for the implement phase so it isn’t re-derived — a frictionless handoff that never auto-crosses the human approval gate.',
    },
    {
      name: 'tools-router',
      description:
        'A periodic recon builds a low-token, auth-aware index of the CLIs and MCP servers an agent can reach — preferring a working CLI over its MCP — and a thin fail-open hook injects it. Redundancy is judged by which side actually works (never existence), and probe output is captured as redacted enums, never raw secrets.',
    },
    {
      name: 'prove-deploy-is-live',
      description:
        'Proves a deploy is actually live via three proofs (version identity, real-route serve, end-to-end behavior), because green CI, docker ps healthy, and /health 200 all stay green while the running artifact is the old image or the real route is dead. Self-contained and harness-agnostic.',
    },
    {
      name: 'prove-control-binds',
      description:
        'Proves a gate, hook, monitor, or reaper actually fires by injecting a synthetic violation and watching it block from its own output, never by trusting a green check. Green has two indistinguishable causes: nothing to catch, or catching nothing.',
    },
    {
      name: 'design-fail-closed-gate',
      description:
        'Authors unattended and self-policed gates that fail CLOSED by construction: gate on a structured token not free-text prose, bind every green to a re-readable artifact, respect how the harness inverts exit-code semantics, and prove the gate denies before calling it armed.',
    },
    {
      name: 'author-workflow-fanout',
      description:
        'Lints a Claude Code Workflow fan-out script before launch: flags an agent() call with no .catch (one rate-limited call rejects the whole run), a budget loop unguarded on budget.total (it runs to the 1000-agent cap), and a missing meta block, and covers the pipeline-vs-barrier and schema-vs-longform judgment a linter cannot.',
    },
    {
      name: 'reprobe-stale-premise',
      description:
        'Re-probe any claim you did not just verify before acting on it: a handoff premise, a teammate diagnosis, a stale registry state. Any unverified claim is a hypothesis, not a fact.',
    },
    {
      name: 'triage-fanout-verdicts',
      description:
        'Read multi-agent fan-out verdicts honestly: an abstention or crashed lens is PENDING, never a verdict. Ships a deterministic triage helper that buckets ship/refute/pending.',
    },
    {
      name: 'office-hours',
      description:
        'YC-style product ideation with six forcing questions, wedge and specificity pressure, and a builder brainstorm mode. Saves a design doc before any code is written.',
    },
    {
      name: 'investigate',
      description:
        'Systematic debugging in four phases with an Iron Law: no fixes without root cause. For errors, stack traces, and it-was-working-yesterday troubleshooting.',
    },
    {
      name: 'design-consultation',
      description:
        'A full design-system consultation covering aesthetic, typography, color, layout, and motion. Produces DESIGN.md as the project design source of truth.',
    },
    {
      name: 'document-release',
      description:
        'Post-ship documentation sync. Reads all project docs, cross-references the diff, and updates README and friends to match what actually shipped.',
    },
    {
      name: 'delegate',
      description:
        'Hands a scoped subagent, bulk, or background task to a non-Anthropic model CLI (Codex on a ChatGPT plan, Grok on a metered xAI key, or a free local model via Ollama) so it runs off the Anthropic budget with native tool calling, behind a sandbox and env-scrub gate. Shells out to each vendor CLI, not an ANTHROPIC_BASE_URL router-proxy.',
    },
    {
      name: 'grokbot',
      description:
        'Hands a task to a bot in xAI’s Grok Bot desktop app through the documented routine webhook, and gets the result back through an outbox file the bot writes with the app’s local execution, so no UI is touched. Also reads any bot’s chat from the app’s local cache. It never resends a task that might already be running.',
    },
  ],

  demo: {
    heading: 'How it works',
    intro:
      'The full Claude Code library uses slash-command invocation or description matching. Codex exposes the verified starter skills with its native $skill-name invocation after installation.',
    lines: [
      { kind: 'comment', text: '# Direct install — Claude Code auto-loads ~/.claude/skills/' },
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
        title: 'Direct install or optional plugin',
        body:
          'Claude Code loads copied folders from ~/.claude/skills/. Codex installs the verified starter set directly from the source repository. Claude Code also supports optional plugin loading from the v0.7.1 checkout or extracted archive. No plugin marketplace is required.',
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
    { label: VERSION + ' release', url: RELEASE, primary: true },
    { label: 'Research provenance notice', url: GITHUB + '/blob/267c68eacdd09581e60baa9bb4a6642722efe704/skills/orion-deep-research/PROVENANCE.md' },
    { label: 'What are Agent Skills?', url: AGENTSKILLS },
    { label: 'Dan Mercede', url: 'https://www.danmercede.com' },
  ],

  footerNote: 'MIT licensed. Built by Dan Mercede.',
};
