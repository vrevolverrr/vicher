/**
 * The Web Animations API, which jsdom lacks and Svelte transitions run on: each animation finishes once its duration
 * has passed on the (fake) clock. Install it in `beforeEach` and remove it in `afterEach`.
 */
export function installFakeAnimate(): () => void {
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value(_keyframes: unknown, options: { duration?: number } = {}) {
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => { finish = resolve; });
      const timer = window.setTimeout(() => {
        animation.playState = 'finished';
        animation.onfinish?.();
        finish();
      }, options.duration ?? 0);
      const animation = {
        playState: 'running',
        currentTime: 0,
        effect: null as unknown,
        finished,
        onfinish: null as null | (() => void),
        cancel: () => window.clearTimeout(timer),
      };
      return animation;
    },
  });
  return () => Reflect.deleteProperty(Element.prototype, 'animate');
}
