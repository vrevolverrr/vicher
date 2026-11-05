import { component, field } from '@/renderer/figure/components/component';

export const Pointer = component({
  name: 'Pointer',
  summary: 'a named marker under a Seq item, left of a Table row, or beside any element. Keep `name` short (a variable, an index, a row operation): it takes room beside what it marks.',
  fields: { to: field.target(), name: field.text(), group: field.optional(field.group()), state: field.optional(field.state()) },
});
