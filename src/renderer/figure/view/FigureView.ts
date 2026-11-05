import { flushSync, mount, unmount } from 'svelte';
import { BLOCK_CONTAINERS, isLink, NODE_DEFINITIONS } from '@/renderer/figure/components/registry';
import { computedColour, div, parseColour } from '@/renderer/figure/view/dom';
import type { DrawContext, Drawn, ElementView, Lane } from '@/renderer/figure/view/components/ElementView';
import { type DrawnType, VIEWS } from '@/renderer/figure/view/components/registry';
import { drawLinks, type Link } from '@/renderer/figure/view/drawLinks';
import { drawParams } from '@/renderer/figure/view/drawParams';
import type { FigureData, FigureNode, Param } from '@/renderer/figure/FigureData';
import { TAGS, type Tag } from '@/renderer/figure/Tag';
import { figureSandbox, type FigureSandbox } from '@/renderer/figure/view/FigureSandbox';
import { drawTex, drawTexIn, mapMath, type Rgb, type TagColour, texTags, TYPESET_MATH } from '@/renderer/figure/figureTex';
import { figureText, isPlain } from '@/renderer/figure/figureText';
import { formatFigure } from '@/renderer/figure/formatFigure';
import Playback from '@/renderer/figure/view/Playback.svelte';
import StepList from '@/renderer/figure/view/StepList.svelte';
import { validateFigure } from '@/renderer/figure/validateFigure';

export interface FigureHost {
  /** Renders Markdown into `el` with the chat's renderer; strings pass through `figureText` first. Resolves once MathJax has finished. */
  renderMarkdown(el: HTMLElement, markdown: string): Promise<void>;
  /** Draws TeX with MathJax at once; a glyph MathJax has not used before shows once `finishRenderMath` resolves. */
  renderMath(tex: string, display: boolean): HTMLElement;
  finishRenderMath(): Promise<void>;
  /** Sends a Quiz answer as the student's next message; false when the chat cannot take one now. */
  send?(message: string): boolean;
}

export type FigureOutcome = { drawn: true } | { drawn: false; error: string; repairable: boolean };

/** How long Play shows each step: long enough to read its caption. */
const STEP_MS = 2000;

/** How long a resize must rest before hidden steps repaint at the new width. */
const SETTLE_MS = 150;

/** The most steps listed beside a figure; more show one caption at a time. */
const MAX_LISTED = 6;

/** The tags the key explains: ▶, ✓ and green or red say what they mean, these three do not. */
const MEANING: Partial<Record<Tag, string>> = {
  match: 'a found or equal pair',
  new: 'just added or changed',
  dim: 'out of play',
};
const FALLBACK_WIDTH = 480;
const RENDERED_LIMIT = 500;
/** Plain text and `$…$` maths only, which MathJax draws at once with no Markdown render to wait for; else undefined. */
function mathParts(markdown: string): (string | { tex: string; display: boolean })[] | undefined {
  const parts: (string | { tex: string; display: boolean })[] = [];
  let plain = true;
  mapMath(markdown, (math) => {
    const display = math.startsWith('$$');
    parts.push({ tex: display ? math.slice(2, -2) : math.slice(1, -1), display });
    return '';
  }, (text) => {
    plain &&= isPlain(text);
    parts.push(text);
    return '';
  }, TYPESET_MATH);
  return plain ? parts : undefined;
}
/** Runs per param when fitting a Diagram's frame to its range. */
const RANGE_SAMPLES = 12;
/** A param's values to fit a Diagram's frame to: every choice, a slider's ends and evenly spaced steps between. */
function rangeOf(param: Param): unknown[] {
  if (param.kind === 'choice') return [...param.options];
  if (param.kind === 'text') return [];
  const steps = Math.floor((param.max - param.min) / param.step);
  const count = Math.min(steps + 1, RANGE_SAMPLES);
  return Array.from({ length: count }, (_, i) => param.min + Math.round((i * steps) / Math.max(1, count - 1)) * param.step);
}
/** The px size of a Graph's text, as `styles.css` sets it. */
const GRAPH_FONT = 13;

/** One step's drawing, and what must be repainted when the figure's width changes. */
interface StepView {
  el: HTMLElement;
  links: Link[];
  drawn: Drawn[];
  dirty: boolean;
}

