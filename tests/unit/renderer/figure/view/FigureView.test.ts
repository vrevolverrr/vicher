/** @vitest-environment jsdom */
import { flushSync } from 'svelte';
import type { FigureSandbox, RunResult } from '@/renderer/figure/view/FigureSandbox';
import { type FigureHost, FigureView } from '@/renderer/figure/view/FigureView';

type El = { type: string; props: Record<string, unknown>; children: unknown[] };
const el = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]): El => ({ type, props, children });
const payload = (frames: { caption: string; heading?: string; root: El }[], params: Record<string, unknown> = {}): unknown => ({ params, frames });

let observers: { disconnected: boolean; resized: () => void }[] = [];

beforeEach(() => {
  observers = [];
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    disconnected = false;
    constructor(readonly resized: () => void) {
      observers.push(this);
    }
    observe(): void {}
    disconnect(): void {
      this.disconnected = true;
    }
  };
  document.body.replaceChildren();
});

/** A sandbox that answers each run with the next payload, or a function of the params it was sent. */
function sandbox(answer: (params: Record<string, unknown>) => unknown): FigureSandbox & { calls: Record<string, unknown>[]; release(): void } {
  const calls: Record<string, unknown>[] = [];
  let held: (() => void)[] = [];
  let hold = false;
  return {
    calls,
    hold() { hold = true; },
    release() { const now = held; held = []; hold = false; now.forEach((go) => go()); },
    run: (_source: string, params: Record<string, unknown>) => {
      calls.push(params);
      const result: RunResult = { ok: true, payload: answer(params) };
      return hold ? new Promise((resolve) => held.push(() => resolve(result))) : Promise.resolve(result);
    },
  } as unknown as FigureSandbox & { calls: Record<string, unknown>[]; release(): void };
}

