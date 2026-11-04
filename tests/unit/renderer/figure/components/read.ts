import type { FigureNode } from '@/renderer/figure/FigureData';
import { validateFigure } from '@/renderer/figure/validateFigure';

export const el = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]) => ({ type, props, children });

/** One element as the only thing in a one-step figure: its node, or the validator's message. */
export function read(element: unknown): FigureNode | string {
  const result = validateFigure({ params: {}, frames: [{ caption: '', root: element }] });
  return result.ok ? result.figure.steps[0].root : result.error;
}
