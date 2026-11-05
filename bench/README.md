# Benchmarks

Measurement scripts for Vicher, never bundled into the plugin. Runs that call a model use your own installed agent CLI and login, so your own subscription pays. Each bench is `npm run bench:<name>`, and `--only=<text>` runs just the fixtures or configs whose id or name contains the text.

## Figure bench (`figure/`)

Stress-tests how the renderer draws figures. It plays hand-written stress fixtures, the demo figures and the replies the figure eval saves in `eval/figure/generated/`.

It builds the plugin into a throwaway vault, opens it in a second Obsidian window through the Obsidian CLI, and plays each fixture through the chat. At each pane width and theme it measures every sampled step and both ends of every slider. It checks for overlapping, clipped and overflowing text, tiny text, low contrast, `NaN` in SVG, error cards and height jumps between steps. 3D `Plot`s are also checked from their geometry without a window (paint order, ticks, overlays), and for frame times while turning, at full speed and on a CPU slowed 4×.

```bash
npm run bench:figures -- [--source=stress,demo,generated] [--only=text] [--widths=320,480,720] [--themes=light,dark] [--update] [--keep]
```

Obsidian must be running with its command line interface on (Settings → General → Command line interface). The bench window takes focus while it runs. Results go to promptfoo (`npx promptfoo view`: a row per fixture, a column per theme and width, a metric per check) and to `out/<time>/`: `contact.html` shows each fixture's shots side by side, and `report.json` has every measured state.

| Path | Contents |
| --- | --- |
| `fixtures/stress/*.jsx` | Hand-written figure programs at the edges of the contract, one per file |
| `golden/<source>/*.json` | Text geometry of every state that passed, rounded to 2 px; a later run reports what moved. `--update` rewrites them |
| `checks.ts`, `scene3Checks.ts` | Layout checks in the window, and 3D geometry checks without one |
| `runProgram.ts` | Runs a figure program outside the window, for the 3D geometry checks and the figure eval |
| `page.ts` | Runs inside the bench window: plays a fixture, measures it, turns its 3D plots |
| `benchVault.ts`, `obsidianCli.ts` | The throwaway vault and the Obsidian CLI calls |

The demo fixtures are the figures of Vicher's scripted demos (`src/chat/obsidian/playVisualsDemo.ts`, `playLayoutDemo.ts`).

Figure programs are model-written code. Outside the window each runs in its own Node process with no environment variables and Node's permission model on (`--permission`): it cannot read or write files or start processes, but Node 22 does not restrict the network. Inside the window they run in Vicher's own sandboxed worker, as in the plugin. Review changes to `fixtures/` as you would review code.

## Latency bench (`latency/`)

Drives the Claude Code CLI through the Agent SDK in several configurations and records spawn time, time to first token, time to the first page action, turn time, tokens and cost. It measures the live-tutor prototype, which acts on a page through tools (`highlight`, `annotate`, `draw_svg`, `scroll_to`, `say`).

```bash
npm run bench:latency -- [--smoke] [--only=text] [--out=<file>]
node bench/latency/summarize.mjs bench/latency/results/results-full.json
node bench/latency/replay.mjs bench/latency/results/results-full.json <config> > replay.html
```

Results go to `latency/results/`, which is not committed.
