import type { AgentTurn } from '@/chat/ChatRecord';
import { applyFixes, repairFixes, repairMessage } from '@/chat/figureRepair';

const failures = [{ ordinal: 1, error: 'Step 3: bad tag' }, { ordinal: 2, error: 'Step 2: TypeError' }];
const fence = (source: string): string => '```figure\n' + source + '\n```';

describe('repairMessage', () => {
  it('lists each failure by its figure number from 1, then the request', () => {
    expect(repairMessage(failures)).toBe(`<figure-repair>
Figure 2 of your last reply failed: Step 3: bad tag
Figure 3 of your last reply failed: Step 2: TypeError

Rewrite only these figures. Reply with each whole corrected \`\`\`figure fence, in this order, and nothing else. Change only what the errors need. Use no tools.
</figure-repair>`);
  });

  it('puts an error on one line and cuts it at 500 characters with no marker', () => {
    const message = repairMessage([{ ordinal: 0, error: `a\nb\r\n${'x'.repeat(600)}` }]);
    expect(message.split('\n')[1]).toBe(`Figure 1 of your last reply failed: a b ${'x'.repeat(496)}`);
  });
});

describe('repairFixes', () => {
  it('matches fences to failures by order', () => {
    expect(repairFixes(`${fence('one')}\n\n${fence('two')}`, failures)).toEqual(new Map([[1, 'one'], [2, 'two']]));
  });

  it.each([['fewer', fence('one')], ['more', [1, 2, 3].map(String).map(fence).join('\n')], ['no', 'Sorry.']])('applies nothing with %s fences than failures', (_name, reply) => {
    expect(repairFixes(reply, failures)).toBeUndefined();
  });

  it('drops prose, action lines and other fences', () => {
    const reply = `Here it is:\n@Highlight("x")\n${fence('one')}\n\n\`\`\`mermaid\nflowchart LR\n\`\`\`\n\n\`\`\`js\ncode\n\`\`\`\n@Title("t")`;
    expect(repairFixes(reply, failures.slice(0, 1))).toEqual(new Map([[1, 'one']]));
  });

  it('never takes a jsx fence for a figure', () => {
    expect(repairFixes('```jsx\none\n```', failures.slice(0, 1))).toBeUndefined();
  });

  it('keeps a fence cut off before it closes', () => {
    expect(repairFixes('```figure\none', failures.slice(0, 1))).toEqual(new Map([[1, 'one']]));
  });
});

describe('applyFixes', () => {
  it('numbers figures across the text parts and leaves every other part alone', () => {
    const tool = { type: 'tool', id: 't', name: 'Read', title: 'Read', status: 'done' } as const;
    const turn: AgentTurn = { role: 'agent', status: 'completed', at: 1, parts: [{ type: 'text', text: fence('a') }, tool, { type: 'text', text: `${fence('b')}\n${fence('c')}` }] };
    expect(applyFixes(turn, new Map([[2, 'fixed']])).parts).toEqual([{ type: 'text', text: fence('a') }, tool, { type: 'text', text: `${fence('b')}\n${fence('fixed')}` }]);
  });
});
