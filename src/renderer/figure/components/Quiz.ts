import { component, field } from '@/renderer/figure/components/component';
import { LIMITS } from '@/renderer/figure/FigureData';

export const Quiz = component({
  name: 'Quiz',
  summary: 'a multiple-choice check; `correct` is one of the options, written exactly as in `options`. The host marks the answer and sends it as the student\'s next message, so ask one and wait.',
  fields: {
    id: field.optional(field.id()),
    question: field.text(),
    options: field.list(field.text(), { min: 2, max: LIMITS.quizOptions }),
    correct: field.text({ copy: true }),
    explanation: field.optional(field.text()),
  },
  check(quiz, { fail }) {
    if (!quiz.options.includes(quiz.correct)) fail('correct must be one of its options');
  },
});
