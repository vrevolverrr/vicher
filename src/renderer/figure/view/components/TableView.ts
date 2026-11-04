import type { NodeOf } from '@/renderer/figure/components/registry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';

export const TableView: ElementView<NodeOf<'Table'>> = {
  draw(wrap, node, ctx) {
    wrap.className = 'vicher-figure-table';
    ctx.mark(wrap, node.id);
    if (node.title !== undefined) ctx.markdown(ctx.child('vicher-figure-title', wrap), node.title);
    const table = wrap.appendChild(createEl('table'));
    if (ctx.lane) wrap.style.paddingLeft = `${ctx.lane.name + 3}ch`;
    const head = table.createTHead().insertRow();
    for (const column of node.columns) ctx.markdown(head.appendChild(Object.assign(createEl('th'), { className: 'vicher-figure-cell' })), column);
    const rows = table.createTBody();
    node.rows.forEach((cells, r) => {
      const rowId = node.rowIds?.[r];
      const row = ctx.mark(rows.insertRow(), rowId);
      cells.forEach((cell, c) => {
        const td = ctx.mark(row.insertCell(), rowId && `${rowId}.${c}`);
        td.classList.add('vicher-figure-cell');
        if (cell === null) td.textContent = '–';
        else ctx.markdown(td, cell);
      });
    });
  },
};
