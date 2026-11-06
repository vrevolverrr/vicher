import { component, field, marks } from '@/renderer/figure/components/component';

export const Arrow = component({
  name: 'Arrow',
  summary: 'an arrow between any two elements, rows, items or nodes.',
  fields: { from: field.target(), to: field.target(), label: field.optional(field.text()), ...marks },
});
