For a mass attached to a spring, position and velocity repeat every period. Kinetic energy is greatest as the mass passes the centre; potential energy is greatest at either end.

For an ideal spring with amplitude $A$, mass $m$, spring constant $k$, and angular frequency $\omega=\sqrt{k/m}$:

$$
x(t)=A\cos(\omega t),\qquad
v(t)=-A\omega\sin(\omega t),\qquad
T=\frac{2\pi}{\omega}
$$

The energies are

$$
K(t)=\frac12 mv(t)^2,\qquad
U(t)=\frac12 kx(t)^2
$$

Here’s one period for $m=k=A=1$, so $\omega=1$ and $T=2\pi$. The curves show position, velocity, kinetic energy, and potential energy; the total energy stays constant at $1/2$.

```figure
export default function () {
  return (
    <Plot id="oscillation" x={[0, 6.283185307179586]} y={[-1, 1]}
      xLabel="Time $t$" yLabel="Value">
      <Fn id="position" f={t => Math.cos(t)} label="Position $x(t)$" />
      <Fn id="velocity" f={t => -Math.sin(t)} label="Velocity $v(t)$" />
      <Fn id="kinetic" f={t => 0.5 * Math.sin(t) ** 2} label="Kinetic energy $K(t)$" />
      <Fn id="potential" f={t => 0.5 * Math.cos(t) ** 2} label="Potential energy $U(t)$" />
    </Plot>
  );
}
```

The energy curves use the same vertical scale as position and velocity, so their peaks are half as high.

