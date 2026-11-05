import { setIcon } from '@/shared/view/icon';

export function createIconButton(parent: HTMLElement, icon: string, label: string, cls = ''): HTMLElement {
  const button = parent.createEl('button', { cls: `vicher-icon-action clickable-icon ${cls}`.trim(), attr: { 'aria-label': label } });
  setIcon(button, icon);
  return button;
}
