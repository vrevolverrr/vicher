I’ll show the function’s line, the ε-wide band around its limit, and the matching δ-wide interval around x = 1. The slider will change ε and set δ to ε/2.

For this line, changing $x$ by $\delta$ changes $f(x)$ by $2\delta$. So to keep $f(x)$ within $\varepsilon$ of $3$, choose $\delta=\varepsilon/2$.

Formally, for every $\varepsilon>0$, choosing $\delta=\varepsilon/2$ ensures that $0<|x-1|<\delta$ implies $|f(x)-3|<\varepsilon$.

Move the slider to see the $\varepsilon$ band and its matching $\delta$ interval.

```figure
export const params = {
  epsilon: { label: 'Epsilon', min: 0.2, max: 2, step: 0.1, value: 1 }
};

export default function ({ epsilon }) {
  const delta = epsilon / 2;
  return (
    <Plot id="limit" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
      <Shape
        id="epsilon-band"
        pts={[[0, 3 - epsilon], [2, 3 - epsilon], [2, 3 + epsilon], [0, 3 + epsilon]]}
        closed
        group="epsilon band"
      />
      <Shape
        id="delta-interval"
        pts={[[1 - delta, 0], [1 + delta, 0], [1 + delta, 6], [1 - delta, 6]]}
        closed
        group="delta interval"
      />
      <Fn id="function" f={x => 2 * x + 1} from={0} to={2} label="$f(x)=2x+1$" />
      <Points
        id="boundaries"
        pts={[[1 - delta, 3 - epsilon], [1 + delta, 3 + epsilon]]}
        label="band edges"
      />
      <Points id="limit-point" pts={[[1, 3]]} label="$(1,3)$" />
    </Plot>
  );
}
```

At the default $\varepsilon=1$, the interval is $\delta=0.5$: if $x$ is within $0.5$ of $1$, then $f(x)$ is within $1$ of $3$. The strict inequalities exclude the band edges.

