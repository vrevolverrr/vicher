import { setIcon } from 'obsidian';

/** The one place outside an `obsidian/` folder that reaches Obsidian: its icon set. */
export { setIcon };

/** Draws an icon into the element it is attached to. */
export const icon = (name: string) => (el: HTMLElement): void => setIcon(el, name);
