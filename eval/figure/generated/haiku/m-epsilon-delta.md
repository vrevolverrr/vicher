Move the ε slider. The curve stays inside the box when x is within δ of 1, with δ = ε/2.

```figure
export const params = {
  eps: { label: 'ε', min: 0.05, max: 2, step: 0.05, value: 0.5 }
};

export default function ({ eps }) {
  const d = eps / 2;
  return (
    <Column gap="md">
      <Plot id="plot" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
        <Fn id="f" f={x => 2 * x + 1} from={0} to={2} label="f(x) = 2x + 1" />
        <Region id="box" top={3 + eps} base={3 - eps} from={1 - d} to={1 + d} label="ε-δ box" />
        <Segment id="L" from={[0, 3]} to={[2, 3]} label="L = 3" state="dim" />
        <Points id="pt" pts={[[1, 3]]} label="(1, 3)" />
      </Plot>
      <Text>{String.raw`$\varepsilon = ${eps.toFixed(2)}$, $\delta = \varepsilon/2 = ${d.toFixed(3)}$`}</Text>
    </Column>
  );
}
```

**The definition.** $\lim_{x \to 1} f(x) = 3$ means: for every output tolerance ε > 0, some input tolerance δ > 0 exists, such that every x with $0 < |x-1| < \delta$ gives $|f(x)-3| < \varepsilon$.

$$\forall\,\varepsilon>0\;\exists\,\delta>0:\;0<|x-1|<\delta \Rightarrow |f(x)-3|<\varepsilon$$

Inside the box, the graph enters through the left side and leaves through the right side. It never crosses the top or bottom.

**Worked example, ε = 0.5.** The gap is $|f(x)-3| = |2x+1-3| = 2|x-1|$. This is below 0.5 when $|x-1| < 0.25$, so δ = 0.25 works.
- Check x = 1.2: f = 3.4, and $|3.4-3| = 0.4 < 0.5$. Passes.
- Check x = 1.3: f = 3.6, and $|3.6-3| = 0.6 > 0.5$. Fails, because 1.3 is outside δ = 0.25.

The rule $\delta = \varepsilon/2$ works for every ε, so the limit is 3.

Not checked: I did not render the figure in the app. If the Region label or the Text fails to draw, tell me the error.