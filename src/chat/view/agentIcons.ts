import { isAgentId, PROVIDERS, type ProviderInfo } from '@/agents/providers';
import type { AgentId } from '@/agents/types';

const FALLBACK = { viewBox: '0 0 24 24', path: 'M3 3h18v14H9l-6 5V3Zm2 2v12.7L8.3 15H19V5H5Z' };
const SVG = 'http://www.w3.org/2000/svg';

/** Appends the agent's logo, or a generic one for an agent without artwork. */
export function appendAgentIcon(parent: HTMLElement, agent: AgentId): void {
  drawAgentIcon(parent.appendChild(document.createElementNS(SVG, 'svg')), agent);
}

/** Draws the agent's logo into the `<svg>` it is attached to. */
export const agentIcon = (agent: AgentId) => (svg: SVGSVGElement): void => drawAgentIcon(svg, agent);

function drawAgentIcon(svg: SVGSVGElement, agent: AgentId): void {
  const info: ProviderInfo | undefined = isAgentId(agent) ? PROVIDERS[agent] : undefined;
  const icon: NonNullable<ProviderInfo['icon']> = info?.icon ?? FALLBACK;
  svg.classList.add('vicher-agent-icon');
  svg.setAttribute('viewBox', icon.viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('data-agent', agent);
  if (icon.color) svg.style.setProperty('--vicher-agent-color', icon.color);
  else svg.style.removeProperty('--vicher-agent-color');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', icon.path);
  path.setAttribute('fill', 'currentColor');
  svg.replaceChildren(path);
}
