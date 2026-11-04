import { el, read } from './read';

describe('Quiz', () => {
  it('matches correct to an option as text', () => {
    expect(read(el('Quiz', { question: 'q', options: [1, 2], correct: 2 }))).toMatchObject({ options: ['1', '2'], correct: '2' });
  });

  it('accepts a correct answer that repeats an option holding a TeX anchor', () => {
    expect(read(el('Quiz', { question: 'q', options: ['$\\cssId{a}{x}$', 'b'], correct: '$\\cssId{a}{x}$' }))).toMatchObject({ type: 'Quiz' });
  });

  it.each([
    [{ question: 'q', options: ['a', 'b'], correct: 'c' }, 'Step 1 > Quiz: correct must be one of its options'],
    [{ options: ['a', 'b'], correct: 'a' }, 'Step 1 > Quiz: question is required and must be text'],
    [{ question: 'q', options: ['a'], correct: 'a' }, 'Step 1 > Quiz: options needs at least 2'],
  ])('refuses %j', (props, message) => {
    expect(read(el('Quiz', props))).toBe(message);
  });
});
