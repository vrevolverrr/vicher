import { component, field } from '@/renderer/figure/components/component';

const end = (): ReturnType<typeof field.either<number, string>> => field.either(field.number(), field.ref(), 'must be an Fn id or a number');

export const Region = component({
  name: 'Region',
  signature: '<Region id top="fnId or number" base from to label tag />',
  summary: 'shaded between `top` and `base`, default 0; a number `top` with `from` and `to` is a bar, so a histogram or a Riemann sum is one `Region` per bar.',
  dimensions: [2],
  fields: { id: field.optional(field.id()), top: end(), base: field.optional(end()), from: field.optional(field.number()), to: field.optional(field.number()), label: field.optional(field.text()), tag: field.optional(field.tag()) },
});
