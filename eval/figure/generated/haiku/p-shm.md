Released from rest at $x = A$, the mass completes one period $T = 2\pi\sqrt{m/k}$. The figure shows $x$, $v$, $K$ and $U$ at 9 instants across one period. The sliders change $A$ and $k$.

```figure
export const params = {
  A: { label: 'Amplitude', min: 0.05, max: 0.2, step: 0.01, value: 0.1, unit: 'm' },
  k: { label: 'Stiffness', min: 5, max: 50, step: 1, value: 20, unit: 'N/m' },
};

export default function ({ A, k }) {
  const m = 0.5;                          // mass in kg, fixed
  const w = Math.sqrt(k / m);             // angular frequency in rad/s
  const T = 2 * Math.PI / w;              // period in s
  const pos = t => A * Math.cos(w * t);
  const vel = t => -A * w * Math.sin(w * t);
  const ke = t => 0.5 * m * vel(t) ** 2;
  const pe = t => 0.5 * k * pos(t) ** 2;
  const E = 0.5 * k * A * A;              // total energy in J
  const N = 8;                            // intervals per period
  const steps = [];
  for (let i = 0; i <= N; i++) {
    const t = T * i / N;
    steps.push({ t, x: pos(t), v: vel(t), ke: ke(t), pe: pe(t) });
  }
  return (
    <Figure
      steps={steps}
      caption={step => `At $t = ${step.t.toFixed(3)}$ s: $x = ${step.x.toFixed(3)}$ m, $v = ${step.v.toFixed(3)}$ m/s, $K = ${step.ke.toFixed(3)}$ J, $U = ${step.pe.toFixed(3)}$ J.`}
      render={step => (
        <Column gap="md">
          <Plot id="pos" x={[0, T]} xLabel="$t$ (s)" yLabel="$x$ (m)">
            <Fn id="pos-curve" f={pos} label="$x(t)$" />
            <Points id="pos-now" pts={[[step.t, step.x]]} />
          </Plot>
          <Plot id="vel" x={[0, T]} xLabel="$t$ (s)" yLabel="$v$ (m/s)">
            <Fn id="vel-curve" f={vel} label="$v(t)$" />
            <Points id="vel-now" pts={[[step.t, step.v]]} />
          </Plot>
          <Plot id="en" x={[0, T]} xLabel="$t$ (s)" yLabel="Energy (J)">
            <Fn id="ke-curve" f={ke} label="$K$" />
            <Fn id="pe-curve" f={pe} label="$U$" />
            <Fn id="e-curve" f={() => E} label="$E$" />
            <Points id="ke-now" pts={[[step.t, step.ke]]} />
            <Points id="pe-now" pts={[[step.t, step.pe]]} />
          </Plot>
        </Column>
      )}
    />
  );
}
```

For a mass on a spring with no damping:

$$x(t) = A\cos(\omega t)$$

$$v(t) = -A\omega\sin(\omega t)$$

$$\omega = \sqrt{\frac{k}{m}}$$

Here $A$ is the amplitude in m, $\omega$ is the angular frequency in rad/s, $k$ is the stiffness in N/m, and $m$ is the mass in kg. The energies are:

$$K = \tfrac{1}{2}mv^2$$

$$U = \tfrac{1}{2}kx^2$$

**Worked example:** $m = 0.5$ kg, $k = 20$ N/m, $A = 0.10$ m.

- $\omega = \sqrt{20/0.5} \approx 6.32$ rad/s
- $T = 2\pi/\omega \approx 0.994$ s
- $v_{max} = A\omega \approx 0.632$ m/s, at $x = 0$
- $E = \tfrac{1}{2}kA^2 = 0.1$ J

$K$ is largest where $x = 0$. $U$ is largest where $x = \pm A$, and there $v = 0$. $K + U$ stays at 0.1 J at every instant. That is conservation of energy.

Not modelled: damping and friction. Mass is fixed at 0.5 kg in the figure.