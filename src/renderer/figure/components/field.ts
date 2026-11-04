import * as z from 'zod/mini';

import { ID, LIMITS, type Point, type Range } from '@/renderer/figure/FigureData';
import { texProblems } from '@/renderer/figure/figureTex';
import { formatFigure } from '@/renderer/figure/formatFigure';
import { count, isObject } from '@/renderer/figure/plain';
import { TAGS, type Tag } from '@/renderer/figure/Tag';

export type Kind =
  | 'id' | 'text' | 'tex' | 'tag' | 'tags' | 'target' | 'ref' | 'point' | 'range' | 'number' | 'boolean' | 'literal' | 'choice'
  | 'list' | 'object' | 'either' | 'optional' | 'unused' | 'sampled';

/**
 * One prop of an element: its zod schema, which writes every message in the contract's words, and what the step pass, the
 * prompt and the node types need to know of it. `T` is its value once read; `O` marks a field the model may leave out.
 */
export interface Field<T = unknown, O extends boolean = boolean> {
  readonly kind: Kind;
  readonly schema: z.ZodMiniType;
  readonly optional: O;
  /** The prop's prompt note. */
  readonly note?: string;
  /** The field inside an optional, list or sampled field; the fields of an either. */
  readonly of?: Field;
  readonly options?: readonly Field[];
  readonly shape?: Readonly<Record<string, Field>>;
  readonly values?: readonly unknown[];
  doc(note: string): Field<T, O>;
  /** Never set: carries `T` for the node types. */
  readonly out?: T;
}

export type Fields = Readonly<Record<string, Field>>;

/** A field's value once read. */
export type Out<F> = F extends Field<infer T> ? T : never;

/** The node an element's fields read to: unused fields left out, optional ones optional. */
export type Read<F extends Fields> = Flat<
  { readonly [K in keyof F as F[K] extends Field<never> ? never : F[K] extends Field<unknown, false> ? K : never]: Out<F[K]> }
  & { readonly [K in keyof F as F[K] extends Field<never> ? never : F[K] extends Field<unknown, false> ? never : K]?: Out<F[K]> }
>;
type More = Omit<Partial<Field>, 'optional' | 'doc' | 'kind' | 'schema' | 'out'>;
type Flat<T> = { [K in keyof T]: T[K] } & {};

const isNumber = (value: unknown): value is number => typeof value === 'number';

function make<T, O extends boolean>(kind: Kind, schema: z.ZodMiniType, optional: O, more: More = {}): Field<T, O> {
  return { kind, schema, optional, ...more, doc: (note) => make(kind, schema, optional, { ...more, note }) };
}

/**
 * A leaf kind: `guard` says whether the value has the right type, `wrong` what it must be, `problem` any further fault, and
 * `read` the value it reads to. A message is a predicate the validator puts after the prop's name ("must be text").
 */
function leaf<T>(kind: Kind, guard: (value: unknown) => boolean, wrong: string, problem?: (value: never) => string | undefined, read: (value: never) => T = (value) => value, more: More = {}): Field<T, false> {
  const schema = z.pipe(
    z.custom((value) => guard(value), { error: (issue) => (issue.input === undefined ? `is required and ${wrong}` : wrong) }),
    z.transform((value, payload) => {
      const message = problem?.(value as never);
      if (message === undefined) return read(value as never);
      payload.issues.push({ code: 'custom', message, input: value });
      return z.NEVER;
    }),
  );
  return make(kind, schema, false, more);
}

function textProblem(value: string, whole = false): string | undefined {
  if (value.length > LIMITS.string) return `is ${count(value.length)} characters; the limit is ${count(LIMITS.string)}`;
  // Renderers pair `$` signs differently, so a forbidden command anywhere in a string with maths fails, whatever the pairing.
  const problem = whole || value.includes('$') ? texProblems(value) : undefined;
  return problem && `breaks the TeX rule: ${problem}`;
}

const isPoint = (value: unknown): boolean => Array.isArray(value) && (value.length === 2 || value.length === 3) && value.every(isNumber);

