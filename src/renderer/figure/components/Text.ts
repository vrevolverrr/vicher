import { component, field } from '@/renderer/figure/components/component';

export const Text = component({
  name: 'Text',
  signature: '<Text>...</Text>` or `<Text id text />',
  summary: 'a paragraph.',
  fields: { id: field.optional(field.id()), text: field.text() },
  textChildren: 'text',
  check(text, { fail }) {
    if (!text.text.trim()) fail('Text is empty');
  },
});
