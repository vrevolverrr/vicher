import { Arrow } from '@/renderer/figure/components/Arrow';
import { Column } from '@/renderer/figure/components/Column';
import type { Definition, Dimension, Variant } from '@/renderer/figure/components/component';
import { Diagram } from '@/renderer/figure/components/Diagram';
import type { Fields, Read } from '@/renderer/figure/components/field';
import { Fn } from '@/renderer/figure/components/Fn';
import { Graph } from '@/renderer/figure/components/Graph';
import { Angle, Circle, Dimension as DimensionMark, Label, Points, RightAngle, Segment, Shape, Tick, Vector } from '@/renderer/figure/components/layers';
import { BLOCK_NAMES, LINK_NAMES } from '@/renderer/figure/components/names';
import { Node } from '@/renderer/figure/components/Node';
import { Panel } from '@/renderer/figure/components/Panel';
import { Plot } from '@/renderer/figure/components/Plot';
import { Pointer } from '@/renderer/figure/components/Pointer';
import { Quiz } from '@/renderer/figure/components/Quiz';
import { Region } from '@/renderer/figure/components/Region';
import { Row } from '@/renderer/figure/components/Row';
import { Seq } from '@/renderer/figure/components/Seq';
import { Table } from '@/renderer/figure/components/Table';
import { Tex } from '@/renderer/figure/components/Tex';
import { Text } from '@/renderer/figure/components/Text';
import type { Point, Point3 } from '@/renderer/figure/FigureData';

/** Every element the model can write, in the prompt's order. */
export const COMPONENTS = [
  Row, Column, Panel, Table, Seq, Node, Text, Tex, Graph, Quiz, Arrow, Pointer, Plot, Diagram,
  Shape, Circle, Vector, Segment, Points, Label, Fn, Region, Angle, RightAngle, Tick, DimensionMark,
] as const;

export type AnyDefinition = Definition<string, Fields, Readonly<Record<string, Variant>>, readonly string[] | undefined>;

export const DEFINITIONS: ReadonlyMap<string, AnyDefinition> = new Map(COMPONENTS.map((definition) => [definition.name, definition as AnyDefinition]));

type Defs = (typeof COMPONENTS)[number];
export type ElementName = Defs['name'];
type DefOf<N> = Extract<Defs, { name: N }>;

/** A drawing's layer types in 3D: every point has three coordinates. */
type Lift3<T> = T extends Point ? Point3 : T extends ReadonlyMap<unknown, unknown> ? T : T extends readonly (infer U)[] ? readonly Lift3<U>[] : T extends object ? { [K in keyof T]: Lift3<T[K]> } : T;

/** `Dim` is the drawing a child is in, or 'any' outside one. */
type Shaped<Type, F extends Fields, C, Dim> = { readonly type: Type } & Read<F> & ([NonNullable<C>] extends [never] ? unknown : { readonly children: readonly ChildNode<NonNullable<C> extends readonly (infer Name)[] ? Name : never, Dim>[] });

type Lifted<T, Dim> = Dim extends 3 ? Lift3<T> : T;

/** The node types one element reads to, in a drawing of dimension `Dim`, or anywhere with 'any'. */
type ChildNode<Name, Dim> = Name extends unknown ? (DefOf<Name> extends infer D extends Defs ? NodesOf<D, NonNullable<D["variants"]>, Dim> : never) : never;
type NodesOf<D extends Defs, V, Dim> = [keyof V] extends [never]
  ? Lifted<Shaped<D['name'], NonNullable<D['fields']>, D['children'], 'any'>, Dim>
  : { [K in keyof V & string]: V[K] extends Variant<infer VF> ? (Dim extends Dimension ? (V[K]['dimension'] extends Dim ? Shaped<K, VF, D['children'], V[K]['dimension']> : never) : Shaped<K, VF, D['children'], V[K]['dimension']>) : never }[keyof V & string];

/** What a step, a Row, a Column or a Panel holds. */
export type BlockNode = ChildNode<(typeof BLOCK_NAMES)[number], 'any'>;
export type PlotLayer = ChildNode<NonNullable<(typeof Plot)['children']>[number], 2>;
export type Plot3Layer = ChildNode<NonNullable<(typeof Plot)['children']>[number], 3>;
export type DiagramLayer = ChildNode<NonNullable<(typeof Diagram)['children']>[number], 2>;
export type AnyNode = BlockNode | PlotLayer | Plot3Layer | DiagramLayer;
export type NodeType = AnyNode['type'];
export type NodeOf<K extends NodeType> = Extract<AnyNode, { type: K }>;

/** The definition behind each node type: a variant's node type maps to its element. */
export const NODE_DEFINITIONS: ReadonlyMap<string, AnyDefinition> = new Map([...DEFINITIONS.values()].flatMap((definition) => [definition.name, ...Object.keys(definition.variants ?? {})].map((type) => [type, definition] as const)));

/** Node types whose children are blocks; any other node's children are a drawing's layers. */
export const BLOCK_CONTAINERS: ReadonlySet<string> = new Set([...NODE_DEFINITIONS].flatMap(([type, definition]) => (definition.children?.every((name) => (BLOCK_NAMES as readonly string[]).includes(name)) ? [type] : [])));

export const isLink = (node: AnyNode): node is NodeOf<(typeof LINK_NAMES)[number]> => (LINK_NAMES as readonly string[]).includes(node.type);