export const field = {
  /** 1 to 64 characters matching `[A-Za-z0-9][A-Za-z0-9_.:-]*`, unique in its step. */
  id: (): Field<string, false> =>
    leaf('id', (value) => typeof value === 'string', 'must be an id', (value: string) => (ID.test(value) ? undefined : `is ${JSON.stringify(value)}, which is not an id: 1 to 64 letters, digits and _.:- starting with a letter or digit`)),

  /** Markdown with `$…$` maths; a number is formatted to text. */
  text: (): Field<string, false> =>
    leaf('text', (value) => typeof value === 'string' || isNumber(value), 'must be text', (value: string | number) => (typeof value === 'string' ? textProblem(value) : undefined), (value: string | number) => formatFigure(value)),

  /** A displayed formula: TeX as it is, not Markdown. */
  tex: (): Field<string, false> =>
    leaf('tex', (value) => typeof value === 'string' && value.trim() !== '', 'must be TeX', (value: string) => textProblem(value, true)),

  tag: (): Field<Tag, false> => leaf('tag', (value) => (TAGS as readonly unknown[]).includes(value), `must be one of ${TAGS.join(', ')}`),

  /** A map from ids in the step to tags; a null or undefined tag is left out. */
  tags: (): Field<ReadonlyMap<string, Tag>, false> => leaf('tags', isObject, 'must be an object of id: tag', (value: Record<string, unknown>) => {
    for (const key of Object.keys(value)) {
      const tag = value[key];
      if (tag !== null && tag !== undefined && !(TAGS as readonly unknown[]).includes(tag)) return `has a tag for "${key}" that is not one of ${TAGS.join(', ')}`;
    }
    return undefined;
  }, (value: Record<string, unknown>) => new Map(Object.keys(value).flatMap((key) => (value[key] === null || value[key] === undefined ? [] : [[key, value[key] as Tag]])))),

  /** An id that another element must hold in this step. */
  target: (): Field<string, false> => leaf('target', (value) => typeof value === 'string', 'must be an id'),

  /** A name its container checks, such as the Fn a Region shades to. */
  ref: (): Field<string, false> => leaf('ref', (value) => typeof value === 'string', 'must be a name'),

  /** [x, y], or [x, y, z] in a 3D Plot; the validator checks the count against the drawing. */
  point: (): Field<Point, false> => leaf('point', isPoint, 'must be a point [x, y], or [x, y, z] in a 3D Plot', undefined, (value: number[]) => [...value] as unknown as Point),

  /** `[low, high]` with low below high and a finite span. */
  range: (): Field<Range, false> => leaf('range', (value) => Array.isArray(value) && value.length === 2 && value.every(isNumber) && value[0] < value[1] && Number.isFinite(value[1] - value[0]), 'must be [low, high] with low below high', undefined, (value: number[]) => [value[0], value[1]] as const),

  number: ({ above, min, max, whole = false }: { above?: number; min?: number; max?: number; whole?: boolean } = {}): Field<number, false> => {
    const wrong = whole ? `must be a whole number from ${min} to ${max}` : above !== undefined ? `must be a number above ${above}` : 'must be a number';
    return leaf('number', (value) => isNumber(value) && (above === undefined || value > above) && (!whole || (Number.isInteger(value) && value >= min! && value <= max!)), wrong);
  },

  boolean: (): Field<boolean, false> => leaf('boolean', (value) => typeof value === 'boolean', 'must be true or false'),

  literal: <const V extends string | number | boolean | null>(value: V): Field<V, false> => leaf('literal', (given) => given === value, `must be ${JSON.stringify(value)}`),

  choice: <const V extends string>(values: readonly V[]): Field<V, false> => leaf('choice', (value) => (values as readonly unknown[]).includes(value), `must be one of ${values.join(', ')}`, undefined, undefined, { values }),

  /** `max` is a limit the model is told of by its message; `min` and `length` are part of the shape. */
  list: <T>(of: Field<T>, { max, min = 0, length }: { max?: number; min?: number; length?: number } = {}): Field<readonly T[], false> => {
    const schema = z.pipe(z.pipe(
      z.custom((value) => Array.isArray(value), { error: (issue) => (issue.input === undefined ? 'is required and must be a list' : 'must be a list') }),
      z.transform((value, payload) => {
        const items = value as unknown[];
        const message = max !== undefined && items.length > max ? `holds ${count(items.length)}; the limit is ${count(max)}`
          : length !== undefined && items.length !== length ? `must hold ${length}, not ${count(items.length)}`
            : items.length < min ? `needs at least ${min}` : undefined;
        if (message === undefined) return items;
        payload.issues.push({ code: 'custom', message, input: value });
        return z.NEVER;
      }),
    ), z.array(of.schema));
    return make('list', schema, false, { of });
  },

  /** A plain object with exactly these keys, each its own field. */
  object: <const S extends Fields>(shape: S): Field<Read<S>, false> => {
    const keys = Object.keys(shape);
    const form = `{${keys.join(', ')}}`;
    const schema = z.strictObject(Object.fromEntries(keys.map((key) => [key, shape[key].schema])), {
      error: (issue) => (issue.code === 'unrecognized_keys' ? `has unknown key ${issue.keys.map((key) => JSON.stringify(key)).join(', ')}; it takes ${keys.join(', ')}` : `must be ${form}`),
    });
    return make('object', z.pipe(schema, z.transform(dropAbsent)), false, { shape });
  },

  either: <A, B>(a: Field<A>, b: Field<B>, wrong: string): Field<A | B, false> =>
    make('either', z.union([a.schema, b.schema], { error: (issue) => (issue.input === undefined ? `is required and ${wrong}` : wrong) }), false, { options: [a as Field, b as Field] }),

  /** Absent when undefined or null. */
  optional: <T>(of: Field<T>): Field<T, true> => make('optional', z.optional(z.nullable(of.schema)), true, { of, note: of.note }),

  /** A prop this element refuses with `reason`, such as `z` on a 2D Plot; it never reaches the node. */
  unused: (reason: string): Field<never, true> => make('unused', z.optional(leaf('unused', (value) => value === undefined || value === null, reason).schema), true),

  /** Data the worker samples from a function the program gave; the prompt never names it. */
  sampled: <T>(guard: (value: unknown) => boolean, wrong: string): Field<T, false> => leaf<T>('sampled', guard, wrong),
};

/** An object read by zod keeps a key given as null; the validator reads null as absent. */
function dropAbsent(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.keys(value).flatMap((key) => (value[key] === null || value[key] === undefined ? [] : [[key, value[key]]])));
}

/** Each element's props schema, built once. */
const SCHEMAS = new WeakMap<Fields, z.ZodMiniType<Record<string, unknown>>>();

/** Reads an element's props with `fields`: the value, or the first issue as a prop path and a message. */
export function readFields(fields: Fields, props: Record<string, unknown>): { ok: true; value: Record<string, unknown> } | { ok: false; prop: string; message: string } {
  let schema = SCHEMAS.get(fields);
  if (!schema) {
    schema = z.pipe(z.object(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.schema]))), z.transform(dropAbsent));
    SCHEMAS.set(fields, schema);
  }
  const result = z.safeParse(schema, props);
  if (result.success) return { ok: true, value: result.data };
  const issue = result.error.issues[0];
  const prop = issue.path.map((part, i) => (typeof part === 'number' ? `[${part}]` : i === 0 ? String(part) : `.${String(part)}`)).join('');
  return { ok: false, prop, message: issue.message };
}
