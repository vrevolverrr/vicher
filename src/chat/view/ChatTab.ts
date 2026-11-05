import type { AgentId } from '@/agents/types';

export interface ChatTab {
  id: string;
  title: string;
  agent: AgentId;
  running: boolean;
  unread: boolean;
  failed: boolean;
  waitingForApproval?: boolean;
}

export function chatTabStatus(tab: ChatTab): string {
  return tab.waitingForApproval ? 'Needs approval' : tab.running ? 'Working' : tab.failed ? 'Failed' : tab.unread ? 'Unread reply' : '';
}

export interface ChatTabsHost {
  create(): void;
  select(id: string): void;
  close(id: string): void;
}
