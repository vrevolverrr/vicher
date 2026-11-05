/**
 * @vitest-environment jsdom
 */
import { TourOverlay } from '@/tour/view/TourOverlay';

describe('TourOverlay', () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  function setup() {
    const parent = document.body.appendChild(document.createElement('div'));
    const pane = parent.appendChild(document.createElement('div'));
    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300, x: 0, y: 0, toJSON: () => ({}) });
    const hold = vi.fn();
    return { overlay: new TourOverlay(parent, hold), hold, layer: parent.querySelector<HTMLElement>('.vicher-tour')!, pane };
  }

  it('shows the comment and follows the point each frame', () => {
    const { overlay, layer, pane } = setup();
    let point = { x: 10, y: 20, top: 2 };

    overlay.show(() => point, pane, 'Missing factor');
    frames.shift()!(0);
    expect(layer.querySelector('.vicher-tour-text')!.textContent).toBe('Missing factor');
    expect((layer.querySelector('.vicher-tour-cursor') as HTMLElement).style.transform).toBe('translate(10px, 20px)');

    point = { x: 30, y: 60, top: 42 };
    frames.shift()!(16);
    expect((layer.querySelector('.vicher-tour-cursor') as HTMLElement).style.transform).toBe('translate(30px, 60px)');
  });

  it('hides while the point is outside the pane or unknown, and shows again when it returns', () => {
    const { overlay, layer, pane } = setup();
    let point: { x: number; y: number; top: number } | null = { x: 500, y: 20, top: 2 };

    overlay.show(() => point, pane);
    frames.shift()!(0);
    expect(layer.classList.contains('is-hidden')).toBe(true);
    point = null;
    frames.shift()!(16);
    expect(layer.classList.contains('is-hidden')).toBe(true);
    point = { x: 5, y: 5, top: 0 };
    frames.shift()!(32);
    expect(layer.classList.contains('is-hidden')).toBe(false);
  });

  it('stops drawing when hidden', () => {
    const { overlay, layer, pane } = setup();

    overlay.show(() => ({ x: 1, y: 1, top: 0 }), pane);
    overlay.hide();

    expect(layer.classList.contains('is-active')).toBe(false);
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('holds the step while the pointer or focus is on the card', () => {
    const { layer, hold } = setup();
    const card = layer.querySelector('.vicher-tour-card')!;

    card.dispatchEvent(new MouseEvent('mouseenter'));
    card.dispatchEvent(new MouseEvent('mouseleave'));
    card.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    card.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(hold.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it('restarts the draining line for each time it is told', () => {
    const { overlay, layer } = setup();
    const bar = layer.querySelector<HTMLElement>('.vicher-tour-bar')!;

    overlay.setTiming(2705);
    expect(bar.style.getPropertyValue('--vicher-tour-ms')).toBe('2705ms');
    expect(bar.classList.contains('is-timing')).toBe(true);
    overlay.setTiming(1500);
    expect(bar.style.getPropertyValue('--vicher-tour-ms')).toBe('1500ms');
  });

  it('hides the card when a stop has no comment, and shows it again for the next one', () => {
    const { overlay, layer, pane } = setup();
    const card = layer.querySelector('.vicher-tour-card')!;

    overlay.show(() => ({ x: 1, y: 1, top: 0 }), pane);
    expect(card.classList.contains('is-empty')).toBe(true);
    overlay.show(() => ({ x: 1, y: 1, top: 0 }), pane, 'Look here');
    expect(card.classList.contains('is-empty')).toBe(false);
    expect(card.classList.contains('is-in')).toBe(true);
  });

  it('keeps the card a direct child of the layer, after the cursor, and takes it away with the layer', () => {
    const { overlay, layer } = setup();

    expect([...layer.children].map((child) => child.classList[0])).toEqual(['vicher-tour-cursor', 'vicher-tour-card']);
    const card = layer.querySelector('.vicher-tour-card')!;
    overlay.destroy();
    expect([layer.isConnected, card.isConnected]).toEqual([false, false]);
  });

  it('is read out as each comment appears', () => {
    const { layer } = setup();

    expect(layer.querySelector('.vicher-tour-card')!.getAttribute('role')).toBe('status');
  });
});
