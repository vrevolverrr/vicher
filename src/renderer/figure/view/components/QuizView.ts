import type { NodeOf } from '@/renderer/figure/components/registry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import { drawQuiz } from '@/renderer/figure/view/drawQuiz';

export const QuizView: ElementView<NodeOf<'Quiz'>> = {
  draw(el, quiz, ctx) {
    el.className = 'vicher-figure-quiz';
    ctx.mark(el, quiz.id);
    const answers = ctx.keep<Map<string, number>>('answers');
    if (!answers.get()) answers.set(new Map());
    drawQuiz(el, quiz, ctx.markdown, answers.get()!, ctx.send);
  },
};
