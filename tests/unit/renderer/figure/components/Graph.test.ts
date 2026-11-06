import { el, read } from './read';

describe('Graph', () => {
  it('claims node and edge ids, so groups, states and links can name them', () => {
    expect(read(el('Graph', { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ id: 'ab', from: 'a', to: 'b' }], states: { ab: 'active', a: 'done' } }))).toMatchObject({ type: 'Graph' });
  });

  it('reads a group or state written on a node or edge as if in the Graph\'s maps, which win', () => {
    const graph = read(el('Graph', { nodes: [{ id: 'a', state: 'active', group: 'x' }, { id: 'b', state: 'done' }], edges: [{ id: 'ab', from: 'a', to: 'b', groups: undefined, state: 'dim' }], states: { b: 'dim' } })) as unknown as { states: Map<string, string>; groups: Map<string, string>; nodes: object[] };
    expect([...graph.states]).toEqual([['a', 'active'], ['b', 'dim'], ['ab', 'dim']]);
    expect([...graph.groups]).toEqual([['a', 'x']]);
    expect(graph.nodes[0]).toEqual({ id: 'a' });
  });

  it('refuses a state on an edge with no id to key it by', () => {
    expect(read(el('Graph', { nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'a', state: 'dim' }] }))).toContain('unknown key "state"');
  });

  it('refuses an edge to a node it does not hold', () => {
    expect(read(el('Graph', { nodes: [{ id: 'a' }], edges: [{ from: 'a', to: 'z' }] }))).toBe('Step 1 > Graph: edges[0] joins "z", which is no node of this Graph');
  });

  it('needs a node', () => {
    expect(read(el('Graph', { nodes: [], edges: [] }))).toBe('Step 1 > Graph: nodes needs at least 1');
  });
});
