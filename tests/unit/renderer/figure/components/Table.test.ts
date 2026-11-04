import { el, read } from './read';

describe('Table', () => {
  it('reads cells as text, null as an empty cell, and claims each row and cell id', () => {
    expect(read(el('Table', { columns: ['a', 'b'], rows: [[0.1 + 0.2, null]], rowIds: ['r'], tags: { 'r.1': 'new' } }))).toMatchObject({ rows: [['0.3', null]] });
  });

  it.each([
    [{ columns: ['a', 'b'], rows: [[1]] }, 'Step 1 > Table: rows[0] has 1 cells; give 2, one per column'],
    [{ columns: ['a'], rows: [[1], [2]], rowIds: ['r'] }, 'Step 1 > Table: 2 rows but 1 rowIds; give one id per row'],
    [{ columns: [], rows: [] }, 'Step 1 > Table: columns needs at least 1'],
    [{ columns: ['a'], rows: [[{}]] }, 'Step 1 > Table: rows[0][0] must be text, a number or null'],
    [{ columns: ['a'], rows: [['a'.repeat(2001)]] }, 'Step 1 > Table: rows[0][0] is 2,001 characters; the limit is 2,000'],
    [{ columns: ['a'], rows: [], tags: { t: 'red' } }, 'Step 1 > Table: tags has a tag for "t" that is not one of active, done, match, new, dim, good, bad'],
  ])('refuses %j', (props, message) => {
    expect(read(el('Table', props))).toBe(message);
  });
});
