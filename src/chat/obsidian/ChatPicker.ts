import type { App } from 'obsidian';
import { Modal, Notice } from 'obsidian';
import { mount, unmount } from 'svelte';

import type { ChatSummary } from '@/chat/ChatRecord';
import ChatPickerList from '@/chat/view/ChatPickerList.svelte';
import { messageOf } from '@/shared/messageOf';

export interface ChatPickerActions {
  open(chatId: string): void;
  remove(chatId: string): Promise<void>;
}

/** Every saved chat, grouped by day, with search over titles and conversations and a delete on each row. */
export class ChatPicker extends Modal {
  private list?: ReturnType<typeof ChatPickerList>;

  constructor(
    app: App,
    private readonly chats: ChatSummary[],
    private readonly actions: ChatPickerActions,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.removeClass('modal');
    this.modalEl.addClass('prompt', 'vicher-chat-modal');
    this.modalEl.empty();
    this.modalEl.setAttribute('aria-label', 'All chats');
    this.list = mount(ChatPickerList, {
      target: this.modalEl,
      props: {
        chats: this.chats,
        host: {
          open: (chatId: string) => {
            this.close();
            this.actions.open(chatId);
          },
          remove: async (chatId: string) => {
            try {
              await this.actions.remove(chatId);
              return true;
            } catch (error) {
              new Notice(`Could not delete the chat: ${messageOf(error)}`);
              return false;
            }
          },
          close: () => this.close(),
        },
      },
    });
    this.contentEl = this.modalEl.querySelector<HTMLElement>('.vicher-chat-list')!;
  }

  onClose(): void {
    if (this.list) void unmount(this.list);
    this.list = undefined;
    this.modalEl.empty();
  }
}