/** A host whose Markdown renders resolve only when the test says. */
function host(): FigureHost & { rendered: string[]; math: string[]; finish(): void; sent: string[]; accept: boolean } {
  const pending: (() => void)[] = [];
  const self = {
    rendered: [] as string[],
    math: [] as string[],
    sent: [] as string[],
    accept: true,
    finish: () => pending.splice(0).forEach((go) => go()),
    renderMarkdown: (target: HTMLElement, markdown: string) => {
      self.rendered.push(markdown);
      target.textContent = markdown;
      return new Promise<void>((resolve) => pending.push(resolve));
    },
    renderMath: (tex: string, display: boolean) => {
      self.math.push(display ? `$$${tex}$$` : `$${tex}$`);
      return Object.assign(document.createElement('span'), { textContent: tex });
    },
    finishRenderMath: () => Promise.resolve(),
    send: (message: string) => {
      self.sent.push(message);
      return self.accept;
    },
  };
  return self;
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const linked = payload([
  { caption: '**First**', root: el('Row', {}, el('Node', { id: 'a', label: 'A', state: 'active' }), el('Node', { id: 'b', label: 'B' }), el('Arrow', { from: 'a', to: 'b' })) },
  { caption: '**Second**', root: el('Row', {}, el('Node', { id: 'a', label: 'A', state: 'done' }), el('Node', { id: 'b', label: 'B', group: 'new' }), el('Arrow', { from: 'a', to: 'b' })) },
]);

describe('FigureView', () => {
  it('waits for every Markdown render before it places links or resolves', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => linked));
    let done = false;
    const outcome = view.run('src').then((result) => {
      done = true;
      return result;
    });
    await flush();
    expect(done).toBe(false);
    expect(view.el.querySelector('.vicher-figure-links')).toBeNull();
    markdown.finish();
    await expect(outcome).resolves.toEqual({ drawn: true });
    expect(view.el.querySelectorAll('.vicher-figure-links')).toHaveLength(2);
  });

  it('ignores the renders of an earlier draw that resolve late', async () => {
    const slow = host();
    const view = new FigureView(document.body, slow, sandbox(() => linked));
    const first = view.run('one');
    await flush();
    const stale = slow.finish;
    // The second draw's renders resolve at once.
    slow.renderMarkdown = (target, markdown) => {
      target.textContent = markdown;
      return Promise.resolve();
    };
    await view.run('two');
    view.el.querySelectorAll('.vicher-figure-links').forEach((links) => links.remove());
    stale();
    await first;
    expect(view.el.querySelectorAll('.vicher-figure-links')).toHaveLength(0);
  });

  it('draws every step in one grid cell and shows only the current one', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => linked));
    const outcome = view.run('src');
    await flush();
    markdown.finish();
    await outcome;
    const steps = [...view.el.querySelectorAll('.vicher-figure-step')];
    expect(steps).toHaveLength(2);
    expect(new Set(steps.map((step) => step.parentElement)).size).toBe(1);
    expect(steps.map((step) => step.classList.contains('is-current'))).toEqual([true, false]);
    view.el.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click();
    expect(steps.map((step) => step.classList.contains('is-current'))).toEqual([false, true]);
  });

  it('lists every caption as a step, and keys its groups but not the states whose mark explains itself', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => linked));
    void view.run('src');
    await flush();
    expect([...view.el.querySelectorAll('.vicher-step .vicher-step-text')].map((caption) => caption.textContent)).toEqual(['**First**', '**Second**']);
    expect([...view.el.querySelectorAll('.vicher-figure-key-mark')].map((mark) => (mark as HTMLElement).dataset.color)).toEqual(['blue']);
  });

  it('draws a step heading over its caption in the list', async () => {
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: 'a', heading: 'One', root: el('Node', { label: 'x' }) }, { caption: 'b', root: el('Node', { label: 'y' }) }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect([...view.el.querySelectorAll('.vicher-step .vicher-step-text')].map((text) => [...text.children].map((part) => `${part.classList[0]}:${part.textContent}`))).toEqual([
      ['vicher-step-heading:One', 'vicher-step-caption:a'],
      ['vicher-step-caption:b'],
    ]);
  });

  it('shows a figure too long to list as one numbered caption that Tab skips', async () => {
    // Repeated captions still take each step's number.
    const frames = Array.from({ length: 7 }, (_, i) => ({ caption: 'same', root: el('Node', { label: String(i) }) }));
    const view = new FigureView(document.body, host(), sandbox(() => payload(frames)));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    view.el.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click();
    expect(view.el.querySelector('.vicher-steps')!.classList.contains('is-single')).toBe(true);
    expect(view.el.querySelector('.vicher-step.is-current .vicher-step-dot')!.textContent).toBe('2');
    expect([...view.el.querySelectorAll<HTMLButtonElement>('.vicher-step-button')].every((button) => button.tabIndex === -1)).toBe(true);
  });

  it('draws no step list for one step without a caption', async () => {
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root: el('Node', { label: 'x' }) }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect(view.el.querySelector('.vicher-steps')).toBeNull();
  });

  it('shows the step picked in the list and marks the ones before it done', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => linked));
    void view.run('src');
    await flush();
    const items = [...view.el.querySelectorAll<HTMLElement>('.vicher-step')];
    items[1].querySelector('button')!.click();
    expect([...view.el.querySelectorAll('.vicher-figure-step')].map((step) => step.classList.contains('is-current'))).toEqual([false, true]);
    expect(items.map((item) => [item.classList.contains('is-done'), item.getAttribute('aria-current')])).toEqual([[true, null], [false, 'step']]);
  });

  it('writes a TeX anchor as a data attribute in its own step only', async () => {
    const markdown = host();
    const tex = (anchor: boolean): El => el('Tex', { tex: anchor ? '\\cssId{r2}{0} + 1' : '0 + 1' });
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: 'a', root: tex(true) }, { caption: 'b', root: tex(false) }])));
    void view.run('src');
    await flush();
    expect(markdown.math).toEqual(['$$\n\\data{figure-id=r2}{0} + 1\n$$', '$$\n0 + 1\n$$']);
  });

  it('draws text that is only words and maths with MathJax at once, and Markdown through the render', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '**Bold**', root: el('Node', { id: 'a', label: 'Force $mg$' }) }])));
    void view.run('src');
    await flush();
    expect(markdown.math).toEqual(['$mg$']);
    expect([...new Set(markdown.rendered)]).toEqual(['**Bold**']);
    expect(view.el.querySelector('.vicher-figure-node-label')!.textContent).toBe('Force mg');
  });

  it("frames a Diagram for every value of its slider, so moving it never moves the drawing", async () => {
    const markdown = host();
    const runs = sandbox((params) => payload(
      [{ caption: '', root: el('Diagram', { width: 1, height: 1 }, el('Points', { pts: [[0, 0], [params.n ?? 3, 1]] })) }],
      { n: { label: 'n', min: 1, max: 9, step: 1, value: 3 } },
    ));
    const view = new FigureView(document.body, markdown, runs);
    await view.run('src');
    for (let i = 0; i < 4; i += 1) await flush();
    const height = (): string | null => view.el.querySelector('.vicher-figure-body:not(.is-pending) svg')!.getAttribute('height');
    const first = height();
    const slider = view.el.querySelector<HTMLInputElement>('input[type="range"]')!;
    for (const value of ['9', '1']) {
      slider.value = value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      for (let i = 0; i < 4; i += 1) await flush();
      expect(height()).toBe(first);
    }
    expect(runs.calls.map((params) => params.n).filter((n) => n !== undefined)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('keeps a group\'s colour when a param removes another group and brings it back', async () => {
    const node = (id: string, group: string): El => el('Node', { id, label: id, group });
    const runs = sandbox((params) => payload(
      [{ caption: '', root: el('Row', {}, ...(params.n === 1 ? [] : [node('a', 'failed')]), node('b', 'passed')) }],
      { n: { label: 'n', min: 0, max: 1, step: 1, value: 0 } },
    ));
    const view = new FigureView(document.body, host(), runs);
    await view.run('src');
    for (let i = 0; i < 4; i += 1) await flush();
    const color = (id: string): string | undefined => view.el.querySelector<HTMLElement>(`.vicher-figure-body:not(.is-pending) [data-figure-id="${id}"]`)?.dataset.color;
    expect([color('a'), color('b')]).toEqual(['blue', 'orange']);
    const slider = view.el.querySelector<HTMLInputElement>('input[type="range"]')!;
    for (const [value, shown] of [['1', [undefined, 'orange']], ['0', ['blue', 'orange']]] as const) {
      slider.value = value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      for (let i = 0; i < 4; i += 1) await flush();
      expect([color('a'), color('b')]).toEqual(shown);
    }
  });

  it('creates one ResizeObserver per figure however many plots it has, and disconnects it on destroy', async () => {
    const markdown = host();
    const plot = (id: string): El => el('Plot', { id, x: [0, 1] }, el('Points', { pts: [[0.5, 0.5]] }));
    const view = new FigureView(document.body, markdown, sandbox(() => payload([
      { caption: 'a', root: el('Row', {}, plot('p'), plot('q')) },
      { caption: 'b', root: el('Row', {}, plot('p'), plot('q')) },
    ])));
    void view.run('src');
    await flush();
    expect(view.el.querySelectorAll('.vicher-plot')).toHaveLength(4);
    expect(observers).toHaveLength(1);
    view.destroy();
    expect(observers[0].disconnected).toBe(true);
  });

  it('typesets maths in the labels of a slider, a choice and a text field', async () => {
    const markdown = host();
    const params = {
      zeta: { label: 'Damping $\\zeta$', min: 0, max: 2, value: 0.3 },
      mode: { label: 'Mode $m$', options: ['a', 'b'], value: 'a' },
      name: { label: 'Name $n$', value: 'x', text: true },
    };
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '', root: el('Node', { id: 'a', label: 'a' }) }], params)));
    void view.run('src');
    await flush();
    expect(markdown.math).toEqual(expect.arrayContaining(['$\\zeta$', '$m$', '$n$']));
    expect(view.el.querySelector('.vicher-figure-params')!.textContent).not.toContain('$');
  });

  it('reruns once for a burst of param changes, with the latest value', async () => {
    const markdown = host();
    const runs = sandbox((params) => payload([{ caption: '', root: el('Node', { id: 'a', label: String(params.n ?? 3) }) }], { n: { label: 'n', min: 1, max: 9, step: 1, value: 3 } }));
    const view = new FigureView(document.body, markdown, runs);
    void view.run('src');
    await flush();
    markdown.finish();
    await flush();
    (runs as unknown as { hold(): void }).hold();
    const slider = view.el.querySelector<HTMLInputElement>('input[type="range"]')!;
    for (const value of ['4', '5', '6']) {
      slider.value = value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
    runs.release();
    await flush();
    runs.release();
    await flush();
    expect(runs.calls).toEqual([{}, { n: 4 }, { n: 6 }]);
  });

  it('sends a Quiz answer through the host, and asks the student to wait when it cannot', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '', root: el('Quiz', { question: 'Which?', options: ['x', 'y'], correct: 'y' }) }])));
    void view.run('src');
    await flush();
    markdown.accept = false;
    view.el.querySelectorAll<HTMLButtonElement>('.vicher-quiz-option')[1].click();
    flushSync();
    view.el.querySelector<HTMLButtonElement>('.vicher-quiz-submit')!.click();
    flushSync();
    expect(view.el.querySelector('.vicher-quiz-note')!.textContent).toBe('Wait for the reply to finish, then submit.');
    markdown.accept = true;
    view.el.querySelector<HTMLButtonElement>('.vicher-quiz-submit')!.click();
    flushSync();
    expect(markdown.sent).toEqual(['My answer: y (correct). Question: Which?', 'My answer: y (correct). Question: Which?']);
    expect(view.el.querySelector('.vicher-quiz-bar')).toBeNull();
  });

  describe('controls', () => {
    afterEach(() => vi.useRealTimers());

    async function playing(): Promise<{ view: FigureView; runs: ReturnType<typeof sandbox> }> {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      const markdown = host();
      const runs = sandbox((params) => payload([
        { caption: 'a', root: el('Node', { id: 'a', label: String(params.n ?? 3) }) },
        { caption: 'b', root: el('Node', { id: 'a', label: 'b' }) },
      ], { n: { label: 'n', min: 1, max: 9, step: 1, value: 3 } }));
      const view = new FigureView(document.body, markdown, runs);
      void view.run('src');
      await flush();
      markdown.finish();
      await flush();
      view.el.querySelector<HTMLButtonElement>('.vicher-player .is-play')!.click();
      flushSync();
      return { view, runs };
    }

    it('stops the player\'s timer when the figure is destroyed', async () => {
      const { view } = await playing();
      expect(vi.getTimerCount()).toBe(1);

      view.destroy();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('stops the player\'s timer and keeps one step list and one player when a param change redraws the figure', async () => {
      const { view, runs } = await playing();
      expect(vi.getTimerCount()).toBe(1);

      const slider = view.el.querySelector<HTMLInputElement>('.vicher-slider input')!;
      slider.value = '5';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
      await flush();

      expect(runs.calls.at(-1)).toEqual({ n: 5 });
      expect(vi.getTimerCount()).toBe(0);
      expect(view.el.querySelectorAll('.vicher-player')).toHaveLength(1);
      expect(view.el.querySelectorAll('.vicher-steps')).toHaveLength(1);
      expect(view.el.querySelector('.vicher-player .is-play')!.getAttribute('aria-label')).toBe('Play');
    });

    it('keeps the step the student is on across a redraw', async () => {
      const { view } = await playing();
      view.el.querySelector<HTMLButtonElement>('.vicher-step-button')!.click();
      view.el.querySelectorAll<HTMLButtonElement>('.vicher-step-button')[1].click();

      const slider = view.el.querySelector<HTMLInputElement>('.vicher-slider input')!;
      slider.value = '5';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      await flush();
      await flush();

      expect(view.el.querySelector('.vicher-steps .is-current .vicher-step-dot')!.textContent).toBe('2');
      expect(view.el.querySelector('.vicher-player-count')!.textContent).toBe('2 / 2');
    });
  });

  it('waits for the Markdown a Quiz and a step list render before it resolves', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '**cap**', root: el('Quiz', { question: '**Which?**', options: ['**x**', 'y'], correct: 'y', explanation: 'e' }) }])));
    let done = false;
    void view.run('src').then(() => { done = true; });
    await flush();
    expect(markdown.rendered.sort()).toEqual(['**Which?**', '**cap**', '**x**']);
    expect(done).toBe(false);

    markdown.finish();
    await flush();
    expect(done).toBe(true);
  });

  it('keeps the figure on screen until the Markdown of a redrawn Quiz has rendered', async () => {
    const markdown = host();
    const runs = sandbox((params) => payload([{ caption: '', root: el('Quiz', { question: `**Q${params.n ?? 3}**`, options: ['x', 'y'], correct: 'y' }) }], { n: { label: 'n', min: 1, max: 9, step: 1, value: 3 } }));
    const view = new FigureView(document.body, markdown, runs);
    void view.run('src');
    await flush();
    markdown.finish();
    await flush();

    const slider = view.el.querySelector<HTMLInputElement>('.vicher-slider input')!;
    slider.value = '5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(view.el.querySelectorAll('.vicher-figure-body')).toHaveLength(2);

    markdown.finish();
    await flush();
    expect(view.el.querySelectorAll('.vicher-figure-body')).toHaveLength(1);
    expect(view.el.querySelector('.vicher-quiz-question')!.textContent).toBe('**Q5**');
  });

  it('keeps a sent Quiz answered when the figure redraws', async () => {
    const markdown = host();
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '', root: el('Quiz', { question: 'Which?', options: ['x', 'y'], correct: 'y' }) }])));
    void view.run('src');
    await flush();
    view.el.querySelectorAll<HTMLButtonElement>('.vicher-quiz-option')[0].click();
    flushSync();
    view.el.querySelector<HTMLButtonElement>('.vicher-quiz-submit')!.click();
    view.retheme();
    markdown.finish();
    await flush();
    expect(view.el.querySelectorAll('.vicher-quiz')).toHaveLength(1);
    expect(view.el.querySelector('.vicher-quiz-bar')).toBeNull();
    expect([...view.el.querySelectorAll('.vicher-quiz-option')].map((option) => option.classList.contains('is-wrong'))).toEqual([true, false]);
    expect(markdown.sent).toHaveLength(1);
  });

  it('keeps an unnamed Diagram one size over the steps when a named one comes before it', async () => {
    const diagrams = (pt: number[]): El => el('Row', {}, el('Diagram', { id: 'a', width: 1, height: 1 }, el('Points', { pts: [[1, 1]] })), el('Diagram', { width: 1, height: 1 }, el('Points', { pts: [pt] })));
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: 'One', root: diagrams([20, 10]) }, { caption: 'Two', root: diagrams([5, 10]) }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    const widths = [...view.el.querySelectorAll('.vicher-figure-step')].map((step) => step.querySelectorAll('svg')[1].getAttribute('width'));
    expect(widths[0]).toBe(widths[1]);
  });

  it('draws a Plot inside its card at the pane width less the card padding and border', async () => {
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = '.vicher-figure-canvas { padding: 16px; border: 1px solid; }';
    const plot = el('Plot', { x: [0, 1] }, el('Points', { pts: [[0.5, 0.5]] }));
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root: plot }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    style.remove();
    expect(view.el.querySelector<HTMLElement>('.vicher-figure-canvas > .vicher-figure-plot')!.style.width).toBe('446px');
  });

  it('typesets a Plot legend label once, and sets no SVG title the browser would show on hover', async () => {
    const markdown = host();
    const plot = el('Plot', { x: [0, 1] }, el('Shape', { pts: [[0, 0], [1, 1]], label: '$x^2$' }));
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: '', root: plot }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect(markdown.math).toEqual(['$x^2$']);
    expect(view.el.querySelector('.vicher-plot-key')!.textContent).toBe('x^2');
    expect(view.el.querySelector('.vicher-plot svg title')).toBeNull();
  });

  it('gives every step of a Diagram the same frame when only one step has a label past its edge', async () => {
    const diagram = (label?: string): El => el('Diagram', { width: 4, height: 3 }, el('Segment', { from: [0, 3], to: [4, 3], ...(label ? { label } : {}) }), el('Segment', { from: [2, 0], to: [2, 3] }));
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: 'a', root: diagram('ceiling') }, { caption: 'b', root: diagram() }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    const frames = [...view.el.querySelectorAll('.vicher-figure-step svg')].map((svg) => svg.getAttribute('viewBox'));
    expect(frames).toHaveLength(2);
    expect(frames[1]).toBe(frames[0]);
  });

  it('measures a hidden step\'s rendered label up front, so showing that step does not move the frame', async () => {
    const markdown = host();
    const diagram = (label?: string): El => el('Diagram', { width: 4, height: 3 }, el('Segment', { from: [0, 3], to: [4, 3], ...(label ? { label } : {}) }), el('Segment', { from: [2, 0], to: [2, 3] }));
    const view = new FigureView(document.body, markdown, sandbox(() => payload([{ caption: 'a', root: diagram() }, { caption: 'b', root: diagram('**a much wider label**') }])));
    const ran = view.run('src');
    await flush();
    const box = HTMLElement.prototype.getBoundingClientRect;
    const rendered = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('vicher-figure-diagram-label') ? ({ width: 900, height: 60 } as DOMRect) : box.call(this);
    });
    markdown.finish();
    await expect(ran).resolves.toEqual({ drawn: true });
    await flush();
    const frame = (): string | null => view.el.querySelector('.vicher-figure-step.is-current svg')!.getAttribute('viewBox');
    const before = frame();
    view.el.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click();
    rendered.mockRestore();
    expect(frame()).toBe(before);
  });

  it('measures the boxes each step keeps again after a resize, so a box that filled the old width does not hold it', async () => {
    let width = 900;
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: 'a', root: el('Tex', { id: 't', tex: 'x' }) }, { caption: 'b', root: el('Tex', { id: 't', tex: 'y' }) }])));
    Object.defineProperty(view.el, 'clientWidth', { get: () => width });
    const box = HTMLElement.prototype.getBoundingClientRect;
    const laidOut = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('vicher-figure-tex') ? ({ width: Math.max(width, parseFloat(this.style.minWidth) || 0), height: 40 } as DOMRect) : box.call(this);
    });
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    const reserved = (): string[] => [...view.el.querySelectorAll<HTMLElement>('.vicher-figure-tex')].map((tex) => tex.style.minWidth);
    expect(reserved()).toEqual(['900px', '900px']);
    width = 260;
    observers[0].resized();
    await new Promise((resolve) => setTimeout(resolve, 200));
    laidOut.mockRestore();
    expect(reserved()).toEqual(['260px', '260px']);
  });

  it('sizes a Tex\'s pointer column by every step\'s names and draws each step\'s pointer in it', async () => {
    const step = (name: string): { caption: string; root: El } => ({ caption: name, root: el('Column', {}, el('Tex', { id: 't', tex: 'x = 1' }), el('Pointer', { to: 't', name })) });
    const view = new FigureView(document.body, host(), sandbox(() => payload([step('i'), step('long name')])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    const columns = [...view.el.querySelectorAll('.vicher-figure-tex-lane')];
    expect(columns.map((column) => [...column.querySelectorAll('.vicher-figure-tex-sizes > .vicher-figure-pointer')].map((size) => size.textContent))).toEqual([['←i', '←long name'], ['←i', '←long name']]);
    expect(columns.map((column) => column.querySelector(':scope > .vicher-figure-pointer')?.textContent)).toEqual(['←i', '←long name']);
  });

  it('gives a Tex a pointer column for a pointer that names the Tex itself', async () => {
    const root = el('Column', {}, el('Tex', { id: 't', tex: 'x = 1' }), el('Pointer', { to: 't', name: 'all' }));
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect(view.el.querySelector('.vicher-figure-tex-lane > .vicher-figure-pointer')?.textContent).toBe('←all');
  });

  it('stacks pointers to two cells of one table row instead of drawing them on top of each other', async () => {
    const table = el('Table', { id: 't', columns: ['a', 'b'], rows: [[1, 2]], rowIds: ['r'] });
    const root = el('Row', {}, table, el('Pointer', { to: 'r.0', name: 'i' }), el('Pointer', { to: 'r.1', name: 'j' }));
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    const tops = [...view.el.querySelectorAll<HTMLElement>('.vicher-figure-pointer')].map((pointer) => pointer.style.top);
    expect(tops).toHaveLength(2);
    expect(tops[1]).not.toBe(tops[0]);
  });

  it('draws a Table without rowIds, its cells unaddressed', async () => {
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root: el('Table', { columns: ['a', 'b'], rows: [[1, 2]] }) }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect(view.el.querySelectorAll('td.vicher-figure-cell')).toHaveLength(2);
    expect(view.el.querySelector('td[data-figure-id]')).toBeNull();
  });

  it('draws a Diagram whose only point is the origin', async () => {
    const view = new FigureView(document.body, host(), sandbox(() => payload([{ caption: '', root: el('Diagram', { width: 1, height: 1 }, el('Points', { pts: [[0, 0]] })) }])));
    await expect(view.run('src')).resolves.toEqual({ drawn: true });
    expect(Number(view.el.querySelector('svg')!.getAttribute('width'))).toBeGreaterThan(0);
  });

  it('reports a failed run without drawing, and shows the error card on request', async () => {
    const failing = { run: () => Promise.resolve({ ok: false, error: 'Step 2: TypeError: x', line: 7, repairable: true }) } as unknown as FigureSandbox;
    const view = new FigureView(document.body, host(), failing);
    await expect(view.run('src')).resolves.toEqual({ drawn: false, error: 'Step 2: TypeError: x (line 7)', repairable: true });
    view.showError('Step 2: TypeError: x (line 7)', 'src');
    expect(view.el.querySelector('.vicher-figure-error-message')!.textContent).toBe('Step 2: TypeError: x (line 7)');
    expect(view.el.querySelector('details code')!.textContent).toBe('src');
  });
});

