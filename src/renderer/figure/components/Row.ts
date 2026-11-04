import { component, field } from '@/renderer/figure/components/component';
import { BLOCK_NAMES } from '@/renderer/figure/components/names';

/** The props of `Row` and `Column`. */
export const layoutFields = { id: field.optional(field.id()), gap: field.optional(field.choice(['sm', 'md', 'lg'])), align: field.optional(field.choice(['start', 'center', 'end'])) };

export const Row = component({
  name: 'Row',
  summary: 'side by side; wraps when the pane is narrow.',
  fields: layoutFields,
  children: BLOCK_NAMES,
});
