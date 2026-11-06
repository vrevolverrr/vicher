Mohr's circle for this stress state has center $C = (30, 0)$ MPa and radius $R = 58.3$ MPa. It plots normal stress $\sigma$ (horizontal) against shear stress $\tau$ (vertical). Each point on the circle gives the stress on one plane through the point.

```figure
export default function () {
  return (
    <Row gap="lg" align="center">
      <Plot id="mohr" x={[-40, 100]} y={[-70, 70]} xLabel="$\sigma$ (MPa)" yLabel="$\tau$ (MPa)" equal>
        <Circle id="circ" at={[30, 0]} r={58.31} />
        <Segment id="diam" from={[80, 30]} to={[-20, -30]} />
        <Points id="faces" pts={[[80, 30], [-20, -30]]} />
        <Points id="principal" pts={[[88.31, 0], [-28.31, 0], [30, 58.31], [30, -58.31]]} />
        <Label id="c" at={[30, 0]} text="C" />
        <Label id="x" at={[80, 30]} text="X (80, 30)" />
        <Label id="y" at={[-20, -30]} text="Y (-20, -30)" />
        <Label id="s1" at={[88.31, 0]} text="σ1 = 88.3" />
        <Label id="s2" at={[-28.31, 0]} text="σ2 = -28.3" />
        <Label id="tm" at={[30, 58.31]} text="τmax = 58.3" />
      </Plot>
      <Column gap="sm">
        <Node id="s1card" label="88.3 MPa" sub="σ1, max normal" />
        <Node id="s2card" label="-28.3 MPa" sub="σ2, min normal" />
        <Node id="tcard" label="58.3 MPa" sub="τmax, max shear" />
      </Column>
    </Row>
  );
}
```

The circle comes from the stress components. Point X is the x-face $(\sigma_x, \tau_{xy}) = (80, 30)$, and point Y is the y-face $(\sigma_y, -\tau_{xy}) = (-20, -30)$. The diameter XY passes through the center.

$$C = \frac{\sigma_x + \sigma_y}{2}$$

$$R = \sqrt{\left(\frac{\sigma_x - \sigma_y}{2}\right)^2 + \tau_{xy}^2}$$

- $C = \frac{80 + (-20)}{2} = 30$ MPa
- $R = \sqrt{50^2 + 30^2} = \sqrt{3400} = 58.3$ MPa
- $\sigma_1 = C + R = 88.3$ MPa, $\sigma_2 = C - R = -28.3$ MPa
- $\tau_{max} = R = 58.3$ MPa, at $\sigma = 30$ MPa
- $\tan 2\theta_p = \frac{2\tau_{xy}}{\sigma_x - \sigma_y} = \frac{60}{100} = 0.6$, so $2\theta_p = 31.0^\circ$ and $\theta_p = 15.5^\circ$ counterclockwise from the x-axis

This drawing plots positive $\tau_{xy}$ upward. Some textbooks plot it downward. The circle is the same, but X and Y swap places.