/** @vitest-environment jsdom */
import { flushSync, mount, unmount } from 'svelte';
import type { FigureNode } from '@/renderer/figure/FigureData';
import Quiz from '@/renderer/figure/view/Quiz.svelte';

type QuizNode = Extract<FigureNode, { type: 'Quiz' }>;

let drawn: ReturnType<typeof Quiz>;
const markdown = vi.fn((el: HTMLElement, text: string | number) => {
  el.textContent = String(text);
});

const base = { type: 'Quiz', question: 'Which?', options: ['x', 'y', 'z'], correct: 'y' } as unknown as QuizNode;

function draw(quiz: QuizNode = base, answers = new Map<string, number>(), send?: (message: string) => boolean) {
  drawn = mount(Quiz, { target: document.body, props: { quiz, markdown, answers, send } });
  flushSync();
  return answers;
}

const options = () => [...document.body.querySelectorAll<HTMLButtonElement>('.vicher-quiz-option')];
const submit = () => document.body.querySelector<HTMLButtonElement>('.vicher-quiz-submit');
const note = () => document.body.querySelector('.vicher-quiz-note');
const click = (el: HTMLElement) => {
  el.click();
  flushSync();
};
const marks = () => options().map((option) => [option.classList.contains('is-correct'), option.classList.contains('is-wrong')]);

beforeEach(() => {
  document.body.replaceChildren();
  markdown.mockClear();
});

afterEach(() => void unmount(drawn));

describe('Quiz', () => {
  it('writes the question and every option through the host', () => {
    draw();

    expect(markdown.mock.calls.map(([, text]) => text)).toEqual(['Which?', 'x', 'y', 'z']);
    expect(document.body.querySelector('.vicher-quiz-question')!.textContent).toBe('Which?');
    expect(options().map((option) => option.textContent)).toEqual(['x', 'y', 'z']);
  });

  it('is a radio group of radios, none checked, with Submit disabled', () => {
    draw();

    expect(document.body.querySelector('.vicher-quiz-options')!.getAttribute('role')).toBe('radiogroup');
    expect(options().map((option) => [option.getAttribute('role'), option.getAttribute('aria-checked')])).toEqual([['radio', 'false'], ['radio', 'false'], ['radio', 'false']]);
    expect(submit()!.disabled).toBe(true);
  });

  it('checks the option clicked, moves the check, and enables Submit', () => {
    draw();

    click(options()[0]);
    click(options()[2]);

    expect(options().map((option) => option.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(submit()!.disabled).toBe(false);
  });

  it('sends the answer as plain text, marks it, and removes the Submit bar', () => {
    const send = vi.fn(() => true);
    const quiz = { ...base, question: '<b>Which</b> one?<!-- hide -->', options: ['<i>x</i>​', 'y', 'z'] } as QuizNode;
    const answers = draw(quiz, undefined, send);

    click(options()[0]);
    click(submit()!);

    expect(send).toHaveBeenCalledWith('My answer: x (not correct). Question: Which one?');
    expect(marks()).toEqual([[false, true], [true, false], [false, false]]);
    expect(options().every((option) => option.disabled)).toBe(true);
    expect(document.body.querySelector('.vicher-quiz-bar')).toBeNull();
    expect([...answers.values()]).toEqual([0]);
  });

  it('cuts what it sends in the student\'s name to 200 characters of each part', () => {
    const send = vi.fn(() => true);
    draw({ ...base, question: 'q'.repeat(300) } as QuizNode, undefined, send);

    click(options()[1]);
    click(submit()!);

    expect(send).toHaveBeenCalledWith(`My answer: y (correct). Question: ${'q'.repeat(200)}`);
  });

  it('asks the student to wait when the chat cannot take the answer, and sends again on the next Submit', () => {
    const send = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    draw(base, undefined, send);
    click(options()[1]);

    click(submit()!);
    expect(note()!.textContent).toBe('Wait for the reply to finish, then submit.');
    expect(options().every((option) => !option.disabled)).toBe(true);
    expect(marks().flat()).not.toContain(true);

    click(submit()!);
    expect(send).toHaveBeenCalledTimes(2);
    expect(document.body.querySelector('.vicher-quiz-bar')).toBeNull();
  });

  it('clears the wait note when another option is picked', () => {
    draw(base, undefined, () => false);
    click(options()[1]);
    click(submit()!);

    click(options()[2]);

    expect(note()!.textContent).toBe('');
  });

  it('marks the answer without sending when no send is given', () => {
    draw();
    click(options()[1]);
    click(submit()!);

    expect(marks()).toEqual([[false, false], [true, false], [false, false]]);
  });

  it('shows the explanation under a correct answer only', () => {
    const quiz = { ...base, explanation: 'Because y.' } as QuizNode;
    draw(quiz);
    click(options()[0]);
    click(submit()!);
    expect(document.body.querySelector('.vicher-quiz-feedback')).toBeNull();
    void unmount(drawn);
    document.body.replaceChildren();

    draw(quiz);
    click(options()[1]);
    click(submit()!);
    const feedback = document.body.querySelector('.vicher-quiz-feedback')!;
    expect(feedback.textContent).toBe('Because y.');
    expect(feedback.getAttribute('aria-live')).toBe('polite');
  });

  it('draws a Quiz already answered when its answer was kept, and not one whose question changed', () => {
    const answers = new Map<string, number>();
    draw(base, answers, () => true);
    click(options()[0]);
    click(submit()!);
    void unmount(drawn);
    document.body.replaceChildren();

    draw(base, answers);
    expect(marks()).toEqual([[false, true], [true, false], [false, false]]);
    expect(options()[0].getAttribute('aria-checked')).toBe('true');
    expect(submit()).toBeNull();
    void unmount(drawn);
    document.body.replaceChildren();

    draw({ ...base, question: 'Which now?' } as QuizNode, answers);
    expect(marks().flat()).not.toContain(true);
    expect(submit()).not.toBeNull();
  });
});
