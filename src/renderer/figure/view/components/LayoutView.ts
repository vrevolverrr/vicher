import type { NodeOf } from '@/renderer/figure/components/registry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';

export const LayoutView: ElementView<NodeOf<'Row' | 'Column'>> = {
  draw(el, node, ctx) {
    el.className = `vicher-figure-${node.type.toLowerCase()} is-gap-${node.gap ?? 'md'} is-align-${node.align ?? 'start'}`;
    ctx.mark(el, node.id);
    ctx.blocks(node.children, el);
  },
};

export const PanelView: ElementView<NodeOf<'Panel'>> = {
  draw(el, panel, ctx) {
    el.className = 'vicher-figure-panel';
    ctx.mark(el, panel.id, panel.tag);
    if (panel.title !== undefined) ctx.markdown(ctx.child('vicher-figure-panel-title', el), panel.title);
    ctx.blocks(panel.children, ctx.child('vicher-figure-panel-body', el));
  },
};
