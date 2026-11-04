import type { Context } from '@/renderer/figure/components/component';
import { type Field, type Fields, readFields } from '@/renderer/figure/components/field';
import { BLOCK_NAMES } from '@/renderer/figure/components/names';
import { type AnyDefinition, DEFINITIONS } from '@/renderer/figure/components/registry';
import { type FigureData, type FigureNode, ID, LIMITS, type Param, type Step } from '@/renderer/figure/FigureData';
import { texAnchors, texIn, texProblems } from '@/renderer/figure/figureTex';
import { formatFigure } from '@/renderer/figure/formatFigure';
import { count as n, isObject, over, own, type Plain } from '@/renderer/figure/plain';

class Invalid extends Error {}

function fail(path: string, message: string): never {
  throw new Invalid(`${path}: ${message}`);
}


/**
 * Reads what a figure program returned. The data is a structured clone from a realm the model controls, so it is checked
 * value by value: only plain data passes, props are read with `Object.hasOwn`, and nothing received is spread or assigned.
 */
export function validateFigure(raw: unknown): { ok: true; figure: FigureData } | { ok: false; error: string } {
  try {
    checkPlain(raw);
    return { ok: true, figure: readFigure(raw) };
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, error: error.message };
    throw error;
  }
}

/** Accepts only null, undefined (read as absent), booleans, finite numbers, strings, dense arrays and plain objects, acyclic and within the limits. */
function checkPlain(raw: unknown): void {
  let visits = 0;
  let text = 0;
  const stack = new Set<object>();
  // A finished subtree's cost, so a shared one is counted on every visit without walking it again.
  const done = new Map<object, { visits: number; text: number; height: number }>();
  const add = (moreVisits: number, moreText: number): void => {
    visits += moreVisits;
    text += moreText;
    // Shared references count on every visit: `a = [a, a]` 32 times is acyclic and 2^32 visits.
    if (visits > LIMITS.cloneVisits) fail('Figure', `more than ${n(LIMITS.cloneVisits)} values; the limit is ${n(LIMITS.cloneVisits)}`);
    if (text > LIMITS.text) fail('Figure', `more than ${LIMITS.text / 1024} KiB of text; the limit is ${LIMITS.text / 1024} KiB`);
  };
  /** Returns the height of the subtree under `value`. */
  const visit = (value: unknown, depth: number): number => {
    if (typeof value !== 'object' || value === null) {
      if (typeof value === 'number' && !Number.isFinite(value)) fail('Figure', `a number is ${value}; numbers must be finite`);
      if (value !== null && value !== undefined && typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string') fail('Figure', `a ${typeof value} cannot be drawn`);
      add(1, typeof value === 'string' ? value.length : 0);
      return 0;
    }
    if (stack.has(value)) fail('Figure', 'the data holds a cycle');
    const seen = done.get(value);
    if (seen) {
      add(seen.visits, seen.text);
      if (depth + seen.height > LIMITS.cloneDepth) fail('Figure', `data nested deeper than ${LIMITS.cloneDepth} levels`);
      return seen.height;
    }
    if (depth > LIMITS.cloneDepth) fail('Figure', `data nested deeper than ${LIMITS.cloneDepth} levels`);
    const proto: unknown = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (proto !== Array.prototype) fail('Figure', 'an array of an unknown kind cannot be drawn');
      for (let i = 0; i < value.length; i += 1) if (!Object.hasOwn(value, i)) fail('Figure', 'an array has holes');
    } else if (proto !== Object.prototype && proto !== null) {
      fail('Figure', `a ${Object.prototype.toString.call(value).slice(8, -1)} cannot be drawn`);
    }
    const before = { visits, text };
    add(1, 0);
    stack.add(value);
    let height = 0;
    for (const key of Object.keys(value)) height = Math.max(height, 1 + visit((value as Record<string, unknown>)[key], depth + 1));
    stack.delete(value);
    done.set(value, { visits: visits - before.visits, text: text - before.text, height });
    return height;
  };
  visit(raw, 0);
}

function onlyKeys(object: Plain, allowed: readonly string[], path: string, what: string): void {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) fail(path, `unknown prop "${key}"; ${what} takes ${allowed.join(', ')}`);
  }
}

