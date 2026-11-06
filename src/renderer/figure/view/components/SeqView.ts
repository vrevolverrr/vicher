import type { NodeOf } from '@/renderer/figure/components/registry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { POINTER_STEP } from '@/renderer/figure/view/drawLinks';

export const SeqView: ElementView<NodeOf<'Seq'>> = {
  draw(wrap, node, ctx) {
    wrap.className = 'vicher-figure-seq';
    ctx.mark(wrap, node.id);
    if (node.title !== undefined) ctx.markdown(ctx.child('vicher-figure-title', wrap), node.title);
    const items = ctx.child('vicher-figure-seq-items', wrap);
    node.items.forEach((item, i) => {
      const column = ctx.child('vicher-figure-seq-item', items);
      if (node.index) ctx.child('vicher-figure-seq-index', column).textContent = node.index === true ? String(i) : node.index[i] ?? '';
      const cell = ctx.mark(ctx.child('vicher-figure-seq-cell', column), item.id);
      ctx.markdown(cell, item.label);
    });
    if (ctx.lane) ctx.child('vicher-figure-lane', wrap).style.height = `${ctx.lane.count * POINTER_STEP + 4}px`;
  },
};
