import { component, field } from '@/renderer/figure/components/component';
import { BLOCK_NAMES } from '@/renderer/figure/components/names';

export const Panel = component({
  name: 'Panel',
  summary: 'a titled box around a group.',
  fields: { id: field.optional(field.id()), title: field.optional(field.text()), tag: field.optional(field.tag()) },
  children: BLOCK_NAMES,
});
