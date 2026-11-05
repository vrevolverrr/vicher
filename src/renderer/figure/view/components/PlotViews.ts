import type { NodeOf } from '@/renderer/figure/components/registry';
import type { View } from '@/renderer/figure/packages/plot3/Plot3Model';
import { plot3Model, plotModel } from '@/renderer/figure/plotModels';
import type { DrawContext, Drawn, ElementView } from '@/renderer/figure/view/components/ElementView';
import { PlotChart } from '@/renderer/figure/view/PlotChart';
import { Plot3Chart } from '@/renderer/figure/view/Plot3Chart';

/** The chart's element, as wide as the pane, inside the canvas card `el`. */
function frame(el: HTMLElement, id: string | undefined, ctx: DrawContext): HTMLElement {
  el.className = 'vicher-figure-canvas';
  const plot = ctx.mark(ctx.child('vicher-figure-plot', el), id);
  plot.style.width = `${ctx.width}px`;
  return plot;
}

function drawn(plot: HTMLElement, chart: PlotChart | Plot3Chart, ctx: DrawContext): Drawn {
  return {
    repaint: () => {
      plot.style.width = `${ctx.width}px`;
      chart.repaint();
    },
    active: chart instanceof Plot3Chart ? (shown) => chart.setActive(shown) : undefined,
    destroy: () => chart.destroy(),
  };
}

export const PlotView: ElementView<NodeOf<'Plot'>> = {
  draw(el, node, ctx) {
    const plot = frame(el, node.id, ctx);
    const chart = new PlotChart(plot);
    chart.height = (width) => Math.min(360, (width * 2) / 3);
    chart.writeLabel = ctx.markdown;
    chart.render(plotModel(node, ctx.colorOf));
    return drawn(plot, chart, ctx);
  },
};

export const Plot3View: ElementView<NodeOf<'Plot3'>> = {
  draw(el, node, ctx) {
    const plot = frame(el, node.id, ctx);
    // The angle the student turned it to, kept across steps and param reruns.
    const chart = new Plot3Chart(plot, ctx.keep<View>('view'));
    // Taller than a 2D Plot: the box must fit every angle it turns to.
    chart.height = (width) => Math.min(420, width * 0.75);
    chart.writeLabel = ctx.markdown;
    chart.render(plot3Model(node, ctx.colorOf));
    return drawn(plot, chart, ctx);
  },
};
