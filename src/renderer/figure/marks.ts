/** The colours a figure can use, in the order groups take them: red and green come last, so two groups rarely differ by those alone. */
export const COLORS = ['blue', 'orange', 'purple', 'cyan', 'pink', 'yellow', 'green', 'red'] as const;
export type Color = (typeof COLORS)[number];

/** States keep a fixed meaning and a mark that is not colour alone: `active` an outline and ▶, `done` a ✓, `dim` a fade. */
export const STATES = ['active', 'done', 'dim'] as const;
export type State = (typeof STATES)[number];
