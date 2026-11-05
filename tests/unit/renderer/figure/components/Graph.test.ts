import { el, read } from './read';

describe('Graph', () => {
  it('claims node and edge ids, so groups, states and links can name them', () => {
    expect(read(el('Graph', { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ id: 'ab', from: 'a', to: 'b' }], states: { ab: 'active', a: 'done' } }))).toMatchObject({ type: 'Graph' });
  });

  it('refuses an edge to a node it does not hold', () => {
    expect(read(el('Graph', { nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'z' }] }))).toBe('Step 1 > Graph: edges[0] joins "z", which is no node of this Graph');
  });

  it('needs a node', () => {
    expect(read(el('Graph', { nodes: [], edges: [] }))).toBe('Step 1 > Graph: nodes needs at least 1');
  });
});
