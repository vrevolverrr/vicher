import { component, field } from '@/renderer/figure/components/component';
import { SHARED_LAYER_NAMES } from '@/renderer/figure/components/names';
import { LIMITS } from '@/renderer/figure/FigureData';
import { over } from '@/renderer/figure/plain';

export const Diagram = component({
  name: 'Diagram',
  summary: `a 2D free drawing in the model's own units (metres, grid cells), y upwards, at one scale for both axes, fitted to the pane by the host; \`width\` and \`height\` are the extent of the drawing in its units, and \`height\` is at most ${LIMITS.diagramTallness} times \`width\`.`,
  fields: { id: field.optional(field.id()), width: field.number({ above: 0 }), height: field.number({ above: 0 }) },
  children: [...SHARED_LAYER_NAMES, 'Angle', 'RightAngle', 'Tick', 'Dimension'],
  context: () => ({ dimension: 2, why: 'a Diagram is 2D' }),
  check(diagram, { fail }) {
    if (diagram.children.length > LIMITS.layers) fail(over(diagram.children.length, 'layers', LIMITS.layers));
    if (diagram.height > LIMITS.diagramTallness * diagram.width) fail(`height ${diagram.height} is over ${LIMITS.diagramTallness} times width ${diagram.width}: both axes share one scale, so it draws as a sliver; a chart goes in a Plot, and a drawing is laid out wider`);
  },
});
