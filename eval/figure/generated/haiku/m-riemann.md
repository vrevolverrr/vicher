```figure
export const params = { n: { label: 'Rectangles', min: 1, max: 20, step: 1, value: 4 } };

const f = x => x * x;

export default function ({ n }) {
  const dx = 2 / n;
  const rects = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = i * dx;
    rects.push({ x, h: f(x) });
    sum += f(x) * dx;
  }
  const steps = [{ rects, sum, dx }];
  return (
    <Figure
      steps={steps}
      caption={step => String.raw`Left sum with $n = ${n}$ rectangles, each of width $\Delta x = ${step.dx}$.`}
      render={step => (
        <Row gap="lg" align="center">
          <Plot id="plot" x={[0, 2.2]} y={[0, 4.6]} xLabel="$x$" yLabel="$y$">
            <Fn id="curve" f={f} from={0} to={2} label="$y = x^2$" />
            {step.rects.map((r, i) => (
              <Region id={`r${i}`} top={r.h} from={r.x} to={r.x + step.dx} />
            ))}
          </Plot>
          <Column gap="md">
            <Node id="sum" label={step.sum.toFixed(3)} sub="left sum" />
            <Node id="exact" label="2.667" sub="exact value 8/3" />
          </Column>
        </Row>
      )}
    />
  );
}
```

Drag the **Rectangles** slider (1 to 20). The left sum stays below the curve because $x^2$ rises on $[0, 2]$.