/** One element drawn in one step; `key` names the element across steps. */
type Instance = { key: string; view: StepView; drawn?: Drawn };

/** What drawing one figure needs, shared by its steps. */
interface Drawing {
  markdown: (el: HTMLElement, text: string | number) => void;
  tex: (el: HTMLElement, tex: string) => void;
  prepared: Map<string, unknown>;
  lanes: Map<string, Lane>;
  used: Set<Tag>;
  /** Every element drawn, by key, so one can have its other steps repaint. */
  instances: Map<string, Instance[]>;
}

const live = new Set<FigureView>();
let themeObserver: MutationObserver | undefined;
let dark = false;

/** Obsidian switches themes by the body's class; every live figure redraws its TeX colours then. */
function watchTheme(view: FigureView): void {
  live.add(view);
  if (themeObserver || typeof MutationObserver === 'undefined') return;
  dark = document.body.classList.contains('theme-dark');
  themeObserver = new MutationObserver(() => {
    const now = document.body.classList.contains('theme-dark');
    if (now === dark) return;
    dark = now;
    for (const figure of live) figure.retheme();
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/** Every element of a step's tree in drawing order, with its key across steps: its type and id, else its place among the step's elements of its type. Layers are not visited. */
function walk(root: FigureNode, visit: (node: FigureNode, key: string) => void): void {
  const counts = new Map<string, number>();
  const step = (node: FigureNode): void => {
    const ordinal = counts.get(node.type) ?? 0;
    counts.set(node.type, ordinal + 1);
    visit(node, `${node.type}:${('id' in node && node.id) || `#${ordinal}`}`);
    if (BLOCK_CONTAINERS.has(node.type)) for (const child of (node as { children: readonly FigureNode[] }).children) step(child);
  };
  step(root);
}

const viewOf = (type: string): ElementView<FigureNode> | undefined => (Object.hasOwn(VIEWS, type) ? VIEWS[type as DrawnType] : undefined);

/** Runs one figure program in the sandbox, validates what it returns and draws it: every step at once in one grid cell, the current one shown. */
export class FigureView {
  readonly el: HTMLElement;
  private readonly controller = new AbortController();
  private readonly observer?: ResizeObserver;
  private readonly values = new Map<string, unknown>();
  private source = '';
  private figure?: FigureData;
  private current = 0;
  private generation = 0;
  private steps: StepView[] = [];
  private playback?: ReturnType<typeof Playback>;
  /** Unmounts the shown drawing's step list and player. */
  private release?: () => void;
  private narrate?: (index: number) => void;
  private placeSide?: () => void;
  private settle?: number;
  private params?: HTMLElement;
  private paramError?: HTMLElement;
  private body?: HTMLElement;
  private rerunning = false;
  private again = false;
  private width = 0;
  private readonly colours = new Map<string, Rgb>();
  /** What each Markdown string rendered to, so a redraw that shows it again copies it instead of typesetting it again. */
  private readonly rendered = new Map<string, DocumentFragment>();
  /** What each element's view prepared, by key, given to its next prepare so a frame stays anchored as params change. */
  private readonly prepared = new Map<string, unknown>();
  /** State each element's view keeps across steps and param reruns, by key and name. */
  private readonly keeps = new Map<string, unknown>();
  /** The shown drawing's Markdown, for links redrawn after a resize. */
  private markdown?: Drawing['markdown'];

  constructor(parent: HTMLElement, private readonly host: FigureHost, private readonly sandbox: FigureSandbox = figureSandbox) {
    this.el = parent.appendChild(div('vicher-figure'));
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.resized());
      this.observer.observe(this.el);
    }
    watchTheme(this);
  }

  /**
   * Runs the program with its declared defaults, validates and draws it; does not show errors. `whenVisible` waits
   * until the figure is near the screen, so reopening a long chat runs only what the student can reach.
   */
  async run(source: string, { whenVisible = false } = {}): Promise<FigureOutcome> {
    this.source = source;
    if (whenVisible) await this.visible();
    const result = await this.execute();
    if (!result.ok) return { drawn: false, error: result.error, repairable: result.repairable };
    await this.draw(result.figure, false);
    void this.fitRange(result.figure);
    return { drawn: true };
  }

  /** Replaces the figure with the error card: the sentence, and the source collapsed under it. */
  showError(error: string, source: string): void {
    this.clear();
    this.params = undefined;
    const card = this.el.appendChild(div('vicher-figure-error'));
    card.setAttribute('role', 'note');
    card.appendChild(div('vicher-figure-error-message')).textContent = error;
    const details = card.appendChild(createEl('details'));
    details.appendChild(createEl('summary')).textContent = 'Figure source';
    details.appendChild(createEl('pre')).appendChild(createEl('code')).textContent = source;
  }

  destroy(): void {
    this.controller.abort();
    window.clearTimeout(this.settle);
    this.observer?.disconnect();
    live.delete(this);
    // The last figure going (a closed chat, the plugin unloading) stops the watch, so a reload does not leave one behind.
    if (!live.size) {
      themeObserver?.disconnect();
      themeObserver = undefined;
    }
    this.clear();
  }

  /** Redraws with the theme's tag colours, which figure TeX holds as literals. */
  retheme(): void {
    this.colours.clear();
    if (this.figure && this.body?.isConnected) void this.draw(this.figure, true);
  }

  /** `background` runs queue behind every figure on screen and every run the student asked for. */
  private async execute(params = Object.fromEntries(this.values), background = false): Promise<{ ok: true; figure: FigureData } | { ok: false; error: string; repairable: boolean }> {
    // A figure in a hidden tab has no box; it waits behind every figure on screen.
    const near = (): number => {
      const box = this.el.getBoundingClientRect();
      return box.width === 0 ? Infinity : background ? Number.MAX_SAFE_INTEGER : Math.abs(box.top);
    };
    const result = await this.sandbox.run(this.source, params, near, this.controller.signal);
    if (!result.ok) return { ok: false, error: result.line ? `${result.error} (line ${result.line})` : result.error, repairable: result.repairable };
    const valid = validateFigure(result.payload);
    return valid.ok ? { ok: true, figure: valid.figure } : { ok: false, error: valid.error, repairable: true };
  }

  /** Resolves once the figure is within a screen of the viewport, or at once where that cannot be watched. */
  private visible(): Promise<void> {
    if (typeof IntersectionObserver === 'undefined') return Promise.resolve();
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting) && !this.controller.signal.aborted) return;
        observer.disconnect();
        resolve();
      }, { rootMargin: '100% 0px' });
      observer.observe(this.el);
      this.controller.signal.addEventListener('abort', () => {
        observer.disconnect();
        resolve();
      });
    });
  }

  /** `typeset` is told when MathJax drew here at once, so its new glyphs are measured again once they show. */
  private render(el: HTMLElement, markdown: string, renders: Promise<unknown>[], typeset: () => void): void {
    const done = this.rendered.get(markdown);
    if (done) {
      el.replaceChildren(done.cloneNode(true));
      return;
    }
    const remember = (): void => {
      if (this.rendered.size >= RENDERED_LIMIT) this.rendered.clear();
      const copy = createFragment();
      for (const node of el.childNodes) copy.append(node.cloneNode(true));
      this.rendered.set(markdown, copy);
    };
    const parts = mathParts(markdown);
    if (parts) {
      try {
        el.replaceChildren(...parts.map((part) => (typeof part === 'string' ? part : this.host.renderMath(part.tex, part.display))));
        typeset();
        remember();
        return;
      } catch {
        // MathJax is not loaded yet; the Markdown render loads it.
      }
    }
    renders.push(this.host.renderMarkdown(el, markdown).then(remember));
  }

  /**
   * Runs the program across each param's range, so what a view such as a Diagram's prepares holds every value the student
   * can pick and its frame never moves as they pick one. Redraws if that changed it.
   */
  private async fitRange(figure: FigureData): Promise<void> {
    let ranged = false;
    for (const step of figure.steps) walk(step.root, (node) => (ranged ||= viewOf(node.type)?.holdsRange === true));
    if (!ranged) return;
    // Only what holds a param's range is compared: a Graph's layout is laid out again on every draw.
    const snapshot = (): string => JSON.stringify([...this.prepared].filter(([key]) => viewOf(key.slice(0, key.indexOf(':')))?.holdsRange));
    const before = snapshot();
    const runs = figure.params.flatMap((param) => rangeOf(param).map((value) => this.execute({ ...Object.fromEntries(this.values), [param.key]: value }, true)));
    for (const result of await Promise.all(runs)) if (result.ok) this.prepare(result.figure, true);
    if (this.controller.signal.aborted || snapshot() === before) return;
    if (!this.rerunning && this.figure && this.body?.isConnected) void this.draw(this.figure, true);
  }

  /** A param changed: one run in flight per figure, and the latest value wins. */
  private async rerun(): Promise<void> {
    if (this.rerunning) {
      this.again = true;
      return;
    }
    this.rerunning = true;
    try {
      do {
        this.again = false;
        const result = await this.execute();
        if (this.controller.signal.aborted) return;
        if (this.again) continue;
        if (this.paramError) this.paramError.textContent = result.ok ? '' : result.error;
        if (result.ok) await this.draw(result.figure, result.figure.steps.length === this.figure?.steps.length);
      } while (this.again);
    } finally {
      this.rerunning = false;
    }
  }

  private clear(): void {
    this.generation += 1;
    this.keeps.clear();
    this.release?.();
    this.release = this.playback = undefined;
    destroy(this.steps);
    this.steps = [];
    this.body = undefined;
    this.el.replaceChildren();
  }

  /**
   * Draws `figure`. A redraw (a param change, a theme change) builds the new drawing hidden beside the one on screen
   * and swaps them once its renders have finished, so the figure never blanks or jumps while it redraws.
   */
  private async draw(figure: FigureData, keepStep: boolean): Promise<void> {
    const generation = (this.generation += 1);
    const shown = this.body?.isConnected ? this.body : undefined;
    if (!shown) this.el.replaceChildren();
    const renders: Promise<unknown>[] = [];
    let typeset = false;
    const typed = (): void => {
      typeset = true;
    };
    const used = new Set<Tag>();
    const colour: TagColour = (tag, fill) => this.colour(tag, fill);
    const drawing: Drawing = {
      markdown: (el, text) => {
        if (typeof text === 'number' || isPlain(text)) {
          el.textContent = typeof text === 'number' ? formatFigure(text) : text;
          return;
        }
        for (const tag of texTags(text)) used.add(tag);
        this.render(el, figureText(drawTexIn(text, colour)), renders, typed);
      },
      tex: (el, tex) => {
        for (const tag of texTags(tex)) used.add(tag);
        this.render(el, figureText(`$$\n${drawTex(tex, colour)}\n$$`), renders, typed);
      },
      prepared: this.prepare(figure, false),
      lanes: pointerLanes(figure),
      used,
      instances: new Map(),
    };

    if (figure.params.length && !this.params?.isConnected) {
      this.params = this.el.appendChild(div('vicher-figure-params'));
      drawParams(this.params, figure.params, this.values, drawing.markdown, (key, value) => {
        this.values.set(key, value);
        void this.rerun();
      });
      this.paramError = this.el.appendChild(div('vicher-figure-param-error'));
    }
    const body = this.el.appendChild(div('vicher-figure-body'));
    if (shown) body.classList.add('is-pending');
    if (figure.title) drawing.markdown(body.appendChild(div('vicher-figure-title')), figure.title);
    const main = body.appendChild(div('vicher-figure-main'));
    const scroll = main.appendChild(div('vicher-figure-scroll'));
    const stack = scroll.appendChild(div('vicher-figure-stack'));
    this.width = this.canvasWidth();
    const steps = figure.steps.map((step) => {
      const view: StepView = { el: stack.appendChild(div('vicher-figure-step')), links: [], drawn: [], dirty: false };
      const tags = new Map<string, Tag>();
      const keys = new Map<FigureNode, string>();
      walk(step.root, (node, key) => {
        keys.set(node, key);
        if ('tags' in node && node.tags) for (const [id, tag] of node.tags) tags.set(id, tag);
        // A drawing's layers draw their own tag colours.
        if ('children' in node && !BLOCK_CONTAINERS.has(node.type)) for (const layer of node.children) if ('tag' in layer && layer.tag) used.add(layer.tag);
      });
      walk(step.root, (node) => {
        if ('id' in node && node.id && 'tag' in node && node.tag) tags.set(node.id, node.tag);
      });
      const tagOf = (id: string): Tag | undefined => {
        const tag = tags.get(id);
        if (tag) used.add(tag);
        return tag;
      };
      this.drawBlocks([step.root], view.el, view, drawing, tagOf, keys);
      return view;
    });

    const side = main.appendChild(div('vicher-figure-side'));
    let playback: ReturnType<typeof Playback> | undefined;
    let list: ReturnType<typeof StepList> | undefined;
    const listed = figure.steps.length > 1 && figure.steps.length <= MAX_LISTED;
    let narrate: ((index: number) => void) | undefined;
    let placeSide: (() => void) | undefined;
    if (figure.steps.some((step) => step.caption || step.heading)) {
      const stepList = mount(StepList, {
        target: side,
        props: {
          steps: figure.steps,
          write: drawing.markdown,
          pick: (index) => {
            this.playback?.stop();
            this.show(index);
          },
        },
      });
      list = stepList;
      stepList.single(!listed);
      // The captions render through effects, which must run now for `renders` to hold them.
      flushSync();
      narrate = (index) => stepList.show(index);
      // Under the drawing, a list would push the current step out of view; one caption with the full player stays beside it.
      // A wrapped side column starts at the drawing's left edge, whatever its height.
      if (listed) {
        placeSide = () => {
          // Measured without `is-under`, whose full-width basis would keep the column wrapped once the pane widens again.
          side.classList.remove('is-under');
          const under = side.offsetLeft <= scroll.offsetLeft + 1;
          side.classList.toggle('is-under', under);
          stepList.single(under);
          playback?.playOnly(!under);
          flushSync();
        };
      }
    }
    const explained = TAGS.filter((tag) => used.has(tag) && MEANING[tag]);
    if (explained.length) {
      const key = scroll.appendChild(div('vicher-figure-key'));
      for (const tag of explained) {
        const item = key.appendChild(div('vicher-figure-key-item'));
        const mark = item.appendChild(createSpan());
        mark.className = 'vicher-figure-key-mark';
        mark.dataset.tag = tag;
        mark.textContent = ' ';
        item.append(`${tag}: ${MEANING[tag]}`);
      }
    }
    if (figure.steps.length > 1) {
      playback = mount(Playback, { target: side, props: { change: (index) => this.show(index) } });
      // The list already shows where the student is and moves on a click, so the player keeps only Play.
      playback.playOnly(listed);
      flushSync();
    }
    side.classList.toggle('is-player', figure.steps.length > 1 && !listed);

    this.fitGraphs(body);

    const release = (): void => {
      if (list) void unmount(list);
      if (playback) void unmount(playback);
    };
    const commit = (): void => {
      this.release?.();
      destroy(this.steps);
      shown?.remove();
      body.classList.remove('is-pending');
      this.figure = figure;
      this.steps = steps;
      this.narrate = narrate;
      this.placeSide = placeSide;
      this.playback = playback;
      this.release = release;
      this.body = body;
      this.markdown = drawing.markdown;
      this.show(keepStep ? Math.min(this.current, figure.steps.length - 1) : 0);
    };
    if (!shown) commit();

    // Links and reserved widths need every box measured, so they wait for each Markdown and MathJax render.
    await Promise.allSettled(renders);
    if (generation !== this.generation) {
      if (body !== this.body) {
        body.remove();
        release();
        destroy(steps);
      }
      return;
    }
    if (shown) commit();
    // Diagram labels drawn while their render ran were placed from an estimate.
    const settled = renders.length;
    this.remeasure(drawing.markdown, renders.length > 0);
    // Links are placed again once the fonts load and once their own labels, rendered as the links were drawn, have finished:
    // a rendered label is copied, so this second draw measures it whole.
    void Promise.allSettled([...renders.slice(settled), document.fonts?.ready]).then(() => {
      if (generation === this.generation) for (const step of this.steps) drawLinks(step.el, step.links, drawing.markdown);
    });
    if (typeset) {
      void this.host.finishRenderMath().then(() => {
        if (generation === this.generation) this.remeasure(drawing.markdown, true);
      });
    }
  }

  /** Places what depends on measured boxes again: reserved widths, links, and with `labels` every step's drawings, whose labels were placed from an estimate. */
  private remeasure(markdown: Drawing['markdown'], labels: boolean): void {
    if (labels) {
      // Hidden steps are laid out too, so every label is measured now and no step grows a Diagram's room when it is first shown.
      for (const step of this.steps) for (const drawn of step.drawn) drawn.repaint?.();
      for (const step of this.steps) if (step.dirty) this.repaint(step);
    }
    this.reserveWidths();
    for (const step of this.steps) drawLinks(step.el, step.links, markdown);
    this.placeSide?.();
  }

  private show(index: number): void {
    this.current = index;
    this.steps.forEach((step, k) => {
      step.el.classList.toggle('is-current', k === index);
      for (const drawn of step.drawn) drawn.active?.(k === index);
    });
    const step = this.steps[index];
    if (step?.dirty) this.repaint(step);
    this.narrate?.(index);
    this.playback?.update(this.steps.length - 1, index, { ms: STEP_MS, offset: 1 });
    flushSync();
  }

  private resized(): void {
    const width = this.canvasWidth();
    if (!this.steps.length || width === this.width) return;
    this.width = width;
    this.placeSide?.();
    if (this.body) this.fitGraphs(this.body);
    this.steps.forEach((step, k) => {
      if (k === this.current) this.repaint(step);
      else step.dirty = true;
    });
    // A reserved width was measured at the old width, and a box that fills the figure would hold the figure at it.
    this.releaseWidths();
    // Hidden steps share the grid cell, so their old widths would keep the figure as wide as before; they repaint once the resize settles.
    window.clearTimeout(this.settle);
    this.settle = window.setTimeout(() => {
      if (this.controller.signal.aborted) return;
      for (const step of this.steps) if (step.dirty) this.repaint(step);
      this.reserveWidths();
    }, SETTLE_MS);
  }

  private repaint(step: StepView): void {
    step.dirty = false;
    for (const drawn of step.drawn) drawn.repaint?.();
    if (this.markdown) drawLinks(step.el, step.links, this.markdown);
  }

  /** A Graph wider than the pane shrinks to fit, down to 9 px text; past that it scrolls. */
  private fitGraphs(root: HTMLElement): void {
    for (const graph of root.querySelectorAll<HTMLElement>('.vicher-figure-graph')) {
      graph.style.zoom = String(Math.min(1, Math.max(9 / GRAPH_FONT, this.width / parseFloat(graph.style.width))));
    }
  }

  /** The width a Plot, Graph or Diagram draws at: the pane's, less the padding and border of the card around it. */
  private canvasWidth(): number {
    const probe = this.el.appendChild(div('vicher-figure-canvas'));
    const style = getComputedStyle(probe);
    const inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    probe.remove();
    return (Math.floor(this.el.clientWidth) || FALLBACK_WIDTH) - (inset || 0);
  }

  /** A tag's theme colour, ink or fill, read from a probe element: the custom property's own text is not a colour. */
  private colour(tag: Tag, fill: boolean): Rgb {
    const name = `--vicher-figure-${fill ? 'fill' : 'tag'}-${tag}`;
    let rgb = this.colours.get(name);
    if (!rgb) {
      rgb = parseColour(computedColour(this.el, `var(${name})`));
      this.colours.set(name, rgb);
    }
    return rgb;
  }

  /** What each view prepares over its element's instances in every step, by key, from what it prepared last; `ranged` only for views that hold a param's range. */
  private prepare(figure: FigureData, ranged: boolean): Map<string, unknown> {
    const uses = new Map<string, FigureNode[]>();
    for (const step of figure.steps) {
      walk(step.root, (node, key) => {
        const nodes = uses.get(key);
        if (nodes) nodes.push(node);
        else uses.set(key, [node]);
      });
    }
    for (const [key, nodes] of uses) {
      const view = viewOf(nodes[0].type);
      if (view?.prepare && (!ranged || view.holdsRange)) this.prepared.set(key, view.prepare(nodes, view.holdsRange ? this.prepared.get(key) : undefined));
    }
    return this.prepared;
  }

  /** After the first draw and after each resize, each id keeps its widest box over the steps, so nothing jitters while stepping. */
  private reserveWidths(): void {
    this.releaseWidths();
    const widest = new Map<string, number>();
    const boxes: [string, HTMLElement][] = [];
    for (const step of this.steps) {
      for (const el of step.el.querySelectorAll<HTMLElement>('[data-figure-id]')) {
        if (!(el.instanceOf(HTMLElement)) || el.tagName === 'TR' || el.closest('.vicher-figure-graph, .vicher-figure-plot, .vicher-figure-diagram, mjx-container')) continue;
        const id = el.dataset.figureId!;
        const width = el.getBoundingClientRect().width;
        if (!width) continue;
        boxes.push([id, el]);
        widest.set(id, Math.max(widest.get(id) ?? 0, width));
      }
    }
    for (const [id, el] of boxes) el.style.minWidth = `${widest.get(id)}px`;
  }

  private releaseWidths(): void {
    for (const step of this.steps) for (const el of step.el.querySelectorAll<HTMLElement>('[data-figure-id]')) el.style.removeProperty('min-width');
  }

  /** Draws blocks into `parent` by their views; links wait for the step to be laid out. */
  private drawBlocks(nodes: readonly FigureNode[], parent: HTMLElement, view: StepView, drawing: Drawing, tagOf: (id: string) => Tag | undefined, keys: ReadonlyMap<FigureNode, string>): void {
    for (const node of nodes) {
      if (isLink(node)) {
        view.links.push(node);
        continue;
      }
      const key = keys.get(node)!;
      const instance: Instance = { key, view };
      const instances = drawing.instances.get(key);
      if (instances) instances.push(instance);
      else drawing.instances.set(key, [instance]);
      const width = (): number => this.width;
      const ctx: DrawContext = {
        get width() {
          return width();
        },
        prepared: drawing.prepared.get(key),
        lane: drawing.lanes.get(key),
        markdown: drawing.markdown,
        tex: drawing.tex,
        mark: (el, id, tag) => {
          if (id) el.dataset.figureId = id;
          const shown = tag ?? (id ? tagOf(id) : undefined);
          if (shown) {
            el.dataset.tag = shown;
            drawing.used.add(shown);
          }
          return el;
        },
        tagOf,
        child: (className, into) => into.appendChild(div(className)),
        blocks: (children, into) => this.drawBlocks(children, into, view, drawing, tagOf, keys),
        keep: <T>(name: string) => ({ get: () => this.keeps.get(`${key}/${name}`) as T | undefined, set: (value: T) => void this.keeps.set(`${key}/${name}`, value) }),
        stale: () => {
          for (const other of drawing.instances.get(key) ?? []) {
            if (other === instance || !other.drawn) continue;
            if (other.view.el.classList.contains('is-current')) other.drawn.repaint?.();
            else other.view.dirty = true;
          }
        },
        send: this.host.send?.bind(this.host),
      };
      const drawn = viewOf(node.type)!.draw(parent.appendChild(div('')), node, ctx);
      if (drawn) {
        instance.drawn = drawn;
        view.drawn.push(drawn);
      }
    }
  }
}

