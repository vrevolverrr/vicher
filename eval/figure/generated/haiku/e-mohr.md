Mohr's circle for σx = 80, σy = −20, τxy = 30 MPa:

```figure
const sx = 80, sy = -20, t = 30;
const c = (sx + sy) / 2;
const r = Math.sqrt(((sx - sy) / 2) ** 2 + t ** 2);
const s1 = c + r, s2 = c - r;

export default function () {
  return (
    <Plot id="mohr" x={[-40, 100]} y={[-70, 70]} xLabel="$\sigma$ (MPa)" yLabel="$\tau$ (MPa)" equal>
      <Circle id="circle" at={[c, 0]} r={r} />
      <Segment id="diam" from={[sx, t]} to={[sy, -t]} />
      <Points id="faces" pts={[[sx, t], [sy, -t]]} group="face points" />
      <Points id="principal" pts={[[s1, 0], [s2, 0]]} group="principal" />
      <Points id="shear" pts={[[c, r], [c, -r]]} group="max shear" />
      <Label id="lA" at={[sx, t]} text="A (80, 30)" />
      <Label id="lB" at={[sy, -t]} text="B (−20, −30)" />
      <Label id="l1" at={[s1, 0]} text="$\sigma_1 = 88.3$" />
      <Label id="l2" at={[s2, 0]} text="$\sigma_2 = -28.3$" />
      <Label id="lT" at={[c, r]} text="$\tau_{max} = 58.3$" />
      <Label id="lC" at={[c, 0]} text="C" />
    </Plot>
  );
}
```

| Quantity | Formula | Value |
|---|---|---|
| Center C | $\frac{\sigma_x+\sigma_y}{2}$ | 30 MPa |
| Radius R | $\sqrt{\left(\frac{\sigma_x-\sigma_y}{2}\right)^2+\tau_{xy}^2}$ | 58.3 MPa |
| Principal σ₁ | $C+R$ | 88.3 MPa |
| Principal σ₂ | $C-R$ | −28.3 MPa |
| Max shear τmax | $R$ | 58.3 MPa, on faces where σ = 30 MPa |
| Principal angle θp | $\tfrac12\arctan\frac{2\tau_{xy}}{\sigma_x-\sigma_y}$ | 15.5° counterclockwise |
| Max-shear angle θs | $\theta_p - 45^\circ$ | 29.5° clockwise |

Each face becomes one point: A = (σx, τxy) = (80, 30) and B = (σy, −τxy) = (−20, −30). AB is a diameter of the circle, and the centre C sits on the σ axis.

Not checked: how the figure renders in your pane. Risk: the angle signs assume the standard convention, where τxy is positive when it acts counterclockwise on the element. A text with the opposite convention flips the signs of θp and θs.