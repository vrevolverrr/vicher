import { component, field } from '@/renderer/figure/components/component';
import { BLOCK_NAMES } from '@/renderer/figure/components/names';

export const Column = component({
  name: 'Column',
  summary: 'stacked.',
  fields: { id: field.optional(field.id()), gap: field.optional(field.choice(['sm', 'md', 'lg'])), align: field.optional(field.choice(['start', 'center', 'end'])) },
  children: BLOCK_NAMES,
});