describe('a 3D Plot in a figure', () => {
  type FakeObserver = { callback: (entries: { isIntersecting: boolean }[]) => void; targets: Element[] };
  let intersections: FakeObserver[] = [];

  beforeEach(() => {
    intersections = [];
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      targets: Element[] = [];
      constructor(readonly callback: FakeObserver['callback']) {
        intersections.push(this);
      }
      observe(target: Element): void {
        this.targets.push(target);
      }
      disconnect(): void {}
    };
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(0), 0);
  });

  const SLIDER = { k: { label: 'k', min: 1, max: 3, step: 1, value: 1 } };
  const plot3 = (z: number): El => el('Plot', { id: 'p', zLabel: 'z' }, el('Points', { id: 'dot', pts: [[0, 0, z], [1, 1, 1]] }));
  const twoSteps = sandbox((params) => payload([
    { caption: 'one', root: plot3(Number(params.k ?? 1) * 0.1) },
    { caption: 'two', root: plot3(0.5) },
  ], SLIDER));

  async function drawn(runs = twoSteps): Promise<FigureView> {
    const markdown = host();
    const view = new FigureView(document.body, markdown, runs);
    const outcome = view.run('src');
    await flush();
    markdown.finish();
    await outcome;
    return view;
  }
  const frame = (view: FigureView): HTMLElement => view.el.querySelector<HTMLElement>('.vicher-figure-step.is-current .vicher-plot3-frame')!;
  const angle = (view: FigureView): string => /azimuth (-?\d+)°, elevation (-?\d+)°/.exec(frame(view).getAttribute('aria-label') ?? '')!.slice(1).join('/');
  const pointer = (target: HTMLElement, type: string, x: number, y: number): void => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }));
  };

  it('turns by half a degree per pixel dragged, and keeps the angle across a step change and a param rerun', async () => {
    const view = await drawn();
    expect(angle(view)).toBe('30/25');
    pointer(frame(view), 'pointerdown', 100, 100);
    pointer(frame(view), 'pointermove', 140, 80);
    pointer(frame(view), 'pointerup', 140, 80);
    await flush();
    expect(angle(view)).toBe('50/15');
    view.el.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!.click();
    expect(angle(view)).toBe('50/15');
    const slider = view.el.querySelector<HTMLInputElement>('input[type="range"]')!;
    slider.value = '2';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    await flush();
    expect(twoSteps.calls.at(-1)).toEqual({ k: 2 });
    expect(angle(view)).toBe('50/15');
  });

  it('typesets a hidden step\'s 3D labels while the figure draws, so showing that step measures them whole', async () => {
    const markdown = host();
    const step = (label: string): { caption: string; root: El } => ({ caption: 'step', root: el('Plot', { id: 'p' }, el('Points', { pts: [[0, 0, 0]], label })) });
    const view = new FigureView(document.body, markdown, sandbox(() => payload([step('plain'), step('**bold**')])));
    const ran = view.run('src');
    await flush();
    expect(markdown.rendered).toContain('**bold**');
    markdown.finish();
    await expect(ran).resolves.toEqual({ drawn: true });
  });

  it('is focusable, turns 5 degrees per arrow key the way a drag turns it, and resets on double-click', async () => {
    const view = await drawn(sandbox(() => payload([{ caption: '', root: plot3(0.2) }])));
    expect(frame(view).tabIndex).toBe(0);
    frame(view).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    frame(view).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await flush();
    expect(angle(view)).toBe('35/20');
    frame(view).dispatchEvent(new MouseEvent('dblclick'));
    await flush();
    expect(angle(view)).toBe('30/25');
  });

  it('keeps a canvas bitmap only for the shown step near the view, and redraws at its kept angle when it comes back', async () => {
    const view = await drawn(sandbox(() => payload([{ caption: 'one', root: plot3(0.1) }, { caption: 'two', root: plot3(0.2) }])));
    const canvases = [...view.el.querySelectorAll<HTMLCanvasElement>('.vicher-plot3-canvas')];
    expect(canvases.map((canvas) => canvas.width > 0)).toEqual([true, false]);
    frame(view).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await flush();
    const watcher = intersections.find((observer) => observer.targets.includes(canvases[0].closest('.vicher-plot3')!))!;
    watcher.callback([{ isIntersecting: false }]);
    expect(canvases[0].width).toBe(0);
    watcher.callback([{ isIntersecting: true }]);
    expect(canvases[0].width).toBeGreaterThan(0);
    expect(angle(view)).toBe('25/25');
  });
});
