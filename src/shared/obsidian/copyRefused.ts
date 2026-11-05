import { Notice } from 'obsidian';

import { messageOf } from '@/shared/messageOf';

export function copyRefused(error: unknown): void {
  new Notice(`Could not copy: ${messageOf(error)}`);
}
