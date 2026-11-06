import { type Color, COLORS, isColor } from '@/renderer/figure/marks';

export type Rgb = readonly [number, number, number];

// Every span any renderer might typeset as maths: the checks and the sanitising run on these, so they fail closed.
const MATH = /(?<!\\)\$\$[\s\S]+?\$\$|(?<!\\)\$(?:[^$\n\\]|\\.)+?\$/g;
/**
 * Inline maths as Obsidian reads it (Pandoc's rule): no space just inside either `$`, and no digit right after the closing
 * one, so prices stay text. Only for deciding what Vicher typesets itself, never for a check.
 */
export const TYPESET_MATH = /(?<!\\)\$\$[\s\S]+?\$\$|(?<!\\)\$(?=[^\s$])(?:[^$\n\\]|\\.)*?(?<=[^\s\\])\$(?!\d)/g;
const COLOUR = /\\(rowcolor|cellcolor|colorbox|color)\s*(\[[^\]]*\])?\s*\{([^}]*)\}/g;
const BBOX = /\\bbox\s*\[([^\]]*)\]/g;
const ANCHOR = /\\cssId\s*\{([^}]*)\}/g;
const DIMENSION = /^\s*-?[\d.]+\s*(?:px|em|ex|pt|mu|cm|mm|in|pc)?\s*$/;
const COLOR_LIST = COLORS.join(', ');

/** Applies `inMath` to each `$…$` and `$$…$$` of Markdown, delimiters included, and `outside` to the text between. */
export function mapMath(markdown: string, inMath: (math: string) => string, outside: (text: string) => string = (text) => text, pattern = MATH): string {
  let out = '';
  let at = 0;
  for (const match of markdown.matchAll(pattern)) {
    out += outside(markdown.slice(at, match.index)) + inMath(match[0]);
    at = match.index + match[0].length;
  }
  return out + outside(markdown.slice(at));
}

/** The TeX inside a Markdown string's maths. */
export function texIn(markdown: string): string[] {
  return [...markdown.matchAll(MATH)].map((match) => match[0]);
}

/** The anchor names `\cssId{name}{…}` marks. */
export function texAnchors(tex: string): string[] {
  return [...tex.matchAll(ANCHOR)].map((match) => match[1].trim());
}

/** Why the host cannot draw this TeX, or undefined: a colour that is not one of the eight, or a command the host keeps for itself. */
export function texProblems(tex: string): string | undefined {
  if (/\\definecolor\b/.test(tex)) return `TeX \\definecolor is not allowed; a colour is one of ${COLOR_LIST}`;
  const reserved = /\\(class|data)\b/.exec(tex);
  if (reserved) return `TeX \\${reserved[1]} is the host's; mark an anchor with \\cssId{name}{…}`;
  const banned = /\\(style|require)\b/.exec(tex);
  if (banned) return `TeX \\${banned[1]} is not allowed; colour with one of ${COLOR_LIST}`;
  for (const [, , model, name] of tex.matchAll(COLOUR)) {
    if (model || !isColor(name.trim())) return colourProblem(model ? `${model}{${name}}` : name);
  }
  for (const [, args] of tex.matchAll(BBOX)) {
    // The host renders this CSS, so a function or escape could fetch (`url(…)`) past the sandbox.
    const style = args.split(',').find((part) => part.includes(':') && /[\\(]/.test(part));
    if (style !== undefined) return `TeX \\bbox style "${style.trim()}" is not allowed; use a size or one of ${COLOR_LIST}`;
    const colour = args.split(',').find((part) => !DIMENSION.test(part) && !part.includes(':') && !isColor(part.trim()));
    if (colour !== undefined) return colourProblem(colour);
  }
  return undefined;
}

function colourProblem(colour: string): string {
  return `TeX colour "${colour.trim()}" is not allowed; use one of ${COLOR_LIST}`;
}

/** How a colour draws in TeX: `fill` is a background (a row, a cell, a box), else ink. */
export type TexColour = (color: Color, fill: boolean) => Rgb;

/** TeX ready for MathJax: each colour written as the theme's colour, each anchor as a data attribute looked up in its step. */
export function drawTex(tex: string, colour: TexColour): string {
  return tex
    .replace(COLOUR, (whole, command: string, model: string | undefined, name: string) => {
      const color = name.trim();
      return !model && isColor(color) ? `\\${command}[RGB]{${colour(color, command !== 'color').join(',')}}` : whole;
    })
    // \bbox splits its options on commas, so its colour is a style with a space-separated rgb().
    .replace(BBOX, (_, args: string) => `\\bbox[${args.split(',').map((part) => (isColor(part.trim()) ? `background-color:rgb(${colour(part.trim() as Color, true).join(' ')})` : part)).join(',')}]`)
    .replace(ANCHOR, (_, name: string) => `\\data{figure-id=${name.trim()}}`);
}

/** `drawTex` on each piece of maths in a Markdown string. */
export function drawTexIn(markdown: string, colour: TexColour): string {
  return mapMath(markdown, (math) => drawTex(math, colour));
}
