import { component, field } from '@/renderer/figure/components/component';
import { LIMITS } from '@/renderer/figure/FigureData';

export const Seq = component({
  name: 'Seq',
  summary: 'a strip of cells for an array, queue or string.',
  fields: {
    id: field.optional(field.id()),
    title: field.optional(field.text()),
    items: field.list(field.object({ id: field.id(), label: field.text() }), { max: LIMITS.seqItems }),
    index: field.optional(field.either(field.boolean(), field.list(field.text(), { max: LIMITS.seqItems }), 'must be true or a list of labels'))
      .doc('`index` shows 0, 1, 2… above the cells, or an array of labels.'),
    groups: field.optional(field.groups()),
    states: field.optional(field.states()),
  },
  pointable: (seq) => seq.items.map((item) => item.id),
});
