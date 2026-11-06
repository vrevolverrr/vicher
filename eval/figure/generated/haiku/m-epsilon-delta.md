The limit of $2x + 1$ as $x \to 1$ is $3$. The epsilon-delta definition makes "close" exact. $\varepsilon$ is how close $f(x)$ must be to $3$. $\delta$ is how close $x$ must be to $1$ to guarantee it.

**Definition.** The limit is $3$ when, for every $\varepsilon > 0$, some $\delta > 0$ exists such that

$$0 < |x - 1| < \delta \implies |f(x) - 3| < \varepsilon$$

Here $\varepsilon$ is the allowed error in the output. $\delta$ is the allowed distance in the input that keeps the error inside $\varepsilon$.

**Worked example.** Take $\varepsilon = 0.4$. Then $|f(x) - 3| = |2x - 2| = 2|x - 1|$. We need $2|x - 1| < 0.4$, so $|x - 1| < 0.2$. Pick $\delta = 0.2$.

- Check $x = 1.15$: $f(1.15) = 3.3$, and $|3.3 - 3| = 0.3 < 0.4$. It works.
- Check $x = 1.2$: it sits on the edge of $\delta$, so it is excluded. The inequality is strict.

For any $\varepsilon$, $\delta = \varepsilon/2$ works, because $2|x - 1| < 2\delta = \varepsilon$.

Drag the slider. The shaded box is $2\varepsilon$ tall and $2\delta$ wide. The bold part of the curve inside the strip stays inside the horizontal band.

```figure
export const params = { eps: { label: 'ε', min: 0.05, max: 2, step: 0.05, value: 0.5 } };

export default function ({ eps }) {
  const L = 3, a = 1;
  const d = eps / 2;
  const curve = x => 2 * x + 1;
  const st = { eps, d };
  return (
    <Figure
      steps={[st]}
      caption={s => String.raw`With $\varepsilon = ${s.eps.toFixed(2)}$, choose $\delta = \varepsilon/2 = ${s.d.toFixed(3)}$. The bold part of the curve inside the box stays inside the band.`}
      render={s => (
        <Plot id="plot" x={[0, 2]} y={[1, 5]} xLabel="x" yLabel="y">
          <Region id="box" top={L + s.eps} base={L - s.eps} from={a - s.d} to={a + s.d} />
          <Fn id="curve" f={curve} label="f(x) = 2x + 1" />
          <Fn id="near" f={curve} from={a - s.d} to={a + s.d} state="active" />
          <Segment id="hi" from={[0, L + s.eps]} to={[2, L + s.eps]} label={String.raw`$3+\varepsilon$`} state="dim" />
          <Segment id="lo" from={[0, L - s.eps]} to={[2, L - s.eps]} label={String.raw`$3-\varepsilon$`} state="dim" />
          <Segment id="left" from={[a - s.d, 1]} to={[a - s.d, 5]} label={String.raw`$1-\delta$`} state="dim" />
          <Segment id="right" from={[a + s.d, 1]} to={[a + s.d, 5]} label={String.raw`$1+\delta$`} state="dim" />
          <Points id="pt" pts={[[a, L]]} label="(1, 3)" />
        </Plot>
      )}
    />
  );
}
```