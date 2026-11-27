import { ProductDemo } from './ProductDemo';
import React, { useEffect, useState } from 'react';
import { PRODUCT_DATA } from './constants';
import type { CommandRow, DemoLine } from './types';

type BudgetModeId = 'ondemand' | 'starter' | 'preloaded';
type SkillCategoryId = 'all' | 'gates' | 'verification' | 'workflow' | 'ops';

interface BudgetMode {
  id: BudgetModeId;
  label: string;
  tokens: number;
  budget: number;
  widthClass: string;
  barClass: string;
  pctLabel: string;
  savedLabel: string;
  note: string;
}

const BUDGET_MODES: BudgetMode[] = [
  {
    id: 'ondemand',
    label: 'On-Demand (1 Active)',
    tokens: 1150,
    budget: 8500,
    widthClass: 'w-[14%]',
    barClass: 'bg-[#4ADE80]',
    pctLabel: '13.5%',
    savedLabel: '7,350 tokens saved',
    note: 'Only 32 short descriptions live in the base prompt; one matching SKILL.md loads when invoked.',
  },
  {
    id: 'starter',
    label: 'Starter Set (3 Active)',
    tokens: 2100,
    budget: 8500,
    widthClass: 'w-1/4',
    barClass: 'bg-[#E68249]',
    pctLabel: '24.7%',
    savedLabel: '6,400 tokens saved',
    note: 'Three verification disciplines loaded together for stale-premise, control-binding, and deploy proof.',
  },
  {
    id: 'preloaded',
    label: 'Preloaded (All 32)',
    tokens: 8500,
    budget: 8500,
    widthClass: 'w-full',
    barClass: 'bg-[#F87171]',
    pctLabel: '100%',
    savedLabel: '0 tokens saved',
    note: 'Eagerly injecting every procedure upfront consumes 8,500 tokens before the first tool call.',
  },
];

const SKILL_CATEGORIES: Record<string, SkillCategoryId> = {
  readonly: 'gates',
  'scope-guard': 'gates',
  ship: 'verification',
  'pre-pr': 'verification',
  'reassert-guards-on-rewrite': 'gates',
  'apply-review-findings': 'verification',
  'incident-as-code': 'ops',
  'learn-capture': 'workflow',
  'goal-prompt': 'workflow',
  'orion-deep-research': 'workflow',
  'pre-compact': 'workflow',
  x: 'ops',
  gist: 'ops',
  'tdd-loop': 'verification',
  'oss-loop': 'ops',
  'chain-launcher': 'workflow',
  'tools-router': 'ops',
  'prove-deploy-is-live': 'verification',
  'prove-control-binds': 'verification',
  'design-fail-closed-gate': 'gates',
  'author-workflow-fanout': 'gates',
  'reprobe-stale-premise': 'verification',
  'triage-fanout-verdicts': 'verification',
  'office-hours': 'workflow',
  investigate: 'verification',
  'design-consultation': 'workflow',
  'document-release': 'ops',
  delegate: 'ops',
  grokbot: 'ops',
  'orion-web-director': 'workflow',
  'orion-frontend-builder': 'workflow',
  'web-render-reviewer': 'verification',
};

const CATEGORY_OPTIONS: Array<{ id: SkillCategoryId; label: string }> = [
  { id: 'all', label: 'All (32)' },
  { id: 'gates', label: 'Gates & Safety' },
  { id: 'verification', label: 'Verification & QA' },
  { id: 'workflow', label: 'Workflow & Research' },
  { id: 'ops', label: 'Ops & Publishing' },
];

const SectionTitle: React.FC<{ index: string; title: string; id?: string }> = ({
  index,
  title,
  id,
}) => (
  <div className="mb-5 border-b border-[#334155] pb-3">
    <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#F0975A]">
      <span aria-hidden="true">Module {index}</span>
    </p>
    <h2 id={id} className="mt-1 font-display text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
      {title}
    </h2>
  </div>
);

