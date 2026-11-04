import { el, read } from './read';

describe('Text', () => {
  it('reads its text from a prop or from text children', () => {
    expect(read(el('Text', { text: 'a' }))).toEqual({ type: 'Text', text: 'a' });
    expect(read(el('Text', {}, 'n = ', 2))).toEqual({ type: 'Text', text: 'n = 2' });
  });

  it.each([
    [el('Text', { text: ' ' }), 'Step 1 > Text: Text is empty'],
    [el('Text', { text: 'a' }, 'b'), 'Step 1 > Text: give its text as a prop or as children, not both'],
    [el('Text', { text: '$\\style{color:red}{x}$' }), 'Step 1 > Text: text breaks the TeX rule: TeX \\style is not allowed; colour with a tag'],
  ])('refuses %j', (element, message) => {
    expect(read(element)).toBe(message);
  });
});
