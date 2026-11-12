import { component, field, marks } from '@/renderer/figure/components/component';

const end = (): ReturnType<typeof field.either<number, string>> => field.either(field.number(), field.ref(), 'must be an Fn id or a number');

export const Region = component({
  name: 'Region',
  signature: '<Region id top="fnId or number" base from to label group state />',
  summary: 'shaded between `top` and `base`, default 0, and the only way to shade in a Plot: a closed `Shape` there is an outline. A number `top` with `from` and `to` is a rectangle, a light fill with an outline that shows the curve behind it: one `Region` per bar of a histogram or a Riemann sum, or with a number `base` a window over a range of both axes (an ε–δ box).',
  variants: {
    Region: { dimension: 2, fields: { id: field.optional(field.id()), top: end(), base: field.optional(end()), from: field.optional(field.number()), to: field.optional(field.number()), label: field.optional(field.text()), ...marks } },
  },
});
