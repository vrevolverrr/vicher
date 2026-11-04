import { component, field } from '@/renderer/figure/components/component';
import { texAnchors } from '@/renderer/figure/figureTex';

export const Tex = component({
  name: 'Tex',
  summary: 'a displayed formula. Matrices, derivations and determinants are `Tex` in each step; there is no matrix element. All TeX follows the TeX rule below.',
  fields: { id: field.optional(field.id()), tex: field.tex() },
  pointable: (tex) => [...(tex.id ? [tex.id] : []), ...texAnchors(tex.tex)],
});
