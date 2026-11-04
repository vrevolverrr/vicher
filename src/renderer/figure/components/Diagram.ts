import { component, field } from '@/renderer/figure/components/component';
import { SHARED_LAYER_NAMES } from '@/renderer/figure/components/names';
import { LIMITS } from '@/renderer/figure/FigureData';

export const Diagram = component({
  name: 'Diagram',
  summary: 'a 2D free drawing in the model\'s own units (metres, grid cells), y upwards, scaled by the host to fit the pane; `width` and `height` are the extent of the drawing in its units.',
  fields: { id: field.optional(field.id()), width: field.number({ above: 0 }), height: field.number({ above: 0 }) },
  children: [...SHARED_LAYER_NAMES, 'Angle', 'RightAngle', 'Tick', 'Dimension'],
  context: () => ({ dimension: 2, why: 'a Diagram is 2D' }),
  check(diagram, { fail }) {
    if (diagram.children.length > LIMITS.layers) fail(`${diagram.children.length.toLocaleString('en')} layers; the limit is ${LIMITS.layers}`);
  },
});
