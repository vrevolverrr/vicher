import path from 'node:path';

import { RuleTester } from 'eslint';

import plugin from '../../scripts/eslintLayers.js';

const tester = new RuleTester();
const at = (file: string): string => path.join(process.cwd(), 'src', file);
const rules = plugin.rules!;

tester.run('layers', rules.layers as never, {
  valid: [
    { filename: at('renderer/figure/view/drawGraph.ts'), code: "import { status } from '@/renderer/figure/geometry';" },
    { filename: at('chat/view/TextBlock.ts'), code: "import { FigureView } from '@/renderer/figure/view/FigureView';" },
    { filename: at('agents/claude/ClaudeAgent.ts'), code: "import { x } from './ClaudeModelAdapter';" },
    { filename: at('shared/view/icon.ts'), code: "export { setIcon } from 'obsidian';" },
    { filename: at('renderer/figure/packages/plot3/scene3.ts'), code: "import { TAGS } from '@/renderer/figure/Tag'; import { niceTicks } from '@/renderer/figure/packages/plot/plotMath';" },
  ],
  invalid: [
    { filename: at('renderer/figure/geometry.ts'), code: "import { svg } from '@/renderer/figure/view/dom';", errors: 1 },
    { filename: at('context/systemPrompt.ts'), code: "import { FigureView } from '@/renderer/figure/view/FigureView';", errors: 1 },
    { filename: at('chat/Chat.ts'), code: "import { x } from '../shared/messageOf';", errors: 1 },
    { filename: at('tour/TourPlayer.ts'), code: "import { x } from '@/attachments/attachmentStorage';", errors: 1 },
    { filename: at('chat/Chat.ts'), code: "import { ClaudeAgent } from '@/agents/claude/ClaudeAgent';", errors: 1 },
    { filename: at('agents/claude/ClaudeToolAdapter.ts'), code: "import { x } from '@/agents/claude/ClaudeModelAdapter';", errors: 1 },
    { filename: at('chat/view/Card.ts'), code: "import { Notice } from 'obsidian';", errors: 1 },
    { filename: at('shared/view/icon.ts'), code: "export { setIcon, Notice } from 'obsidian';", errors: 1 },
    { filename: at('renderer/figure/packages/plot/plotMath.ts'), code: "import { LIMITS } from '@/renderer/figure/FigureData';", errors: 1 },
    { filename: at('renderer/figure/packages/plot/plotMath.ts'), code: "import { scene3 } from '@/renderer/figure/packages/plot3/scene3';", errors: 1 },
  ],
});

tester.run('no-dom', rules['no-dom'] as never, {
  valid: [{ filename: at('renderer/figure/view/dom.ts'), code: 'document.createElementNS(ns, tag);' }],
  invalid: [{ filename: at('renderer/figure/geometry.ts'), code: 'document.body;', errors: 1 }],
});

tester.run('provider-names', rules['provider-names'] as never, {
  valid: [{ filename: at('agents/claude/ClaudeAgent.ts'), code: "const name = 'claude';" }],
  invalid: [{ filename: at('chat/Chat.ts'), code: "const name = 'Claude';", errors: 1 }],
});
