I’ll show the motion and both energy curves across a full cycle, using a simple normalized spring so the curves are easy to compare.

A spring’s motion repeats: the mass is slowest at either end and fastest as it passes the centre. Its energy shifts between spring potential energy and kinetic energy; their sum stays constant if there’s no friction.

For mass $m$, spring stiffness $k$, and amplitude $A$, the angular frequency and period are:

$$
\omega = \sqrt{\frac{k}{m}}
$$

$$
T = \frac{2\pi}{\omega}
$$

Taking the centre as $x=0$, the position and velocity are:

$$
x(t) = A\cos(\omega t)
$$

$$
v(t) = -A\omega\sin(\omega t)
$$

The kinetic energy $K$ and spring potential energy $U$ are:

$$
K(t) = \frac{1}{2}mv(t)^2
$$

$$
U(t) = \frac{1}{2}kx(t)^2
$$

For the curves below, take $m=k=A=1$ in SI units, so $\omega=1$ and $T=2\pi$. At one quarter period, $t=T/4=\pi/2$: the mass passes the centre, so $x=0$, $v=-1$, $U=0$, and $K=1/2$ joule. At the endpoints, it momentarily stops and all the energy is potential.

```figure
export default function () {
  return (
    <Column gap="md">
      <Plot x={[0, 2 * Math.PI]} y={[-1, 1]} xLabel="Time $t$ (s)" yLabel="Position $x$ (m)">
        <Fn f={t => Math.cos(t)} from={0} to={2 * Math.PI} label="$x(t)$" />
      </Plot>
      <Plot x={[0, 2 * Math.PI]} y={[-1, 1]} xLabel="Time $t$ (s)" yLabel="Velocity $v$ (m/s)">
        <Fn f={t => -Math.sin(t)} from={0} to={2 * Math.PI} label="$v(t)$" />
      </Plot>
      <Plot x={[0, 2 * Math.PI]} y={[0, 0.5]} xLabel="Time $t$ (s)" yLabel="Energy (J)">
        <Fn f={t => 0.5 * Math.sin(t) ** 2} from={0} to={2 * Math.PI} label="$K(t)$" />
        <Fn f={t => 0.5 * Math.cos(t) ** 2} from={0} to={2 * Math.PI} label="$U(t)$" />
      </Plot>
    </Column>
  );
}
```

