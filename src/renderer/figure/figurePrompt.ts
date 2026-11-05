import type { Field } from '@/renderer/figure/components/field';
import { type AnyDefinition, COMPONENTS } from '@/renderer/figure/components/registry';
import { LIMITS } from '@/renderer/figure/FigureData';
import { COLORS } from '@/renderer/figure/marks';

/** A prop as a signature shows it: its name, and the form of its value where the name alone does not say it. */
function propForm(name: string, field: Field): string {
  const inner = field.kind === 'optional' ? field.of! : field;
  const item = inner.of;
  const form = inner.kind === 'choice' ? `="${inner.values!.join('|')}"`
    : inner.kind === 'groups' ? '={{id: name}}'
      : inner.kind === 'states' ? '={{id: state}}'
      : inner.kind === 'range' ? '={[lo, hi]}'
        : inner.kind === 'point' ? '={[x, y]}'
          : inner.kind === 'object' ? `={{ ${Object.keys(inner.shape!).join(', ')} }}`
            : inner.kind !== 'list' ? ''
              : item!.kind === 'object' ? `={[{${Object.keys(item!.shape!).join(', ')}}]}`
                : item!.kind === 'list' ? '={[[...]]}'
                  : item!.kind === 'point' ? '={[[x, y], ...]}' : '={[...]}';
  return `${name}${form}`;
}

/** Every prop the model writes, across an element's variants, in declaration order; sampled and refused props are the host's. */
export function promptFields(definition: AnyDefinition): [string, Field][] {
  const all = [definition.fields ?? {}, ...Object.values(definition.variants ?? {}).map((variant) => variant.fields)];
  const fields = new Map<string, Field>();
  for (const set of all) for (const [name, field] of Object.entries(set)) if (!fields.has(name) && !['unused', 'sampled'].includes((field.kind === 'optional' ? field.of! : field).kind)) fields.set(name, field);
  return [...fields];
}

/** An element's signature: written by the definition, or made from its fields. */
export function signatureOf(definition: AnyDefinition): string {
  if (definition.signature) return definition.signature;
  const props = promptFields(definition).map(([name, field]) => propForm(name, field));
  return `<${[definition.name, ...props].join(' ')}${definition.children ? '>' : ' />'}`;
}

/** One line per element: its signature, what it is, its props' notes, and how to use it. */
function elementLines(): string {
  return COMPONENTS.map((definition) => {
    const notes = promptFields(definition as AnyDefinition).flatMap(([, field]) => (field.note ? [field.note] : []));
    return `- \`${signatureOf(definition)}\`: ${[definition.summary, ...notes, ...(definition.guidance ?? [])].join(' ')}`;
  }).join('\n');
}

