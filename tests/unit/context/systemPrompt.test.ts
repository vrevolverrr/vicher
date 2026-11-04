import { splitReply } from '@/chat/splitReply';
import { buildSystemPrompt } from '@/context/systemPrompt';
import { type AnyDefinition, COMPONENTS, DEFINITIONS } from '@/renderer/figure/components/registry';
import { promptFields, signatureOf } from '@/renderer/figure/figurePrompt';
import { WORKER_SOURCE } from '@/renderer/figure/sandboxSource';
import { validateFigure } from '@/renderer/figure/validateFigure';

import { runFigureWorker } from '../../runFigureWorker';

const definitions = COMPONENTS as readonly AnyDefinition[];

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt();

  it.each(definitions.map((definition) => [definition.name, definition] as const))('writes <%s> with every prop it takes in its signature', (_, definition) => {
    const signature = signatureOf(definition);
    const missing = promptFields(definition).map(([name]) => name).filter((name) => !new RegExp(`[\\s{(,]${name}(?=[\\s=/>,}])`).test(signature));

    expect(prompt).toContain(`\`${signature}\``);
    expect(missing).toEqual([]);
  });

  it('names only elements that have a definition', () => {
    const elements = prompt.slice(prompt.indexOf('### Elements'), prompt.indexOf('Construction functions'));
    const named = new Set([...elements.matchAll(/`<([A-Z][A-Za-z]*)/g)].map((match) => match[1]));

    expect([...named].filter((name) => !DEFINITIONS.has(name))).toEqual([]);
    expect(named.size).toBe(definitions.length);
  });

  it('gives an example figure that runs and validates', async () => {
    const example = splitReply(prompt, true).filter((segment) => segment.kind === 'figure').at(-1)!;
    const result = validateFigure(await runFigureWorker(WORKER_SOURCE, { kind: 'run', source: example.text, params: {} }));
    expect(result.ok ? 'ok' : result.error).toBe('ok');
  });
});

describe('the component registry', () => {
  it('has one definition per name, and every child it names is a definition', () => {
    expect(DEFINITIONS.size).toBe(definitions.length);
    expect(definitions.flatMap((definition) => (definition.children ?? []).filter((name) => !DEFINITIONS.has(name)))).toEqual([]);
  });

  it('keeps zod and the definitions out of the worker', () => {
    expect(WORKER_SOURCE).not.toMatch(/zod|\$ZodType|summary:/);
  });
});
