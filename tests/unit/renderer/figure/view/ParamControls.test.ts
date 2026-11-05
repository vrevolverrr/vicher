/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';
import type { Param } from '@/renderer/figure/FigureData';
import ParamControls from '@/renderer/figure/view/ParamControls.svelte';

const slider: Param = { kind: 'slider', key: 's', label: 'Speed', min: 0, max: 10, step: 1, value: 2, unit: 'm/s' };
const choice: Param = { kind: 'choice', key: 'c', label: 'Mode', options: ['a', 'b'], value: 'a' };
const text: Param = { kind: 'text', key: 't', label: 'Name', value: 'x' };

function draw(params: readonly Param[], values: ReadonlyMap<string, unknown> = new Map()) {
  const target = document.body.appendChild(document.createElement('div'));
  const change = vi.fn();
  const view = mount(ParamControls, { target, props: { params, values, label: (el, label) => { el.textContent = String(label); }, change } });
  flushSync();
  return { target, change, close: () => void unmount(view) };
}

const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
};

beforeEach(() => document.body.replaceChildren());

it('shows a slider at its value, with its unit and the track filled that far', () => {
  const { target, close } = draw([slider]);

  expect(target.querySelector('.vicher-control-row span')!.textContent).toBe('Speed');
  expect(target.querySelector('output')!.textContent).toBe('2 m/s');
  expect(target.querySelector('input')!.style.getPropertyValue('--vicher-progress')).toBe('20%');
  close();
});

it('reports a moved slider as a number and updates its readout and track', () => {
  const { target, change, close } = draw([slider]);
  const input = target.querySelector('input')!;

  type(input, '5');

  expect(change).toHaveBeenCalledWith('s', 5);
  expect(target.querySelector('output')!.textContent).toBe('5 m/s');
  expect(input.style.getPropertyValue('--vicher-progress')).toBe('50%');
  close();
});

it('shows where a value landed after the slider corrected it, without reporting a change', () => {
  const { target, change, close } = draw([{ ...slider, value: 12 }]);

  expect(target.querySelector('output')!.textContent).toBe('10 m/s');
  expect(change).not.toHaveBeenCalled();
  close();
});

it('presses the picked choice and reports it', () => {
  const { target, change, close } = draw([choice]);
  const pressed = () => [...target.querySelectorAll('button')].map((button) => button.getAttribute('aria-pressed'));
  expect(pressed()).toEqual(['true', 'false']);

  target.querySelectorAll('button')[1]!.click();
  flushSync();

  expect(pressed()).toEqual(['false', 'true']);
  expect(change).toHaveBeenCalledWith('c', 'b');
  close();
});

it('names the choice group for a screen reader', () => {
  const { target, close } = draw([choice]);

  expect(target.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Mode');
  close();
});

it('reports a text field as text', () => {
  const { target, change, close } = draw([text]);

  type(target.querySelector('input')!, 'y');

  expect(change).toHaveBeenCalledWith('t', 'y');
  close();
});

it('starts from the values already chosen, not the defaults', () => {
  const { target, close } = draw([slider, choice, text], new Map<string, unknown>([['s', 7], ['c', 'b'], ['t', 'kept']]));
  const [range, field] = target.querySelectorAll('input');

  expect(range!.value).toBe('7');
  expect(target.querySelectorAll('button')[1]!.getAttribute('aria-pressed')).toBe('true');
  expect(field!.value).toBe('kept');
  close();
});
