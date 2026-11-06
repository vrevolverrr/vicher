import type { NodeOf } from '@/renderer/figure/components/registry';
import { diagramExtent, type Extent, type Room, widen } from '@/renderer/figure/packages/diagram/diagramExtent';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { drawDiagram } from '@/renderer/figure/view/drawDiagram';

/** Every step of a Diagram shares one extent, grown over earlier draws, and the most room past its border any step needs. */
export const DiagramView: ElementView<NodeOf<'Diagram'>, Extent> = {
  prepare: (diagrams, kept) => diagrams.reduce<Extent | undefined>((extent, diagram) => diagramExtent(diagram, extent), kept)!,
  holdsRange: true,
  draw(el, node, ctx) {
    el.className = 'vicher-figure-canvas';
    const drawing = ctx.mark(ctx.child('vicher-figure-diagram', el), node.id);
    const extent = ctx.prepared ?? diagramExtent(node);
    const room = ctx.keep<Room>('room');
    const paint = (): void => {
      const kept = room.get() ?? { left: 0, top: 0, right: 0, bottom: 0 };
      const grown = widen(kept, drawDiagram(drawing, node, extent, ctx.width, ctx.markdown, kept, ctx.colorOf));
      if ((['left', 'top', 'right', 'bottom'] as const).every((side) => grown[side] === kept[side])) return;
      room.set(grown);
      ctx.stale();
    };
    paint();
    return { repaint: paint };
  },
};
