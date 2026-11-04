import type { NodeOf } from '@/renderer/figure/components/registry';
import type { FigureNode } from '@/renderer/figure/FigureData';
import { DiagramView } from '@/renderer/figure/view/components/DiagramView';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { GraphView } from '@/renderer/figure/view/components/GraphView';
import { LayoutView, PanelView } from '@/renderer/figure/view/components/LayoutView';
import { Plot3View, PlotView } from '@/renderer/figure/view/components/PlotViews';
import { QuizView } from '@/renderer/figure/view/components/QuizView';
import { SeqView } from '@/renderer/figure/view/components/SeqView';
import { TableView } from '@/renderer/figure/view/components/TableView';
import { NodeView, TexView, TextView } from '@/renderer/figure/view/components/TextViews';

/** The core draws links after a step is laid out; every other block has a view. */
export type DrawnType = Exclude<FigureNode['type'], 'Arrow' | 'Pointer'>;

export const VIEWS: { [K in DrawnType]: ElementView<NodeOf<K>> } = {
  Row: LayoutView, Column: LayoutView, Panel: PanelView, Table: TableView, Seq: SeqView, Node: NodeView, Text: TextView, Tex: TexView,
  Graph: GraphView, Quiz: QuizView, Plot: PlotView, Plot3: Plot3View, Diagram: DiagramView,
};
