The $\varepsilon$-$\delta$ definition says we can make $f(x)$ as close as we like to its limit by keeping $x$ close enough to the input value. Here, the limit is $3$:

$$
\text{For every }\varepsilon>0,\ \text{there is a }\delta>0\text{ such that }0<|x-1|<\delta\implies |f(x)-3|<\varepsilon.
$$

For $f(x)=2x+1$, we have $|f(x)-3|=2|x-1|$. So choosing $\delta=\varepsilon/2$ works. For example, if $\varepsilon=1.2$, choose $\delta=0.6$: inputs within $0.6$ of $1$ map to outputs within $1.2$ of $3$.

Adjust the slider to see the $\varepsilon$ band and the matching $\delta$ interval.

```figure
export const params = {
  epsilon: { label: 'ε', min: 0.2, max: 2, step: 0.1, value: 1.2 }
};

export default function ({ epsilon }) {
  const delta = epsilon / 2;
  return (
    <Plot id="limit-plot" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
      <Region id="epsilon-band" top={3 + epsilon} base={3 - epsilon} from={0} to={2} group="ε band" />
      <Region id="delta-window" top={6} base={0} from={1 - delta} to={1 + delta} group="δ window" />
      <Fn id="function-line" f={x => 2 * x + 1} label="$f(x)=2x+1$" />
      <Fn id="limit-line" f={x => 3} label="$L=3$" />
      <Shape id="delta-left" pts={[[1 - delta, 0], [1 - delta, 6]]} group="δ edge" />
      <Shape id="delta-right" pts={[[1 + delta, 0], [1 + delta, 6]]} group="δ edge" />
      <Points id="limit-point" pts={[[1, 3]]} label="$(1,3)$" />
    </Plot>
  );
}
```