function readFigure(raw: unknown): FigureData {
  if (!isObject(raw)) fail('Figure', 'the program returned no figure');
  onlyKeys(raw, ['params', 'title', 'frames'], 'Figure', 'a figure');
  const frames = own(raw, 'frames');
  if (!Array.isArray(frames) || frames.length === 0) fail('Figure', 'no steps');
  if (frames.length > LIMITS.steps) fail('Figure', over(frames.length, 'steps', LIMITS.steps));
  const title = own(raw, 'title');
  const figure = { elements: 0 };
  const steps = frames.map((frame, i) => readStep(frame, i, frames.length, figure));
  return {
    ...(title === undefined || title === null || title === '' ? {} : { title: plainString(title, 'Figure', 'title') }),
    params: readParams(own(raw, 'params')),
    steps,
  };
}

function plainString(value: unknown, path: string, what: string): string {
  if (typeof value !== 'string') fail(path, `${what} must be text`);
  if (value.length > LIMITS.string) fail(path, `${what} is ${over(value.length, 'characters', LIMITS.string)}`);
  return value;
}

const PARAM_KEY = /^[A-Za-z_$][\w$]{0,63}$/;

function readParams(raw: unknown): Param[] {
  if (raw === undefined || raw === null) return [];
  if (!isObject(raw)) fail('Figure', 'params must be an object');
  const keys = Object.keys(raw);
  if (keys.length > LIMITS.params) fail('Figure', over(keys.length, 'params', LIMITS.params));
  return keys.map((key): Param => {
    const path = `Figure > params.${key}`;
    if (!PARAM_KEY.test(key)) fail('Figure', `params name "${key}" is not a name`);
    const spec = raw[key];
    if (!isObject(spec)) fail(path, 'must be an object');
    const label = plainString(own(spec, 'label') ?? key, path, 'label');
    const problem = label.includes('$') ? texProblems(label) : undefined;
    if (problem) fail(path, problem);
    if (own(spec, 'text') === true) {
      onlyKeys(spec, ['label', 'value', 'text'], path, 'a text field');
      return { kind: 'text', key, label, value: plainString(own(spec, 'value') ?? '', path, 'value') };
    }
    if (Object.hasOwn(spec, 'options')) {
      onlyKeys(spec, ['label', 'options', 'value'], path, 'a choice');
      const options = own(spec, 'options');
      if (!Array.isArray(options) || options.length === 0) fail(path, 'options must be a list');
      if (options.length > LIMITS.options) fail(path, over(options.length, 'options', LIMITS.options));
      const read = options.map((option) => text(option, path, 'an option'));
      const value = own(spec, 'value') ?? read[0];
      if (!read.includes(value as string | number)) fail(path, 'value is not one of its options');
      return { kind: 'choice', key, label, options: read, value: value as string | number };
    }
    onlyKeys(spec, ['label', 'min', 'max', 'step', 'value', 'unit'], path, 'a slider');
    const min = number(own(spec, 'min'), path, 'min');
    const max = number(own(spec, 'max'), path, 'max');
    if (!(min < max)) fail(path, 'min must be below max');
    const step = own(spec, 'step') === undefined ? (max - min) / 100 : number(own(spec, 'step'), path, 'step');
    if (!(step > 0)) fail(path, 'step must be above 0');
    const value = own(spec, 'value') === undefined ? min : number(own(spec, 'value'), path, 'value');
    const unit = own(spec, 'unit');
    return { kind: 'slider', key, label, min, max, step, value, ...(unit === undefined ? {} : { unit: plainString(unit, path, 'unit') }) };
  });
}

function number(value: unknown, path: string, what: string): number {
  if (typeof value !== 'number') fail(path, `${what} must be a number`);
  return value;
}

function text(value: unknown, path: string, what: string): string | number {
  if (typeof value === 'number') return value;
  return plainString(value, path, what);
}

/** What one step's walk collects. */
interface StepScope {
  ids: Map<string, string>;
  targets: { path: string; id: string; what: string }[];
  anchors: number;
  elements: number;
}