/** The figure contract the system prompt carries: what a figure program may write, and the rules the host checks. */
export const FIGURE_PROMPT = `Write the figure in a \`\`\`figure fence.

### The program

\`\`\`figure
export const params = { n: { label: 'Terms', min: 1, max: 8, step: 1, value: 3 } };   // optional

export default function ({ n }) {
  const steps = [];                 // one plain value per step, built with ordinary code
  // ...
  return <Figure steps={steps} caption={step => step.text} render={step => (/* the tree for this step */)} />;
}
\`\`\`

- The default export is a function of the parameters (an object; \`{}\` when there are none). It returns \`<Figure>\` or, for a static drawing, one element tree (drawn as a single step without playback).
- \`<Figure steps caption heading? render title? legend?>\`: \`steps\` is a non-empty array of plain values, one per step. \`render(step, i)\` returns the tree for that step. \`caption(step, i)\` returns the step's caption: Markdown with \`$...$\` maths, required when there are two or more steps. \`heading(step, i)\` optionally names the step in a few words, shown bold over its caption. \`title\` is optional text over the figure.
- Ordinary JavaScript: loops, local functions, arrays, \`Math\`, template strings. No imports, no DOM, no network, no React. The elements below exist already; nothing else does. The data the figure shows is written into the program as literals, and every number shown is computed by the program from them.
- Name the step parameter \`step\` (not \`f\`, which models then reuse for a curve function). Do not declare a variable with an element's name.
- Group several elements without a box, in a \`.map\` callback or a \`Plot\` or \`Diagram\`, with a fragment: \`<>...</>\`.
- Return the same structure in every step and change text, groups and states. Give an \`id\` to anything an arrow or pointer points at, anything named in \`groups\` or \`states\`, and anything that should keep its place between steps.
- Any string prop is Markdown and may hold \`$maths$\`. Numbers are printed with up to six significant digits, so \`0.1 + 0.2\` reads \`0.3\`; format money yourself.
- An error stops the figure: check every array you index, and that a function you call exists in the step it is called in.

### Elements

Every element but a link takes an optional \`id\`. \`title\`, \`label\`, cells and other text props are Markdown and may hold \`$maths$\`.

Layout and objects go anywhere outside a drawing. \`Arrow\` and \`Pointer\` are links: placed anywhere outside a drawing and attached by id. \`Plot\` and \`Diagram\` are two drawings, each holding layers in its own coordinates. A drawing holds only its layers, never a \`Row\`, \`Column\`, \`Panel\`, \`Text\`, \`Table\` or \`Node\`; put those beside the drawing, both in a \`Row\` or \`Column\`. \`Shape\`, \`Circle\`, \`Vector\`, \`Segment\`, \`Points\` and \`Label\` are layers of both, and in a 3D Plot they take \`[x, y, z]\`. \`Fn\` and \`Region\` are a \`Plot\`'s only, \`Region\` in 2D only. \`Angle\`, \`RightAngle\`, \`Tick\` and \`Dimension\` are a \`Diagram\`'s only: geometry marks placed and sized by the host.

${elementLines()}

Construction functions, in scope like \`Math\`, so points are computed rather than guessed: \`intersect(lineA, lineB)\` (a line is \`[p, q]\`; returns the point or \`null\` when parallel), \`foot(p, line)\` (the foot of the perpendicular), \`rotate(p, about, degrees)\` (counter-clockwise), \`along(a, b, t)\` (the point a + t·(b − a)), \`circleThrough(a, b, c)\` (returns \`{at, r}\`) and \`dist(a, b)\`. They are plain JavaScript defined before the program and are not elements.

Parameters the student can change, declared by \`export const params\`, one entry per control, read as the argument of the default export:

- A slider: \`{ label, min, max, step, value, unit? }\`.
- A choice: \`{ label, options: [...], value }\`.
- A text field: \`{ label, value, text: true }\`.

The host draws the controls above the figure and runs the program again with the new values, keeping the current step when the step count is unchanged.

Cards: \`Node\`s in the same \`Row\` take the height of the tallest, and a Row of Nodes directly under a drawing in a \`Column\` starts at that drawing's left edge, so stat cards line up with what they describe. Beside a Diagram, put its cards in a \`Column\` to its right, both in a \`Row\`: the pane is narrow, and the Row puts them under the drawing only when they do not fit.

Do not draw electrical circuits or logic gates; say a figure cannot show them and describe them in prose.

### Groups and states

A group says what kind of thing an object is, and you name it. A state says where it stands, and the host names it. An element can take both.

- \`group="pivot"\`, or \`groups={{ id: 'pivot' }}\` on \`Graph\`, \`Seq\` and \`Table\`: the name is what the key under the figure shows, at most ${LIMITS.groupName} characters and at most ${LIMITS.groups} names in a figure. Every element with one name shares a colour. Use a group for real categories; for "look here", use a state.
- \`state="active"\`, or \`states={{ id: 'active' }}\`: \`active\` being worked on now (thick, bold), \`done\` finished (dashed, or a hollow dot), \`dim\` out of play (faded). A state keeps an element's colour. The key explains each one used.
- A \`Plot\` line or area's \`label\` is its name, so it needs no group.
- \`legend={{ wrong: 'red' }}\` on \`<Figure>\` is optional and pins a name to a colour, when the colour carries meaning or a formula must match it; each colour holds one name. The host picks every other colour.

Never rely on red against green alone: pair them with a state, a label or a shape.

### TeX in figures

Write ordinary MathJax wherever TeX appears: \`Tex\`, captions, \`Text\`, and \`$...$\` in any label or cell.

Backslashes: in a quoted JSX attribute, write TeX as it is: \`label="$A \\cap B$"\`. Everywhere else (a string or template in JavaScript, a prop in \`{...}\`, a caption function) write it with \`String.raw\`: \`\` caption={step => String.raw\`$\\frac{\${step.a}}{2}$\`} \`\`. A plain \`'$\\cap$'\` loses the backslash and shows "cap"; \`"\\\\cap"\` in an attribute keeps both, which TeX reads as a line break.

Two things are the host's:

- Colour. In \`\\rowcolor{c}\`, \`\\cellcolor{c}\`, \`\\colorbox{c}{...}\`, \`\\bbox[c]{...}\` and \`\\color{c}{...}\`, the colour \`c\` is one of ${COLORS.map((color) => `\`${color}\``).join(', ')}. It is a highlight, so it needs no group and no key. The host replaces it with the current theme's colour and redraws on a theme change. Any other colour (\`teal\`, \`#d0453a\`, \`rgb(...)\`) and \`\\definecolor\` fail validation with the allowed names listed.
- Anchors. \`\\cssId{name}{...}\` marks a part of a formula as an anchor: \`name\` joins the step's ids, follows the id rules, and an \`Arrow\` or \`Pointer\` can target it. \`\\class\` and \`\\data\` are the host's and fail validation.

Everything else in MathJax stays allowed, including \`\\cancel\`, \`\\underbrace\`, \`\\overbrace\` and \`array\` with a \`|\` for an augmented matrix. A row reduction step:

\`\`\`tex
\\left[\\begin{array}{ccc|c}
2 & 1 & -1 & 5 \\\\
\\rowcolor{yellow} \\cssId{r2}{0} & 3 & 2 & 4 \\\\
-2 & 8 & 5 & 9
\\end{array}\\right]
\`\`\`

with \`<Pointer to="r2" name="R2 − 2R1" />\` beside it.

### Rules the host checks

- Every id in one step is unique across elements, rows, items, nodes, edges and TeX anchors; prefix ids when two objects show the same thing (\`row-B\`, \`node-B\`).
- Every \`Arrow\`, \`Pointer\` and \`groups\` or \`states\` key names an id that exists in that step. Graph edges join known nodes. A \`Region\` names an \`Fn\` of its own Plot.
- Layers go only inside \`Plot\` or \`Diagram\`, as listed. \`Figure\` is returned once, outermost.
- An id is 1 to 64 characters matching \`[A-Za-z0-9][A-Za-z0-9_.:-]*\`.

### Example, to copy the form of and not its topic

\`\`\`figure
const shelf = [2, 5, 9, 12];   // books on a shelf
const returns = [7, 1, 10];    // returned books to place

export default function () {
  const steps = [{ shelf: [...shelf], text: 'The shelf before any returns.' }];
  let cur = [...shelf];
  for (const book of returns) {
    const at = cur.findIndex(b => b > book);
    const pos = at < 0 ? cur.length : at;
    cur = [...cur.slice(0, pos), book, ...cur.slice(pos)];
    steps.push({ shelf: [...cur], placed: book, pos, text: \`Book **\${book}** goes at position \${pos}, before the first larger number.\` });
  }
  return (
    <Figure steps={steps} caption={step => step.text} render={(step, i) => (
      <Row gap="lg" align="center">
        <Seq id="shelf" title="Shelf" index items={step.shelf.map(b => ({ id: \`b\${b}\`, label: b }))}
          states={step.placed === undefined ? {} : { [\`b\${step.placed}\`]: 'active' }} />
        {step.placed !== undefined && <Pointer to={\`b\${step.placed}\`} name="placed" />}
        <Panel title="Returned">
          <Text>{\`\${i} of \${returns.length} placed\`}</Text>
        </Panel>
      </Row>
    )} />
  );
}
\`\`\``;
