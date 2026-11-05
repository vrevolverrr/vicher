const { existsSync } = require('fs');
const path = require('path');

/**
 * Where a file sits in the dependency hierarchy. Host code, which may use the Obsidian API and the editor, is exactly the
 * code in an `obsidian/` folder (and `main.ts`). A module (`attachments/`, `tour/`, `settings/`, `renderer/markdown/`,
 * `renderer/mermaid/`) is split into `module` (its root: no host, no DOM), `module/view` (DOM widgets) and `module/obsidian`.
 * Modules sit above the chat model and context, which never import one. `renderer/figure/` is split into `figure` (pure:
 * no DOM) and `figure/view`; it sits at the bottom, since context describes its language. Its `packages/plot/` and `packages/plot3/` are
 * self-contained packages (`plot3` builds on `plot`) that the figure root adapts to. Each zone lists the zones it may
 * import; anything else fails.
 */
const SHARED = ['shared', 'shared/view', 'shared/obsidian'];
const ALLOWED = {
  main: ['main', 'chat/obsidian', 'chat/view', 'module', 'module/view', 'module/obsidian', ...SHARED, 'context/obsidian', 'chat', 'context', 'figure', 'figure/view', 'agents'],
  'chat/obsidian': ['chat/obsidian', 'chat/view', 'module', 'module/view', 'module/obsidian', ...SHARED, 'context/obsidian', 'chat', 'context', 'figure', 'figure/view', 'agents'],
  'chat/view': ['chat/view', 'module', 'module/view', 'shared', 'shared/view', 'chat', 'context', 'figure', 'figure/view', 'agents'],
  'module/obsidian': ['module', 'module/view', 'module/obsidian', ...SHARED, 'chat', 'context', 'agents'],
  'module/view': ['module', 'module/view', 'shared', 'shared/view', 'chat', 'context'],
  module: ['module', 'chat', 'context', 'shared', 'agents'],
  shared: ['shared', 'agents', 'figure'],
  'shared/view': ['shared/view', 'shared'],
  'shared/obsidian': ['shared/obsidian', 'shared'],
  'context/obsidian': ['context/obsidian', 'shared/obsidian', 'shared', 'context'],
  chat: ['chat', 'context', 'shared', 'agents', 'figure'],
  context: ['context', 'shared', 'agents', 'figure'],
  figure: ['figure', 'plot', 'plot3'],
  'figure/view': ['figure/view', 'figure', 'plot', 'plot3'],
  plot: ['plot'],
  plot3: ['plot3', 'plot'],
  agents: ['agents'],
};
const HOST = ['main', 'chat/obsidian', 'module/obsidian', 'shared/obsidian', 'context/obsidian'];
/** The one file outside the host zones that imports Obsidian, for its icon set. */
const ICONS = 'shared/view/icon.ts';
const NO_DOM = ['chat', 'context', 'shared', 'module', 'figure', 'plot', 'plot3'];
/** Files a zone may import outside its table: the plot packages still take the figure's tag type, until phase B of `docs/specs/figure-components.md` replaces tags. */
const CROSSINGS = { plot: ['renderer/figure/Tag.ts'], plot3: ['renderer/figure/Tag.ts'] };
const MODULES = new Set(['attachments', 'tour', 'settings', 'renderer/markdown', 'renderer/mermaid']);
/** agents/ is reached only through its contract and catalogue. */
const AGENT_CONTRACT = new Set(['agents/types.ts', 'agents/providers.ts']);
const ADAPTER = /^agents\/[^/]+\/\w+(?:Model|Tool|Permission)Adapter\.ts$/;
const AGENT = /^agents\/[^/]+\/\w+Agent\.ts$/;
const PROVIDER_NAME = /claude|codex|anthropic|openai/i;

const SRC = path.join(process.cwd(), 'src');

/** The file's path inside `src/`, or null for a file outside it or not a `.ts` or `.svelte` file. */
function sourceOf(filename) {
  const relative = path.relative(SRC, filename).split(path.sep).join('/');
  return relative.startsWith('..') || !/\.(?:ts|svelte)$/.test(relative) ? null : relative;
}

function moduleOf(file) {
  const parts = file.split('/');
  return [parts[0], parts.slice(0, 2).join('/')].find((name) => MODULES.has(name)) ?? null;
}

function zoneOf(file) {
  const [top, second, third, fourth] = file.split('/');
  if (file === 'main.ts') return 'main';
  if (top === 'chat') return second === 'view' || second === 'obsidian' ? `chat/${second}` : 'chat';
  if (top === 'shared') return second === 'view' || second === 'obsidian' ? `shared/${second}` : 'shared';
  if (top === 'context') return second === 'obsidian' ? 'context/obsidian' : 'context';
  if (top === 'renderer' && second === 'figure') {
    if (third === 'view') return 'figure/view';
    return third === 'packages' && (fourth === 'plot' || fourth === 'plot3') ? fourth : 'figure';
  }
  const owner = moduleOf(file);
  if (owner) {
    const part = file.slice(owner.length + 1).split('/')[0];
    return part === 'view' || part === 'obsidian' ? `module/${part}` : 'module';
  }
  return top;
}

