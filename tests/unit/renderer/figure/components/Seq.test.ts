import { el, read } from './read';

describe('Seq', () => {
  it('reads index as true or a list of labels', () => {
    expect(read(el('Seq', { items: [{ id: 'a', label: 1 }], index: true }))).toMatchObject({ index: true, items: [{ id: 'a', label: '1' }] });
    expect(read(el('Seq', { items: [], index: [1, 'x'] }))).toMatchObject({ index: ['1', 'x'] });
  });

  it.each([
    [{ items: [{ id: 'a', label: 'x', at: 1 }] }, 'Step 1 > Seq: items[0] has unknown key "at"; it takes id, label'],
    [{ items: [{ id: 'a b', label: 'x' }] }, 'Step 1 > Seq: items[0].id is "a b", which is not an id: 1 to 64 letters, digits and _.:- starting with a letter or digit'],
    [{ items: 'abc' }, 'Step 1 > Seq: items must be a list'],
    [{ items: [], index: 'x' }, 'Step 1 > Seq: index must be true or a list of labels'],
  ])('refuses %j', (props, message) => {
    expect(read(el('Seq', props))).toBe(message);
  });
});
