import { flushSync, mount, unmount } from 'svelte';
import type { NodeOf } from '@/renderer/figure/components/registry';
import type { ElementView } from '@/renderer/figure/view/components/ElementView';
import Quiz from '@/renderer/figure/view/Quiz.svelte';

export const QuizView: ElementView<NodeOf<'Quiz'>> = {
  draw(el, quiz, ctx) {
    el.className = 'vicher-figure-quiz';
    ctx.mark(el, quiz.id);
    const answers = ctx.keep<Map<string, number>>('answers');
    if (!answers.get()) answers.set(new Map());
    const drawn = mount(Quiz, { target: el, props: { quiz, markdown: ctx.markdown, answers: answers.get()!, send: ctx.send } });
    // The text renders through effects, which must run now for the core to wait on them.
    flushSync();
    return { destroy: () => void unmount(drawn) };
  },
};