/** The source file an import names, inside `src/`, when it exists. */
function targetOf(file, from) {
  const raw = from.startsWith('@/') ? from.slice(2) : from.startsWith('.') ? path.posix.join(path.posix.dirname(file), from) : null;
  if (raw === null) return null;
  const base = path.posix.normalize(raw).replace(/\.(?:ts|js)$/, '');
  const candidates = base.endsWith('.svelte') ? [base] : [`${base}.ts`, `${base}/index.ts`];
  return candidates.find((candidate) => existsSync(path.join(SRC, candidate))) ?? null;
}

const isHostModule = (from) => from === 'obsidian' || from.startsWith('@codemirror/');

const layers = {
  meta: { type: 'problem', schema: [], docs: { description: 'Keeps imports inside the layer table' } },
  create(context) {
    const file = sourceOf(context.filename);
    if (!file) return {};
    const zone = zoneOf(file);
    const own = moduleOf(file);
    const check = (node) => {
      if (!node.source) return;
      const from = node.source.value;
      const report = (message) => context.report({ node: node.source, message });
      if (from.startsWith('../')) return report('Import from outside this folder through `@/`, so the layer rules see it.');
      if (isHostModule(from)) {
        if (HOST.includes(zone)) return;
        if (file === ICONS && from === 'obsidian') {
          // An import names it in `imported`, a re-export in `local`.
          const names = node.specifiers.map((specifier) => (specifier.imported ?? specifier.local)?.name);
          if (names.length === 1 && names[0] === 'setIcon') return;
          return report(`${ICONS} takes only setIcon from Obsidian.`);
        }
        return report(`\`${from}\` is host code: only an \`obsidian/\` folder or main.ts may import it.`);
      }
      const target = targetOf(file, from);
      if (!target) return;
      if (!file.startsWith('agents/') && target.startsWith('agents/') && !AGENT_CONTRACT.has(target)) {
        return report('Reach agents/ only through agents/types.ts and agents/providers.ts.');
      }
      if (ADAPTER.test(file) && (ADAPTER.test(target) || AGENT.test(target))) {
        return report('A provider adapter is independent of its sibling adapters and of the provider runtime.');
      }
      const targetZone = zoneOf(target);
      if (CROSSINGS[zone]?.includes(target)) return;
      if (!ALLOWED[zone].includes(targetZone)) return report(`Zone \`${zone}\` may not import zone \`${targetZone}\` (${target}).`);
      const otherModule = moduleOf(target);
      if (own !== null && otherModule !== null && otherModule !== own) return report(`A module never imports another module: ${own} imports ${otherModule}.`);
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
  },
};

const noDom = {
  meta: { type: 'problem', schema: [], docs: { description: 'Keeps `document` out of the pure zones' } },
  create(context) {
    const file = sourceOf(context.filename);
    if (!file || !NO_DOM.includes(zoneOf(file))) return {};
    return {
      'MemberExpression[object.type="Identifier"][object.name="document"]'(node) {
        context.report({ node, message: `Zone \`${zoneOf(file)}\` has no DOM: \`document\` belongs in a view/ or obsidian/ folder.` });
      },
    };
  },
};

const providerNames = {
  meta: { type: 'problem', schema: [], docs: { description: 'Keeps provider names in agents/' } },
  create(context) {
    const file = sourceOf(context.filename);
    if (!file || file.startsWith('agents/')) return {};
    const check = (node, text) => {
      if (typeof text === 'string' && PROVIDER_NAME.test(text)) context.report({ node, message: 'Provider names belong in agents/ code.' });
    };
    return {
      Identifier: (node) => check(node, node.name),
      Literal: (node) => check(node, node.value),
      TemplateElement: (node) => check(node, node.value.raw),
    };
  },
};

const COMPOSER_AREA = 'vicher-chat-composer-area';

/** A call that makes the composer area: some argument is an object whose `cls` names its class. */
function makesComposerArea(node) {
  return node?.type === 'CallExpression' && node.arguments.some((arg) => arg.type === 'ObjectExpression' && arg.properties.some((prop) =>
    prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'cls'
    && prop.value.type === 'Literal' && typeof prop.value.value === 'string' && prop.value.value.split(/\s+/).includes(COMPOSER_AREA)));
}

const composerArea = {
  meta: { type: 'problem', schema: [], docs: { description: 'Keeps everything but the composer out of the composer area, below the chat tabs' } },
  create(context) {
    const report = (node) => context.report({
      node,
      message: 'The composer area sits below the chat tabs (1 2 3) and holds only the Composer. Give other UI its own grid row above the tabs, as the task row and the approval card have.',
    });
    return {
      VariableDeclarator(node) {
        if (!makesComposerArea(node.init)) return;
        for (const variable of context.sourceCode.getDeclaredVariables(node)) {
          for (const ref of variable.references) {
            if (ref.init) continue;
            const parent = ref.identifier.parent;
            const intoComposer = parent.type === 'NewExpression' && parent.callee.type === 'Identifier' && parent.callee.name === 'Composer' && parent.arguments.includes(ref.identifier);
            if (!intoComposer) report(ref.identifier);
          }
        }
      },
      // The area used without a name, such as `root.createDiv({ cls: 'vicher-chat-composer-area' }).createDiv()`.
      'MemberExpression'(node) {
        if (makesComposerArea(node.object)) report(node);
      },
    };
  },
};

module.exports = { meta: { name: 'vicher-layers' }, rules: { layers, 'no-dom': noDom, 'provider-names': providerNames, 'composer-area': composerArea } };
