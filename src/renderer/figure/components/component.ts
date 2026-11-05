import type { Fields, Read } from '@/renderer/figure/components/field';

export { field, keyedMarks, marks } from '@/renderer/figure/components/field';

export type Dimension = 2 | 3;

/** What a container sets for its children before they are read: a drawing's dimension, and why, for messages. */
export interface Context {
  dimension: Dimension;
  why: string;
}

/** A child as a definition's `check` sees it; its exact type is the view's concern. */
export type Child = { readonly type: string; readonly id?: string } & Readonly<Record<string, unknown>>;

export interface CheckContext {
  context: Context;
  fail: (message: string) => never;
}

/** One node shape of an element, picked by the dimension its context sets. */
export interface Variant<F extends Fields = Fields> {
  dimension: Dimension;
  fields: F;
}

type NodeIn<Type, F extends Fields, C> = { readonly type: Type } & Read<F> & (C extends readonly string[] ? { readonly children: readonly Child[] } : unknown);
/** The node `check` reads: one per variant, told apart by `type`. */
type CheckNode<Name, F extends Fields, V, C> = [keyof V] extends [never] ? NodeIn<Name, F, C> : { [K in keyof V & string]: V[K] extends Variant ? NodeIn<K, V[K]['fields'], C> : never }[keyof V & string];

/**
 * One element the model can write. `fields` (or `variants`, one per node shape) declare its props; `children` names the
 * elements it may hold. See `docs/specs/figure-components.md` for each member.
 */
export interface Definition<Name extends string = string, F extends Fields = Fields, V extends Readonly<Record<string, Variant>> = Readonly<Record<string, Variant>>, C extends readonly string[] | undefined = readonly string[] | undefined> {
  readonly name: Name;
  readonly summary: string;
  readonly signature?: string;
  readonly guidance?: readonly string[];
  readonly fields?: F;
  readonly variants?: V;
  readonly children?: C;
  /** The prop its text children are read into, as `<Text>...</Text>` is. */
  readonly textChildren?: keyof F & string;
  context?(raw: { props: Readonly<Record<string, unknown>>; children: readonly unknown[] }): Context;
  check?(node: CheckNode<Name, F, V, C>, ctx: CheckContext): void;
  /** Ids it owns besides its `field.id()` values, such as a Table's cells. */
  ids?(node: CheckNode<Name, F, V, C>): readonly string[];
  /** Ids a `Pointer` marks beside this element; the view keeps a lane for them over every step. */
  pointable?(node: CheckNode<Name, F, V, C>): readonly string[];
}

export function component<const Name extends string, const F extends Fields = Fields, const V extends Readonly<Record<string, Variant>> = Record<never, never>, const C extends readonly string[] | undefined = undefined>(definition: Definition<Name, F, V, C>): Definition<Name, F, V, C> {
  return definition;
}
