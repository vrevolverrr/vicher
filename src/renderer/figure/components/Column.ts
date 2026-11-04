import { component } from '@/renderer/figure/components/component';
import { BLOCK_NAMES } from '@/renderer/figure/components/names';
import { layoutFields } from '@/renderer/figure/components/Row';

export const Column = component({
  name: 'Column',
  summary: 'stacked.',
  fields: layoutFields,
  children: BLOCK_NAMES,
});
