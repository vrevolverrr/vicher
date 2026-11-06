```figure
const m = 2;                  // kg
const k = 8;                  // N/m
const A = 0.5;                // m, released from rest at x = A
const w = Math.sqrt(k / m);   // 2 rad/s
const T = 2 * Math.PI / w;    // about 3.14 s

const x = t => A * Math.cos(w * t);
const v = t => -A * w * Math.sin(w * t);
const KE = t => 0.5 * m * v(t) ** 2;
const PE = t => 0.5 * k * x(t) ** 2;

export default function () {
  const steps = [];
  for (let i = 0; i <= 8; i++) {
    const t = i * T / 8;
    steps.push({ t, x: x(t), v: v(t), KE: KE(t), PE: PE(t) });
  }
  return (
    <Figure
      steps={steps}
      caption={s => `At $t = ${s.t.toFixed(2)}$ s: $x = ${s.x.toFixed(2)}$ m, $v = ${s.v.toFixed(2)}$ m/s, KE = ${s.KE.toFixed(2)} J, PE = ${s.PE.toFixed(2)} J. $KE + PE = 1$ J.`}
      render={s => (
        <Plot id="plot" x={[0, T]} y={[-1.2, 1.2]} xLabel="t (s)" yLabel="value">
          <Fn id="fx" f={x} label="x (m)" />
          <Fn id="fv" f={v} label="v (m/s)" />
          <Fn id="fke" f={KE} label="KE (J)" />
          <Fn id="fpe" f={PE} label="PE (J)" />
          <Points id="now" pts={[[s.t, s.x], [s.t, s.v], [s.t, s.KE], [s.t, s.PE]]} />
        </Plot>
      )}
    />
  );
}
```

A mass on a spring swings back and forth. The spring pulls the mass toward the middle, and the same motion repeats each cycle. Position, velocity and energy all rise and fall in a fixed pattern.

For a mass $m$ on a spring of stiffness $k$, the angular frequency and period are set by the two values:

$$\omega = \sqrt{\frac{k}{m}}$$

$$T = \frac{2\pi}{\omega}$$

Here $\omega$ is in rad/s, $m$ in kg, $k$ in N/m, and $T$ is the time for one full cycle in seconds. For a mass released from rest at $x = A$, with no friction:

$$x(t) = A\cos\omega t$$

$$v(t) = -A\omega\sin\omega t$$

$$KE = \tfrac{1}{2}mv^2, \qquad PE = \tfrac{1}{2}kx^2$$

Take $m = 2$ kg, $k = 8$ N/m, $A = 0.5$ m. Then $\omega = \sqrt{8/2} = 2$ rad/s and $T = 2\pi/2 \approx 3.14$ s. Substituting gives $v = -\sin 2t$ m/s, $KE = \sin^2 2t$ J and $PE = \cos^2 2t$ J.

At $t = 0$, the mass is at its furthest point: $PE = 1$ J, $KE = 0$. At $t = T/4 \approx 0.79$ s, the mass passes the middle: $KE = 1$ J, $PE = 0$. The energy moves between the two forms, and their sum stays 1 J.

The formulas assume an ideal spring: no friction, and the stretch stays within the elastic limit.

Skipped: damping and a slider for $m$, $k$ and $A$. Not checked: how the figure renders in the app.