function readStep(frame: unknown, index: number, count: number, figure: { elements: number }): Step {
  const path = `Step ${index + 1}`;
  if (!isObject(frame)) fail(path, 'a step must be an object');
  onlyKeys(frame, ['caption', 'heading', 'root'], path, 'a step');
  const scope: StepScope = { ids: new Map(), targets: [], anchors: 0, elements: 0 };
  const text = (key: 'caption' | 'heading'): string => {
    const value = own(frame, key) ?? '';
    if (typeof value !== 'string' && typeof value !== 'number') fail(path, `the ${key} must be text`);
    const shown = typeof value === 'number' ? formatFigure(value) : value;
    checkCaption(shown, path, `the ${key}`);
    return shown;
  };
  const shown = text('caption');
  if (count > 1 && !shown.trim()) fail(path, 'a caption is required when a figure has two or more steps');
  const heading = text('heading').trim();
  const root = readElement(own(frame, 'root'), path, 1, null, OUTSIDE, scope) as FigureNode;
  for (const target of scope.targets) {
    if (!scope.ids.has(target.id)) fail(target.path, `${target.what} "${target.id}" names no element, row, item or node in this step`);
  }
  figure.elements += scope.elements;
  if (figure.elements > LIMITS.elementsPerFigure) fail('Figure', `more than ${n(LIMITS.elementsPerFigure)} elements; the limit is ${n(LIMITS.elementsPerFigure)}`);
  return { caption: shown, ...(heading ? { heading } : {}), root, ids: new Set(scope.ids.keys()) };
}

/** Checks the maths in a caption or heading; its anchors cannot be pointed at, so they need only be ids. */
function checkCaption(value: string, path: string, what: string): void {
  if (value.length > LIMITS.string) fail(path, `${what} is ${over(value.length, 'characters', LIMITS.string)}`);
  // Renderers pair `$` signs differently, so a forbidden command anywhere in a string with maths fails, whatever the pairing.
  const problem = value.includes('$') ? texProblems(value) : undefined;
  if (problem) fail(path, problem);
  for (const tex of texIn(value)) for (const anchor of texAnchors(tex)) if (!ID.test(anchor)) fail(path, `anchor "${anchor}" is not an id`);
}

function claim(id: unknown, path: string, scope: StepScope): string {
  if (typeof id !== 'string' || !ID.test(id)) fail(path, `id ${JSON.stringify(id)} is not an id: 1 to 64 letters, digits and _.:- starting with a letter or digit`);
  const first = scope.ids.get(id);
  if (first !== undefined) fail(path, `id "${id}" is used twice in this step (first at ${first})`);
  scope.ids.set(id, path);
  return id;
}

/** Outside a drawing, where no point is read. */
const OUTSIDE: Context = { dimension: 2, why: 'a figure is 2D outside a 3D Plot' };

/** Each element's props: the fields of all its variants. */
const PROPS = new Map([...DEFINITIONS.values()].map((definition) => [definition.name, [...new Set([...Object.keys(definition.fields ?? {}), ...Object.values(definition.variants ?? {}).flatMap((variant) => Object.keys(variant.fields))])]]));

/** Where each element may go, for a message about one placed elsewhere. */
const HOMES = new Map([...DEFINITIONS.keys()].map((name) => [name, [...DEFINITIONS.values()].filter((definition) => definition.children?.includes(name)).map((definition) => definition.name)]));

type Node = { type: string; children?: Node[] } & Record<string, unknown>;

/**
 * Reads one element by its definition: where it may go, its props by its fields, its children, then the rules across them.
 * `container` is the element it is in, null at the top of a step; `context` is what that container set.
 */
