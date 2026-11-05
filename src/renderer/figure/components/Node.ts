import { component, field } from '@/renderer/figure/components/component';

export const Node = component({
  name: 'Node',
  summary: 'one labelled box or circle, with an optional second smaller line; also the stat tile (`label` the value, `sub` what it is).',
  fields: { id: field.optional(field.id()), label: field.text(), sub: field.optional(field.text()), shape: field.optional(field.choice(['box', 'circle'])), group: field.optional(field.group()), state: field.optional(field.state()) },
});
