export interface Link {
  label: string;
  url: string;
  primary?: boolean;
}

export interface CommandRow {
  /** The command/sub-command label, e.g. "scan". */
  name: string;
  /** Short description of what the command does. */
  description: string;
}

export interface DemoLine {
  /** "command" lines render as the typed shell input; "output" lines as program output. */
  kind: 'command' | 'output' | 'comment';
  text: string;
  /** Optional emphasis for a key result line (e.g. PASS / FAIL). */
  tone?: 'ok' | 'fail' | 'muted';
}

export interface ProductData {
  name: string;
  tagline: string;
  credibility: string;
  /** Canonical URL of this microsite. */
  canonical: string;
  /** SEO meta description. */
  metaDescription: string;
  problem: {
    heading: string;
    body: string;
  };
  whatItDoes: {
    heading: string;
    body: string;
  };
  cta: {
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel: string;
    secondaryUrl: string;
  };
  quickstart: {
    heading: string;
    intro: string;
    /** Each block is a titled, copy-pasteable command snippet. */
    blocks: { title: string; note?: string; command: string }[];
  };
  commands: CommandRow[];
  demo: {
    heading: string;
    intro: string;
    lines: DemoLine[];
  };
  differentiators: {
    heading: string;
    points: { title: string; body: string }[];
  };
  links: Link[];
  footerNote: string;
}