/** Copy-pasteable command block with a copy button (no-JS safe: renders disabled without JS). */
const CommandBlock: React.FC<{ title: string; note?: string; command: string }> = ({
  title,
  note,
  command,
}) => {
  const [copied, setCopied] = useState(false);
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    setCanCopy(Boolean(navigator.clipboard));
  }, []);

  const copy = () => {
    if (canCopy && navigator.clipboard) {
      navigator.clipboard
        .writeText(command)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        })
        .catch(() => {
          setCopied(false);
        });
    }
  };

  return (
    <div className="rounded-lg border border-[#334155] bg-[#091638] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[#F8FAFC]">{title}</span>
        {note && <span className="font-mono text-xs text-[#94A3B8]">{note}</span>}
      </div>
      <div className="relative">
        <pre
          tabIndex={0}
          className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-[#334155] bg-[#040D24] p-4 pr-20 font-mono text-[13px] leading-relaxed text-[#F8FAFC]"
        >
          <code>{command}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          disabled={!canCopy}
          aria-disabled={!canCopy}
          className="no-print absolute top-2 right-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-[#64748B] bg-[#102252] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#F8FAFC] transition-colors hover:border-[#F0975A] hover:text-[#FFC08B] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Copy command: ${title}`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

const demoLineClass = (line: DemoLine): string => {
  if (line.kind === 'comment') return 'text-[#94A3B8]';
  if (line.kind === 'command') return 'font-medium text-[#F8FAFC]';
  if (line.tone === 'ok') return 'font-semibold text-[#4ADE80]';
  if (line.tone === 'fail') return 'font-semibold text-[#F87171]';
  if (line.tone === 'muted') return 'text-[#CBD5E1]';
  return 'text-[#E2E8F0]';
};

const App: React.FC = () => {
  const {
    name,
    tagline,
    credibility,
    family,
    problem,
    whatItDoes,
    cta,
    quickstart,
    codexStarter,
    commands,
    demo,
    differentiators,
    links,
    footerNote,
  } = PRODUCT_DATA;

  const [interactiveReady, setInteractiveReady] = useState(false);
  const [budgetModeId, setBudgetModeId] = useState<BudgetModeId>('ondemand');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SkillCategoryId>('all');

  useEffect(() => {
    setInteractiveReady(true);
  }, []);

  const activeBudget = BUDGET_MODES.find((m) => m.id === budgetModeId) ?? BUDGET_MODES[0];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCommands: CommandRow[] = commands.filter((cmd) => {
    const category = SKILL_CATEGORIES[cmd.name] ?? 'workflow';
    if (activeCategory !== 'all' && category !== activeCategory) return false;
    if (!normalizedQuery) return true;
    return (
      cmd.name.toLowerCase().includes(normalizedQuery) ||
      cmd.description.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="min-h-screen bg-[#040D24] text-[#F8FAFC] selection:bg-[#E68249] selection:text-[#020B29]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-[#E68249] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#020B29] focus:no-underline"
      >
        Skip to main content
      </a>

      <header className="border-b border-[#334155] bg-[#040D24]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.danmercede.com/works"
                className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.16em] text-[#F0975A] hover:text-[#FFC08B] hover:underline"
              >
                danmercede.com / works
              </a>
              <span className="hidden text-[#64748B] sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
                Interactive Sandbox
              </span>
            </div>

            <nav aria-label="Sandbox sections" className="flex flex-wrap items-center gap-2">
              <a
                href="#token-budget"
                className="inline-flex min-h-[44px] items-center rounded px-3 font-mono text-xs text-[#CBD5E1] transition-colors hover:bg-[#091638] hover:text-[#FFC08B]"
              >
                Token Budget
              </a>
              <a
                href="#install"
                className="inline-flex min-h-[44px] items-center rounded px-3 font-mono text-xs text-[#CBD5E1] transition-colors hover:bg-[#091638] hover:text-[#FFC08B]"
              >
                Install
              </a>
              <a
                href="#catalog"
                className="inline-flex min-h-[44px] items-center rounded px-3 font-mono text-xs text-[#CBD5E1] transition-colors hover:bg-[#091638] hover:text-[#FFC08B]"
              >
                Catalog (32)
              </a>
            </nav>
          </div>

          <p className="border-t border-[#1E293B] pt-3 text-xs leading-relaxed text-[#CBD5E1]">
            {family.prefix}{' '}
            <a
              className="text-[#F0975A] underline underline-offset-4 hover:text-[#FFC08B]"
              href={family.url}
            >
              {family.name}
            </a>
            . {family.description}{' '}
            <a
              className="text-[#F0975A] underline underline-offset-4 hover:text-[#FFC08B]"
              href={family.workflowUrl}
            >
              {family.workflowLabel}
            </a>
            .
          </p>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-14 px-5 py-10 md:px-8">
        {/* Split Hero + Token-Budget Visualizer */}
        <section aria-labelledby="hero-title" className="grid grid-cols-1 gap-8 border-b border-[#334155] pb-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#F0975A]">
              OPEN SOURCE · MIT · PROGRESSIVE DISCLOSURE
            </div>
            <h1
              id="hero-title"
              className="font-display text-4xl font-bold leading-tight tracking-tight text-[#F8FAFC] sm:text-5xl"
            >
              {name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#E2E8F0] sm:text-xl">
              {tagline}
            </p>
            <p className="mt-3 font-mono text-xs leading-relaxed text-[#94A3B8]">
              {credibility}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={cta.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#E68249] px-5 py-2.5 text-sm font-semibold text-[#020B29] transition-colors hover:bg-[#F0975A]"
              >
                {cta.primaryLabel}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href={cta.secondaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#091638] px-5 py-2.5 text-sm font-medium text-[#F8FAFC] transition-colors hover:border-[#F0975A] hover:text-[#FFC08B]"
              >
                {cta.secondaryLabel}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>

          {/* Progressive Token-Budget Visualizer */}
          <aside
            id="token-budget"
            aria-label="Progressive token-budget visualizer"
            className="rounded-lg border border-[#334155] bg-[#091638] p-5 lg:col-span-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#F0975A]">
                Token-Budget Visualizer
              </p>
              <span className="font-mono text-xs tabular-nums text-[#CBD5E1]">
                8,500 Baseline
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#CBD5E1]">
              Compare monolithic prompt loading (8,500 tokens) against on-demand skill loading.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {BUDGET_MODES.map((mode) => {
                const isSelected = mode.id === activeBudget.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setBudgetModeId(mode.id)}
                    disabled={!interactiveReady}
                    aria-disabled={!interactiveReady}
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? 'inline-flex min-h-[44px] items-center rounded border border-[#E68249] bg-[#E68249] px-3 py-1.5 font-mono text-xs font-semibold text-[#020B29]'
                        : 'inline-flex min-h-[44px] items-center rounded border border-[#64748B] bg-[#102252] px-3 py-1.5 font-mono text-xs text-[#F8FAFC] transition-colors hover:border-[#F0975A] hover:text-[#FFC08B] disabled:cursor-not-allowed disabled:opacity-70'
                    }
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-3 rounded-md border border-[#334155] bg-[#040D24] p-4">
              <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                <span className="text-[#F8FAFC]">{activeBudget.label}</span>
                <span className="tabular-nums text-[#F0975A]">
                  {activeBudget.tokens.toLocaleString('en-US')} / 8,500 tokens ({activeBudget.pctLabel})
                </span>
              </div>

              <div
                role="progressbar"
                aria-label="Prompt token budget consumption"
                aria-valuemin={0}
                aria-valuemax={8500}
                aria-valuenow={activeBudget.tokens}
                className="h-3 w-full overflow-hidden rounded bg-[#102252]"
              >
                <div className={`h-full rounded ${activeBudget.barClass} ${activeBudget.widthClass}`} />
              </div>

              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#94A3B8]">8,500 token comparison cap</span>
                <span className="font-semibold text-[#4ADE80]">{activeBudget.savedLabel}</span>
              </div>
              <p className="text-xs leading-relaxed text-[#CBD5E1]">{activeBudget.note}</p>
            </div>
          </aside>
        </section>

        {/* Problem & What It Is */}
        <section aria-labelledby="heading-problem" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionTitle index="01" title={problem.heading} id="heading-problem" />
            <p className="text-base leading-relaxed text-[#E2E8F0]">{problem.body}</p>
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#091638] p-6 lg:col-span-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#F0975A]">
              {whatItDoes.heading}
            </p>
            <p className="mt-3 text-base font-medium leading-relaxed text-[#F8FAFC]">
              {whatItDoes.body}
            </p>
          </div>
        </section>

        {/* Product Demo & CLI Sandbox */}
        <section aria-labelledby="heading-demo" className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-6">
            <ProductDemo />
          </div>
          <div className="rounded-lg border border-[#334155] bg-[#091638] p-5 sm:p-6 lg:col-span-6">
            <h2 id="heading-demo" className="font-display text-2xl font-bold text-[#F8FAFC]">
              {demo.heading}
            </h2>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-[#CBD5E1]">{demo.intro}</p>
            <div className="overflow-hidden rounded-md border border-[#334155] bg-[#040D24]">
              <div className="no-print flex items-center gap-1.5 border-b border-[#334155] bg-[#102252] px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-[#64748B]" aria-hidden="true" />
                <span className="h-3 w-3 rounded-full bg-[#64748B]" aria-hidden="true" />
                <span className="h-3 w-3 rounded-full bg-[#64748B]" aria-hidden="true" />
                <span className="ml-2 font-mono text-xs text-[#CBD5E1]">skills-session</span>
              </div>
              <pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed">
                {demo.lines.map((line, idx) => (
                  <div key={idx} className={demoLineClass(line)}>
                    {line.kind === 'command' && !line.text.startsWith('  ') ? (
                      <span className="select-none text-[#94A3B8]" aria-hidden="true">
                        ${' '}
                      </span>
                    ) : null}
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </section>

        {/* Install / Quickstart */}
        <section id="install" aria-labelledby="heading-install">
          <SectionTitle index="02" title={quickstart.heading} id="heading-install" />
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[#CBD5E1]">
            {quickstart.intro}
          </p>
          <p className="mb-6 max-w-3xl rounded-lg border border-[#334155] bg-[#091638] p-4 text-sm leading-relaxed text-[#E2E8F0]">
            {quickstart.pluginNote}
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {quickstart.blocks.map((block) => (
              <CommandBlock
                key={block.title}
                title={block.title}
                note={block.note}
                command={block.command}
              />
            ))}
          </div>
        </section>

        {/* Interactive Skill Catalog Filter & Search */}
        <section id="catalog" aria-labelledby="heading-catalog">
          <SectionTitle index="03" title="All 32 Claude Code skills" id="heading-catalog" />
          <p className="mb-5 text-sm leading-relaxed text-[#CBD5E1]">
            Codex starter set:{' '}
            <span className="font-mono text-[#F8FAFC]">{codexStarter.join(' · ')}</span>
          </p>

          <div className="mb-6 rounded-lg border border-[#334155] bg-[#091638] p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-sm">
                <label
                  htmlFor="skill-search"
                  className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-[#94A3B8]"
                >
                  Filter Catalog
                </label>
                <input
                  id="skill-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 32 skills by name or discipline..."
                  className="min-h-[44px] w-full rounded-md border border-[#64748B] bg-[#040D24] px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]"
                />
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Skill categories">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      disabled={!interactiveReady}
                      aria-disabled={!interactiveReady}
                      aria-pressed={isActive}
                      className={
                        isActive
                          ? 'inline-flex min-h-[44px] items-center rounded border border-[#E68249] bg-[#E68249] px-3 py-1.5 font-mono text-xs font-semibold text-[#020B29]'
                          : 'inline-flex min-h-[44px] items-center rounded border border-[#64748B] bg-[#102252] px-3 py-1.5 font-mono text-xs text-[#F8FAFC] transition-colors hover:border-[#F0975A] hover:text-[#FFC08B] disabled:cursor-not-allowed disabled:opacity-70'
                      }
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 font-mono text-xs text-[#94A3B8]" aria-live="polite">
              Showing {filteredCommands.length} of {commands.length} skills
            </p>
          </div>

          {filteredCommands.length === 0 ? (
            <div className="rounded-lg border border-[#334155] bg-[#091638] p-6 text-sm text-[#CBD5E1]">
              <p>No skills matched your current filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                disabled={!interactiveReady}
                aria-disabled={!interactiveReady}
                className="mt-3 inline-flex min-h-[44px] items-center rounded border border-[#64748B] bg-[#102252] px-4 py-2 font-mono text-xs text-[#F8FAFC] hover:border-[#F0975A] hover:text-[#FFC08B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset catalog filters
              </button>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="flex flex-col gap-2 rounded-lg border border-[#334155] bg-[#091638] p-4 sm:p-5"
                >
                  <dt className="font-mono text-sm font-semibold text-[#F0975A]">{cmd.name}</dt>
                  <dd className="text-sm leading-relaxed text-[#E2E8F0]">{cmd.description}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Differentiators */}
        <section aria-labelledby="heading-differentiators">
          <SectionTitle index="04" title={differentiators.heading} id="heading-differentiators" />
          <div className="grid gap-5 sm:grid-cols-2">
            {differentiators.points.map((point) => (
              <div
                key={point.title}
                className="rounded-lg border border-[#334155] bg-[#091638] p-5"
              >
                <h3 className="font-display text-lg font-bold text-[#F8FAFC]">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">{point.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-[#334155] bg-[#040D24]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 font-mono text-xs text-[#94A3B8] md:px-8">
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-[#E2E8F0] underline decoration-[#64748B] underline-offset-4 transition-colors hover:text-[#FFC08B] hover:decoration-[#F0975A]"
                >
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <p>{footerNote}</p>
            <p>&copy; 2026 Dan Mercede</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
