/** The colours a figure can use, in the order groups take them: red and green come last, so two groups rarely differ by those alone. */
export const COLORS = ['blue', 'orange', 'purple', 'cyan', 'pink', 'yellow', 'green', 'red'] as const;
export type Color = (typeof COLORS)[number];
export const isColor = (name: unknown): name is Color => (COLORS as readonly unknown[]).includes(name);

/** A name's colour in this figure. */
export type ColorOf = (name: string | undefined) => string | undefined;

/** States keep a fixed meaning and a mark that is not colour alone: `active` a thick line, `done` a dashed one, `dim` a fade. */
export const STATES = ['active', 'done', 'dim'] as const;
export type State = (typeof STATES)[number];
