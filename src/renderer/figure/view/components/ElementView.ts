import type { FigureNode } from '@/renderer/figure/FigureData';
import type { ColorOf } from '@/renderer/figure/marks';
import type { Markdown, Marks } from '@/renderer/figure/view/dom';

/** The pointers one Seq, Table or Tex holds in its busiest step, the longest name's length, and every step's names. */
export type Lane = { count: number; name: number; names: string[] };

/** What the core gives a view to draw one instance of its element. */
export interface DrawContext<P = unknown> {
  /** The width a Plot, Graph or Diagram draws at now. */
  readonly width: number;
  /** What the view's `prepare` returned over this element's instances in every step. */
  readonly prepared: P | undefined;
  /** Room the core keeps for the pointers at this element, over every step. */
  readonly lane: Lane | undefined;
  /** Renders figure text: Markdown and `$…$` maths, through the host. */
  readonly markdown: Markdown;
  /** Renders a displayed formula. */
  tex(el: HTMLElement, tex: string): void;
  /** Sets `el`'s figure id, and its marks: those of `own`, each else the one the step's `groups` and `states` give the id. */
  mark<T extends HTMLElement>(el: T, id?: string, own?: { group?: string; state?: string }): T;
  /** The marks the step's `groups` and `states` give an id. */
  marksOf(id: string): Marks;
  /** A name's colour in this figure. */
  colorOf: ColorOf;
  child(className: string, parent: HTMLElement): HTMLElement;
  /** Draws the blocks a container holds into `parent`. */
  blocks(nodes: readonly FigureNode[], parent: HTMLElement): void;
  /** State that survives step changes and param reruns, kept per instance. */
  keep<T>(name: string): { get(): T | undefined; set(value: T): void };
  /** This instance's drawings in the other steps repaint: now if shown, else when shown. */
  stale(): void;
  /** Sends a message as the student's; false when the chat cannot take one now. */
  readonly send?: (message: string) => boolean;
}

export interface Drawn {
  /** Called on resize, when a step becomes visible after one, and once text renders have settled. */
  repaint?(): void;
  /** Called when the step is shown or hidden. */
  active?(shown: boolean): void;
  destroy?(): void;
}

/** The view half of a definition: draws one node into `el`, a fresh `div` the core placed. */
export interface ElementView<N, P = unknown> {
  /** One result over this element's instances in every step, given what an earlier draw prepared. */
  prepare?(nodes: readonly N[], kept: P | undefined): P;
  /** The prepared result must hold every param value, so the program runs across each param's range before it settles. */
  readonly holdsRange?: true;
  draw(el: HTMLElement, node: N, ctx: DrawContext<P>): Drawn | void;
}
