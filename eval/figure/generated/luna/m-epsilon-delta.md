For $f(x)=2x+1$, the limit at $x=1$ is $3$. The epsilon-delta definition says that for every chosen output tolerance $\varepsilon>0$, we can choose an input tolerance $\delta>0$ so that whenever $x$ is within $\delta$ of $1$, $f(x)$ is within $\varepsilon$ of $3$:

$$
0<|x-1|<\delta \implies |f(x)-3|<\varepsilon
$$

Here, $|f(x)-3|=2|x-1|$, so choosing $\delta=\varepsilon/2$ works. For example, if $\varepsilon=0.8$, choose $\delta=0.4$: inputs within $0.4$ of $1$ map to outputs within $0.8$ of $3$. The slider changes $\varepsilon$ and updates the matching $\delta$.

```figure
export const params = {
  epsilon: { label: 'ε', min: 0.2, max: 2, step: 0.1, value: 0.8 }
};

export default function ({ epsilon }) {
  const delta = epsilon / 2;
  const xLeft = 1 - delta;
  const xRight = 1 + delta;
  const yLow = 3 - epsilon;
  const yHigh = 3 + epsilon;

  return (
    <Plot id="limit-plot" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
      <Shape pts={[[0, yLow], [2, yLow], [2, yHigh], [0, yHigh]]}
        closed label="ε band" group="epsilon band" />
      <Shape pts={[[xLeft, 0], [xRight, 0], [xRight, 6], [xLeft, 6]]}
        closed label="δ interval" group="delta interval" />
      <Fn id="line" f={x => 2 * x + 1} from={0} to={2} label="f(x)=2x+1" />
      <Shape pts={[[xLeft, 0], [xLeft, 6]]} label={`x=1−δ`} group="delta interval" />
      <Shape pts={[[xRight, 0], [xRight, 6]]} label={`x=1+δ`} group="delta interval" />
      <Shape pts={[[0, yLow], [2, yLow]]} group="epsilon band" />
      <Shape pts={[[0, yHigh], [2, yHigh]]} group="epsilon band" />
      <Points pts={[[1, 3]]} label="(1, 3)" />
    </Plot>
  );
}
```

