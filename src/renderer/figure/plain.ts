/** Reading the plain data a figure program returned, and writing its limits into messages. */
export type Plain = Record<string, unknown>;

export const isObject = (value: unknown): value is Plain => typeof value === 'object' && value !== null && !Array.isArray(value);

/** A prop the object holds itself, never one it inherits. */
export const own = (object: Plain, key: string): unknown => (Object.hasOwn(object, key) ? object[key] : undefined);

export const count = (n: number): string => n.toLocaleString('en');

export const over = (n: number, what: string, limit: number): string => `${count(n)} ${what}; the limit is ${count(limit)}`;
