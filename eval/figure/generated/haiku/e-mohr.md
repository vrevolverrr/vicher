Mohr's circle: center $C = (30, 0)$ MPa, radius $R = 58.3$ MPa.

```figure
const sx = 80, sy = -20, t = 30;
const c = (sx + sy) / 2;
const R = Math.sqrt(((sx - sy) / 2) ** 2 + t ** 2);
const s1 = c + R, s2 = c - R;
const X = [sx, t], Y = [sy, -t], C = [c, 0];

const steps = [
  { n: 1, text: String.raw`Plot $X = (80, 30)$ on the $x$ face and $Y = (-20, -30)$ on the $y$ face. The line $XY$ is a diameter.` },
  { n: 2, text: String.raw`The circle has diameter $XY$. Center $C = (${c}, 0)$, radius $R = ${R.toFixed(1)}$ MPa.` },
  { n: 3, text: String.raw`The circle crosses the $\sigma$ axis at $\sigma_1 = ${s1.toFixed(1)}$ MPa and $\sigma_2 = ${s2.toFixed(1)}$ MPa.` },
  { n: 4, text: String.raw`The top and bottom points give $\tau_{max} = \pm${R.toFixed(1)}$ MPa, both at $\sigma = ${c}$ MPa.` },
];

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Plot id="mohr" x={[-40, 100]} y={[-70, 70]} xLabel="$\sigma$ (MPa)" yLabel="$\tau$ (MPa)">
        {step.n >= 1 && <Segment id="xy" from={X} to={Y} />}
        {step.n >= 1 && <Points id="pts-xy" pts={[X, Y]} />}
        {step.n >= 1 && <Label id="lbl-X" at={X} text="$X$" />}
        {step.n >= 1 && <Label id="lbl-Y" at={Y} text="$Y$" />}
        {step.n >= 2 && <Circle id="circ" at={C} r={R} />}
        {step.n >= 2 && <Points id="pt-C" pts={[C]} />}
        {step.n >= 2 && <Label id="lbl-C" at={C} text="$C$" />}
        {step.n >= 3 && <Points id="pts-sig" pts={[[s1, 0], [s2, 0]]} />}
        {step.n >= 3 && <Label id="lbl-s1" at={[s1, 0]} text="$\sigma_1$" />}
        {step.n >= 3 && <Label id="lbl-s2" at={[s2, 0]} text="$\sigma_2$" />}
        {step.n >= 4 && <Points id="pts-tau" pts={[[c, R], [c, -R]]} />}
        {step.n >= 4 && <Label id="lbl-tau" at={[c, R]} text="$\tau_{max}$" />}
      </Plot>
    )} />
  );
}
```

Working:

$$C = \frac{\sigma_x + \sigma_y}{2} = \frac{80 + (-20)}{2} = 30 \text{ MPa}$$

$$R = \sqrt{\left(\frac{\sigma_x - \sigma_y}{2}\right)^2 + \tau_{xy}^2} = \sqrt{50^2 + 30^2} = \sqrt{3400} = 58.3 \text{ MPa}$$

| Quantity | Value | Plane angle from x-axis (CCW positive) |
|---|---|---|
| $\sigma_1$ | 88.3 MPa | $\theta_p = 15.5^\circ$ |
| $\sigma_2$ | -28.3 MPa | $105.5^\circ$ |
| $\tau_{max}$ | 58.3 MPa | $\theta_s = -29.5^\circ$, normal stress 30 MPa |
| $\tau_{min}$ | -58.3 MPa | $60.5^\circ$, normal stress 30 MPa |

Check: $\sigma_1 + \sigma_2 = 60 = \sigma_x + \sigma_y$.

Not checked: a textbook that plots shear downward mirrors the figure vertically. The values stay the same.