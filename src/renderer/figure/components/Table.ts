import { component, field } from '@/renderer/figure/components/component';
import { LIMITS } from '@/renderer/figure/FigureData';

const cells = (rowIds: readonly string[] | undefined, columns: number): string[] =>
  (rowIds ?? []).flatMap((row) => Array.from({ length: columns }, (_, c) => `${row}.${c}`));

export const Table = component({
  name: 'Table',
  summary: 'each row one cell per column; a cell is text, a number or `null`.',
  fields: {
    id: field.optional(field.id()),
    title: field.optional(field.text()),
    columns: field.list(field.text(), { min: 1, max: LIMITS.tableColumns }),
    rows: field.list(field.list(field.either(field.literal(null), field.text(), 'must be text, a number or null')), { max: LIMITS.tableRows }),
    rowIds: field.optional(field.list(field.id(), { max: LIMITS.tableRows }))
      .doc('`rowIds` is optional: give it, one id per row, only when a tag, `Arrow` or `Pointer` names a row or cell. A cell then has the id `rowId.column` (0-based column): a DP table, a Punnett square or a pipeline marks `{ \'r2.3\': \'active\' }`.'),
    tags: field.optional(field.tags()),
  },
  check(table, { fail }) {
    table.rows.forEach((row, r) => {
      if (row.length !== table.columns.length) fail(`rows[${r}] has ${row.length} cells; give ${table.columns.length}, one per column`);
    });
    if (table.rowIds && table.rowIds.length !== table.rows.length) fail(`${table.rows.length} rows but ${table.rowIds.length} rowIds; give one id per row`);
  },
  ids: (table) => cells(table.rowIds, table.columns.length),
  pointable: (table) => [...(table.rowIds ?? []), ...cells(table.rowIds, table.columns.length)],
});