function destroy(steps: readonly StepView[]): void {
  for (const step of steps) for (const drawn of step.drawn) drawn.destroy?.();
}

/** Room each element a Pointer can mark keeps for its pointers, over every step, on the side its definition names. */
function pointerLanes(figure: FigureData): Map<string, Lane> {
  const lanes = new Map<string, Lane>();
  for (const step of figure.steps) {
    const owner = new Map<string, string>();
    const counts = new Map<string, number>();
    const pointers: Extract<FigureNode, { type: 'Pointer' }>[] = [];
    walk(step.root, (node, key) => {
      if (node.type === 'Pointer') pointers.push(node);
      for (const id of NODE_DEFINITIONS.get(node.type)?.pointable?.(node) ?? []) owner.set(id, key);
    });
    for (const pointer of pointers) {
      const key = owner.get(pointer.to);
      if (key === undefined) continue;
      const count = (counts.get(pointer.to) ?? 0) + 1;
      counts.set(pointer.to, count);
      const lane = lanes.get(key) ?? { count: 0, name: 0, names: [] };
      const names = lane.names.includes(pointer.name) ? lane.names : [...lane.names, pointer.name];
      lanes.set(key, { count: Math.max(lane.count, count), name: Math.max(lane.name, pointer.name.length), names });
    }
  }
  return lanes;
}
