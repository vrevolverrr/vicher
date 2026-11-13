Drag the **Learning rate η** slider and change **Steps** to watch the path. The update is $x_{k+1}=x_k-2\eta x_k$ and $y_{k+1}=y_k-6\eta y_k$.

```figure
export const params = {
  eta: { label: 'Learning rate η', min: 0.01, max: 0.5, step: 0.01, value: 0.1 },
  n: { label: 'Steps', min: 1, max: 15, step: 1, value: 8 }
};

const f = (x, y) => x * x + 3 * y * y;
const fmt = v => String(+v.toPrecision(3));
const ZMAX = 22;

export default function ({ eta, n }) {
  const path = [{ x: 2.5, y: 1.5 }];
  for (let k = 0; k < n; k++) {
    const p = path[k];
    path.push({ x: p.x - eta * 2 * p.x, y: p.y - eta * 6 * p.y });
  }
  const steps = path.map((p, k) => ({ k, x: p.x, y: p.y, z: f(p.x, p.y) }));

  return (
    <Figure
      steps={steps}
      caption={s => `Step ${s.k}: $(x_${s.k}, y_${s.k}) = (${fmt(s.x)}, ${fmt(s.y)})$, so $z_${s.k} = ${fmt(s.z)}$.${s.z > ZMAX ? ' This point is above the top of the box.' : ''}`}
      render={s => (
        <Column gap="md">
          <Tex id="rule" tex={String.raw`\begin{aligned} x_{k+1} &= x_k - 2\eta\,x_k \\ y_{k+1} &= y_k - 6\eta\,y_k \end{aligned}`} />
          <Row gap="lg" align="center">
            <Plot id="plot" x={[-3, 3]} y={[-2, 2]} z={[0, ZMAX]} xLabel="x" yLabel="y" zLabel="z" view={{ azimuth: 30, elevation: 25 }}>
              <Fn id="surf" f={f} label="z = x² + 3y²" />
              <Shape id="path" pts={steps.slice(0, s.k + 1).map(q => [q.x, q.y, q.z])} label="iterates" state="done" />
              <Points id="now" pts={[[s.x, s.y, s.z]]} label={`k=${s.k}`} state="active" />
            </Plot>
            <Column gap="md">
              <Node id="nx" label={fmt(s.x)} sub="x" />
              <Node id="ny" label={fmt(s.y)} sub="y" />
              <Node id="nz" label={fmt(s.z)} sub="z = f(x, y)" />
            </Column>
          </Row>
          <Text text="The $y$ term shrinks only when $0 < \eta < 1/3$. Above $1/3$, $y$ flips sign and grows, so the path diverges." />
        </Column>
      )}
    />
  );
}
```

I did not render the figure, so the layout and the 3D view are unchecked. Points that leave the z box, which happens at high η, may be clipped by the host.