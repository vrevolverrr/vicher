import type { AgentId, ModelOption, PermissionPolicy } from '@/agents/types';
import type { ModelChoice } from '@/chat/ChatDefaults';

/** What the model, effort and permission pickers read from and write to the chat. */
export interface PickerHost {
  readonly agent: AgentId;
  models(agent: AgentId): Promise<ModelOption[]>;
  choice(agent: AgentId): ModelChoice;
  /** Saves the choice for `agent`, switching the chat to that agent first if needed. */
  choose(agent: AgentId, choice: ModelChoice): Promise<void>;
  readonly permissionPolicy: PermissionPolicy;
  choosePermission(policy: PermissionPolicy): Promise<void>;
}
