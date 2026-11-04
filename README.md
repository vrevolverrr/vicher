<h1 align="center">Vicher</h1>

<p align="center"><strong>A visual-first study partner that sits beside your notes, points at the line it means, and draws what the note is missing.</strong></p>

<p align="center">
  <img src="assets/screenshot.jpg" alt="Vicher's chat beside a course note in Obsidian: the agent highlights the sentence that says why the Kaplan-Meier curve is a staircase, and draws the curve one death time at a time, with a step player under it" width="1000">
</p>

> [!WARNING]
> Vicher is a work in progress and was developed out of a personal need. Expect missing features, rough edges, and breaking changes between versions. The project is not accepting contributions at this stage.

Vicher is a desktop-only Obsidian plugin for studying university-level material. Open a note, open the chat beside it, and ask. The agent answers in the chat, highlights the sentence it means in your note, draws figures, visual walkthroughs that help illustrate a point.

Currently runs on the [Claude Code](https://code.claude.com) or [Codex](https://github.com/openai/codex) you already have installed, on your own subscription.

Figures are designed to be lightweight and beautiful, declarative enough to generalise across domains, but simple enough for smaller models like Haiku and Luna to write. However, although the renderer is almost complete, much work is still needed to steer the models to consistently remember to generate correct figures with high pedagogical value.

## 3D plots

<p align="center">
  <img src="assets/rotate-3d.gif" alt="A gradient descent path on the surface f(x, y) = x² + 3y², turning as the view rotates through a full circle" width="720">
</p>

Ask about gradient descent and the answer includes a 3D surface. Drag to rotate it. Move the learning-rate slider and the path redraws.

> The model never sends an image. It writes a short program in JSX. Vicher compiles it with [Sucrase](https://github.com/alangpierce/sucrase), runs it in a sandboxed worker, and draws the result with plain DOM, SVG and canvas, with no 3D or math library. Because Vicher draws every figure itself, it takes your theme and stays interactive. For a 3D plot the program gives Vicher a function `f = (x, y) => z`. Vicher samples it, shades it by height, draws the box and ticks, and handles the rotation. A sphere or a torus uses `f = (u, v) => [x, y, z]` with a range for `u` and `v`.

<p align="center">
  <img src="assets/surfaces.png" alt="Two shaded 3D surfaces: a torus and the damped wave sin(r)/r" width="800">
</p>

## Other figures

Vicher draws these too.

<p align="center">
  <img src="assets/figures.png" alt="Six figures: Dijkstra's algorithm on a graph with a table of distances and a step player; a multiple-choice question on the derivative of sin x; a sine curve and its Taylor polynomial with a slider for the number of terms; the edit-distance table for kitten and sitting with a step player; a binary search over a sorted array with lo, mid and hi pointers and a step player; Gaussian elimination on an augmented matrix with the row operation marked and a step player" width="900">
</p>

- **Plots** in 2D and 3D. Drag a slider and the plot redraws.
- **Step-by-step walkthroughs** for algorithms, derivations, anything that changes state.
- **Graphs, tables and geometry** for computer science, accounting, business and maths: a shortest path, a depreciation schedule, a break-even plot, a triangle with its angles marked.
- **Quizzes.** Pick an answer and Vicher marks it, then sends it back as your next message.
- **Maths** in TeX everywhere, and Mermaid for static diagrams.

<p align="center">
  <img src="assets/figure-incline.png" alt="A free-body diagram of a block on an incline with a slider for the angle: weight, normal force and the force down the slope drawn as arrows, with the angle and the base marked" width="520">
</p>

<details>
<summary>Code for the incline</summary>

```jsx
export const params = { angle: { label: 'Incline angle', min: 10, max: 60, step: 5, value: 30, unit: '°' } };

export default function ({ angle }) {
  const t = angle * Math.PI / 180, L = 6, m = 2, g = 9.8;
  const A = [0, 0], B = [L * Math.cos(t), 0], C = [L * Math.cos(t), L * Math.sin(t)];
  const P = along(A, C, 0.55);
  const W = m * g, N = W * Math.cos(t), F = W * Math.sin(t);
  const scale = 0.12;
  const tip = (v, k) => [P[0] + v[0] * k * scale, P[1] + v[1] * k * scale];
  return (
    <Row gap="md" align="center">
      <Diagram id="d" width={6} height={5.5}>
        <Shape pts={[A, B, C]} closed />
        <Angle at={A} from={B} to={C} label={'$' + angle + '^\\circ$'} />
        <RightAngle at={B} from={A} to={C} />
        <Vector from={P} to={tip([0, -1], W)} label="$mg$" />
        <Vector from={P} to={tip([-Math.sin(t), Math.cos(t)], N)} label="$N$" tag="good" />
        <Vector from={P} to={tip([-Math.cos(t), -Math.sin(t)], F)} label="$mg\sin\theta$" tag="active" />
        <Dimension from={A} to={B} label={(L * Math.cos(t)).toFixed(2) + ' m'} />
      </Diagram>
      <Column gap="sm">
        <Node id="n" label={N.toFixed(1) + ' N'} sub="normal force" />
        <Node id="f" label={F.toFixed(1) + ' N'} sub="force down the slope" tag="active" />
      </Column>
    </Row>
  );
}
```

The program places the triangle, the angle mark and the arrows from the angle, and works out the forces. Move the slider and Vicher runs it again.

</details>

## Why JSX

A figure is a tree, and JSX nests the way the figure does: `<Row>`, `<Plot>` and `<Fn>` sit next to the plain JavaScript that computes what they show. Internal benchmarks showed that allowing the model to write code to compute results for the visuals helped with reducing reasoning tokens and mistakes. When the model worked out its numbers in code, 58 of the 62 programs that ran were also correct on 10 unseen inputs, where a prior renderer with OpenUI's syntax had it work out every value in reasoning. The syntax itself made no measurable difference: with the same helpers, OpenUI and JSX passed within one case per model. The numbers are in [the pull request](https://github.com/vrevolverrr/vicher/pull/3).

## Beside the note

- **Highlight and scroll.** The agent can mark a passage in the open note, or in another note of your vault, and walk you through several in order.
- **Quote into the chat.** Select text in the note and send it as the thing you are asking about.
- **Attach files and images.** Paste or drop an image, or mention a file from your vault.
- **Approvals.** A tool call that needs your permission shows an approval card.

Each message sends the open note and your selection. The agent can also read the rest of your vault with its own tools just like any coding agent.

## Requirements

- Obsidian 1.13 or later, on desktop
- Claude Code 2.1.113 or later, or Codex, installed and logged in

Vicher runs your own installed CLI on your own subscription. It never collects or stores your credentials. To use your own API key instead, add it as an environment variable (for example `ANTHROPIC_API_KEY`) on the plugin's settings page. Vicher keeps it in Obsidian's secret storage and passes it only to your CLI.

## Install from source

```bash
npm install
npm run build
```

Then copy `main.js`, `manifest.json` and `styles.css` into `<your vault>/.obsidian/plugins/vicher/`, and enable Vicher under Settings → Community plugins. If you set `OBSIDIAN_VAULT=/path/to/vault` in `.env.local`, `npm run build` copies the files for you.

Open the chat with **Vicher: Open chat**. To see what figures look like without asking a model, run **Vicher: Play visuals demo**.

## Development

```bash
npm run dev        # rebuild on change
npm run typecheck
npm test
```

## Roadmap

- [x] Chat with Claude Code or Codex beside your notes
- [x] Guided walkthroughs of the open note
- [x] Figures in the chat: plots, 3D surfaces, step-by-step boards, quizzes
- [x] File and image attachments
- [x] Tool approvals
- [ ] Prompt and behaviour evals
- [ ] Figure coverage: circuit schematics, chemical structures from SMILES
- [ ] Figures inside notes
- [ ] Publish to Obsidian Plugin Marketplace.
- [ ] Highlights in PDFs
- [ ] Memory and learning dependencies
- [ ] A live tutor that follows along as you study

## License

Copyright (C) 2026 Bryan Soong

Vicher is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License, version 3, as published by the Free Software Foundation. It is distributed WITHOUT ANY WARRANTY; see `LICENSE` for the full text.

Additional permission under GNU GPL version 3 section 7: if you modify this Program, or any covered work, by linking or combining it with the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`, or a modified version of that library), containing parts covered by the terms of Anthropic's license for that library, the licensors of this Program grant you additional permission to convey the resulting work.

## Credits

Parts of Vicher are adapted from [Claudian](https://github.com/YishenTu/claudian) under the MIT License. See `THIRD_PARTY_NOTICES.md`.

Vicher's figures started on [OpenUI](https://www.openui.com) and were inspired by OpenAI's [Intelligent UI](https://openai.com/index/gpt-6-for-everyone/).
