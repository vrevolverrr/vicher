import type { NodeOf } from '@/renderer/figure/components/registry';
import { status } from '@/renderer/figure/geometry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { pointerLabel } from '@/renderer/figure/view/drawLinks';

export const NodeView: ElementView<NodeOf<'Node'>> = {
  draw(el, node, ctx) {
    el.className = `vicher-figure-node${node.shape === 'circle' ? ' is-circle' : ''}`;
    ctx.mark(el, node.id, node.tag);
    ctx.markdown(ctx.child('vicher-figure-node-label', el), `${status(el.dataset.tag ?? '')}${node.label}`);
    if (node.sub !== undefined) ctx.markdown(ctx.child('vicher-figure-node-sub', el), node.sub);
  },
};

export const TextView: ElementView<NodeOf<'Text'>> = {
  draw(el, node, ctx) {
    el.className = 'vicher-figure-text';
    ctx.markdown(ctx.mark(el, node.id), node.text);
  },
};

export const TexView: ElementView<NodeOf<'Tex'>> = {
  draw(el, node, ctx) {
    el.className = 'vicher-figure-tex';
    ctx.mark(el, node.id);
    ctx.tex(ctx.child('vicher-figure-tex-math', el), node.tex);
    if (!ctx.lane) return;
    const column = ctx.child('vicher-figure-tex-lane', el);
    column.setAttribute('aria-hidden', 'true');
    const sizes = ctx.child('vicher-figure-tex-sizes', column);
    for (const name of ctx.lane.names) sizes.append(pointerLabel(name, '←', ctx.markdown));
  },
};
