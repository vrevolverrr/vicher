import type { BlockNode, NodeOf } from '@/renderer/figure/components/registry';
import type { Tag } from '@/renderer/figure/Tag';

export const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
export const LIMITS = {
  steps: 64, elementsPerStep: 4000, elementsPerFigure: 20000, string: 2000, text: 512 * 1024,
  tableRows: 64, tableColumns: 16, anchorsPerStep: 64, seqItems: 128, graphNodes: 128, graphEdges: 512,
  layers: 256, layerPoints: 2000, shapePoints: 256, params: 8, options: 12, quizOptions: 8,
  depth: 32, cloneDepth: 80, source: 64 * 1024, runMs: 2000, replyWaitMs: 2500, workers: 4,
  figuresPerReply: 4, repairError: 500, fnSamples: 161, cloneVisits: 2_000_000, startMs: 5000,
  surfaceCells: 48, surfaces: 4,
} as const;

export type Point = readonly [number, number];
export type Point3 = readonly [number, number, number];
export type Range = readonly [number, number];
export type Tags = ReadonlyMap<string, Tag>;
/** A table cell, a Seq label or any other shown value: Markdown, numbers formatted when read. */
export type Text = string;

export type Param =
  | { kind: 'slider'; key: string; label: string; min: number; max: number; step: number; value: number; unit?: string }
  | { kind: 'choice'; key: string; label: string; options: readonly (string | number)[]; value: string | number }
  | { kind: 'text'; key: string; label: string; value: string };

export interface FigureData {
  title?: string;
  params: readonly Param[];
  steps: readonly Step[];
}

export interface Step {
  caption: string;
  /** A few words naming the step, shown above its caption. */
  heading?: string;
  root: FigureNode;
  /** Every id this step's links and tags can name: elements, rows, cells, items, nodes, edges and TeX anchors. */
  ids: ReadonlySet<string>;
}

export type { DiagramLayer, Plot3Layer, PlotLayer } from '@/renderer/figure/components/registry';
/** What a step, a Row, a Column or a Panel holds; its types come from `components/registry.ts`. */
export type FigureNode = BlockNode;
export type GraphNode = NodeOf<'Graph'>['nodes'][number];
export type GraphEdge = NodeOf<'Graph'>['edges'][number];
