/** The states a figure marks elements with; the host maps each to a theme colour and a key entry. Phase B of `docs/specs/figure-components.md` proposes replacing them. */
export const TAGS = ['active', 'done', 'match', 'new', 'dim', 'good', 'bad'] as const;
export type Tag = (typeof TAGS)[number];
