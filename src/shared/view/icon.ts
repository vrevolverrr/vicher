import { setIcon } from 'obsidian';

/** The one place outside an `obsidian/` folder that reaches Obsidian: its icon set. */
export { setIcon };

/** Draws an icon into the element it is attached to. */
export const icon = (name: string) => (el: HTMLElement): void => setIcon(el, name);

export function createIconButton(parent: HTMLElement, name: string, label: string, cls = ''): HTMLElement {
  const button = parent.createEl('button', { cls: `vicher-icon-action clickable-icon ${cls}`.trim(), attr: { 'aria-label': label } });
  setIcon(button, name);
  return button;
}