function readElement(raw: unknown, parent: string, depth: number, container: AnyDefinition | null, context: Context, scope: StepScope): Node {
  if (!isObject(raw) || typeof own(raw, 'type') !== 'string') fail(parent, 'expected an element');
  onlyKeys(raw, ['type', 'props', 'children'], parent, 'an element');
  const type = raw.type as string;
  const props = own(raw, 'props') ?? {};
  const children = own(raw, 'children') ?? [];
  if (!isObject(props)) fail(parent, `<${type}> has props that are not an object`);
  if (!Array.isArray(children)) fail(parent, `<${type}> has children that are not a list`);
  if (type === 'Figure') fail(parent, 'Figure is returned once, outermost');
  const definition = DEFINITIONS.get(type);
  if (!definition) fail(parent, `unknown element <${type}>`);
  const rawId = own(props, 'id');
  const path = `${parent} > ${type}${typeof rawId === 'string' ? `#${rawId}` : ''}`;
  if (depth > LIMITS.depth) fail(path, `nesting depth ${depth}; the limit is ${LIMITS.depth}`);
  scope.elements += 1;
  if (scope.elements > LIMITS.elementsPerStep) fail(path, `more than ${n(LIMITS.elementsPerStep)} elements in a step; the limit is ${n(LIMITS.elementsPerStep)}`);
  onlyKeys(props, PROPS.get(type)!, path, type);

  const allowed: readonly string[] = container?.children ?? BLOCK_NAMES;
  if (!allowed.includes(type)) {
    if ((BLOCK_NAMES as readonly string[]).includes(type)) fail(path, `${type} cannot go inside a ${container!.name}`);
    const homes = `${type} goes only inside a ${HOMES.get(type)!.join(' or a ')}`;
    fail(path, container ? `${type} cannot go inside a ${container.name}; ${homes}` : `${type} is a layer: ${homes}`);
  }
  if (children.length && !definition.children && !definition.textChildren) fail(path, `${type} takes no children`);

  const inner = definition.context?.({ props, children }) ?? context;
  const variants = Object.entries(definition.variants ?? {});
  const variant = variants.find(([, candidate]) => candidate.dimension === inner.dimension);
  if (variants.length && !variant) fail(path, `${type} is ${variants.map(([, candidate]) => candidate.dimension).join(' or ')}D only; ${inner.why}`);
  const fields = variant ? variant[1].fields : definition.fields ?? {};
  const read = readFields(fields, definition.textChildren ? withTextChildren(props, children, definition.textChildren, path) : props);
  if (!read.ok) fail(path, `${read.prop} ${read.message}`);
  const node: Node = { type: variant ? variant[0] : type, ...read.value };

  for (const key of Object.keys(fields)) walk(fields[key], node[key], key, path, context, scope);
  for (const id of definition.ids?.(node) ?? []) claim(id, path, scope);
  if (definition.children) {
    // Bare text where a Text may go is a paragraph.
    const prose = definition.children.includes('Text');
    node.children = children.map((child) => readElement(prose && (typeof child === 'string' || typeof child === 'number') ? { type: 'Text', props: { text: child }, children: [] } : child, path, depth + 1, definition, inner, scope));
  }
  definition.check?.(node, { context: inner, fail: (message) => fail(path, message) });
  return node;
}

/** `<Text>...</Text>`: text children read as the prop `key`. */
function withTextChildren(props: Plain, children: unknown[], key: string, path: string): Plain {
  if (!children.length) return props;
  if (own(props, key) !== undefined) fail(path, `give its ${key} as a prop or as children, not both`);
  const joined = children.map((child) => (typeof child === 'number' ? formatFigure(child) : typeof child === 'string' ? child : fail(path, `${key} children must be text`))).join('');
  return { ...Object.fromEntries(Object.keys(props).map((name) => [name, props[name]])), [key]: joined };
}

/** The step pass over one read field: ids and anchors join the step, targets and tag keys wait for its end, points match the drawing. */
function walk(field: Field, value: unknown, key: string, path: string, context: Context, scope: StepScope): void {
  if (value === undefined || value === null) return;
  switch (field.kind) {
    case 'id':
      if (typeof value === 'string') claim(value, path, scope);
      return;
    case 'text':
      if (typeof value === 'string') for (const tex of texIn(value)) anchors(texAnchors(tex), path, scope);
      return;
    case 'tex':
      if (typeof value === 'string') anchors(texAnchors(value), path, scope);
      return;
    case 'target':
      if (typeof value === 'string') scope.targets.push({ path, id: value, what: key });
      return;
    case 'tags':
      if (value instanceof Map) for (const id of value.keys() as Iterable<string>) scope.targets.push({ path, id, what: 'tags' });
      return;
    case 'point': {
      const size = context.dimension === 3 ? 3 : 2;
      if (Array.isArray(value) && value.length !== size) fail(path, `${key} holds a point with ${value.length} coordinates; ${context.why}, so every point is ${size === 3 ? '[x, y, z]' : '[x, y]'}`);
      return;
    }
    case 'optional':
      walk(field.of!, value, key, path, context, scope);
      return;
    case 'list':
      if (Array.isArray(value)) for (const item of value) walk(field.of!, item, key, path, context, scope);
      return;
    case 'object':
      if (isObject(value)) for (const name of Object.keys(field.shape!)) walk((field.shape as Fields)[name], own(value, name), key, path, context, scope);
      return;
    case 'either':
      for (const option of field.options!) walk(option, value, key, path, context, scope);
      return;
    default:
  }
}

function anchors(names: readonly string[], path: string, scope: StepScope): void {
  for (const anchor of names) {
    scope.anchors += 1;
    if (scope.anchors > LIMITS.anchorsPerStep) fail(path, over(scope.anchors, 'TeX anchors', LIMITS.anchorsPerStep));
    claim(anchor, path, scope);
  }
}
