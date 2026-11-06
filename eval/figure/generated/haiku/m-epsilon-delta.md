Drag the ε slider to see the rule at work. The box is the target: every x within δ of 1 (other than 1 itself) must send f(x) within ε of 3.

The formal definition:

$$\lim_{x\to 1} f(x) = 3 \iff \forall\,\varepsilon>0\ \exists\,\delta>0:\ 0<|x-1|<\delta \Rightarrow |f(x)-3|<\varepsilon$$

Find δ for a given ε:

$$|f(x)-3| = |2x-2| = 2|x-1|$$

So $2|x-1|<\varepsilon$ exactly when $|x-1|<\varepsilon/2$. Choose $\delta=\varepsilon/2$. For $\varepsilon=1$, $\delta=0.5$: any $x$ in $(0.5,\,1.5)$ gives $f(x)$ in $(2,\,4)$.

```figure
export const params = { eps: { label: 'ε', min: 0.05, max: 2, step: 0.05, value: 1 } };

export default function ({ eps }) {
  const x0 = 1, L = 3;
  const delta = eps / 2;   // 2|x-1| < eps exactly when |x-1| < eps/2
  const box = [[x0 - delta, L - eps], [x0 + delta, L - eps], [x0 + delta, L + eps], [x0 - delta, L + eps]];
  return (
    <Row gap="lg" align="center">
      <Plot id="plot" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
        <Fn id="line" f={x => 2 * x + 1} label="f(x) = 2x + 1" />
        <Shape id="box" pts={box} closed label="ε and δ box" />
        <Segment id="d" from={[x0, 0.4]} to={[x0 + delta, 0.4]} label="δ" />
        <Points id="pt" pts={[[x0, L]]} label="L = 3" state="dim" />
      </Plot>
      <Column gap="md">
        <Node id="eps" label={`ε = ${eps}`} sub="allowed error in f(x)" />
        <Node id="delta" label={`δ = ε/2 = ${delta}`} sub="allowed distance from x = 1" />
      </Column>
    </Row>
  );
}
```

Not checked: I did not render the figure, so the layout and label placement are unverified.