/** @vitest-environment jsdom */
import type { AgentId } from '@/agents/types';
import { agentIcon } from '@/chat/view/agentIcons';

const draw = (agent: AgentId) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  agentIcon(agent)(svg);
  return svg;
};

it('uses a generic icon for a provider without custom artwork', () => {
  // Simulate a newly registered provider before custom UI artwork is added.
  const icon = draw('unbranded' as AgentId);

  expect(icon.classList.contains('vicher-agent-icon')).toBe(true);
  expect(icon.getAttribute('data-agent')).toBe('unbranded');
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(icon.querySelector('path')?.getAttribute('d')).not.toBe(draw('claude').querySelector('path')!.getAttribute('d'));
});
