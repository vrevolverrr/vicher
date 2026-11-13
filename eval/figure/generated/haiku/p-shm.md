Position and velocity are a quarter period out of step. Kinetic energy (KE) and potential energy (PE) trade places twice per period, and their sum stays constant.

$$x(t) = A\cos(\omega t)$$

$$v(t) = -A\omega\sin(\omega t)$$

$$\omega = \sqrt{\frac{k}{m}}, \qquad T = \frac{2\pi}{\omega}$$

$$\text{KE} = \tfrac{1}{2}mv^2, \qquad \text{PE} = \tfrac{1}{2}kx^2, \qquad \text{KE} + \text{PE} = \tfrac{1}{2}kA^2$$

Here $A$ is the amplitude, $k$ the spring constant, and $m$ the mass. The worked example uses $m = 2$ kg, $k = 8$ N/m, $A = 0.5$ m:

- $\omega = \sqrt{8/2} = 2$ rad/s, so $T = \pi \approx 3.14$ s.
- Total energy $= \tfrac{1}{2}(8)(0.5)^2 = 1$ J.
- At $t = T/8 \approx 0.39$ s: $x = 0.5\cos(\pi/4) \approx 0.35$ m, $v \approx -0.71$ m/s, so KE $= \tfrac{1}{2}(2)(0.71)^2 = 0.5$ J and PE $= \tfrac{1}{2}(8)(0.35)^2 = 0.5$ J. Their sum is 1 J.

```figure
export const params = {
  m: { label: 'Mass', min: 0.5, max: 5, step: 0.5, value: 2, unit: 'kg' },
  k: { label: 'Spring constant', min: 2, max: 20, step: 1, value: 8, unit: 'N/m' },
  A: { label: 'Amplitude', min: 0.1, max: 1, step: 0.1, value: 0.5, unit: 'm' },
};

export default function ({ m, k, A }) {
  const w = Math.sqrt(k / m);                 // angular frequency, rad/s
  const T = 2 * Math.PI / w;                  // period, s
  const E = 0.5 * k * A * A;                  // total energy, J
  const vmax = A * w;                         // peak speed, m/s
  const pos = t => A * Math.cos(w * t);
  const vel = t => -A * w * Math.sin(w * t);
  const ke = t => 0.5 * m * vel(t) ** 2;
  const pe = t => 0.5 * k * pos(t) ** 2;

  const steps = [];
  for (let i = 0; i <= 8; i++) {
    const t = i * T / 8;
    steps.push({ t, x: pos(t), v: vel(t), KE: ke(t), PE: pe(t) });
  }

  return (
    <Figure
      steps={steps}
      caption={s => `At $t = ${s.t.toFixed(2)}$ s: $x = ${s.x.toFixed(2)}$ m, $v = ${s.v.toFixed(2)}$ m/s, KE $= ${s.KE.toFixed(2)}$ J, PE $= ${s.PE.toFixed(2)}$ J. Sum $= ${(s.KE + s.PE).toFixed(2)}$ J.`}
      render={s => (
        <Column gap="md">
          <Row gap="md">
            <Plot id="xp" x={[0, T]} y={[-1.2 * A, 1.2 * A]} xLabel="t (s)" yLabel="x (m)">
              <Fn id="xc" f={pos} label="x(t)" />
              <Points id="xn" pts={[[s.t, s.x]]} state="active" />
            </Plot>
            <Plot id="vp" x={[0, T]} y={[-1.2 * vmax, 1.2 * vmax]} xLabel="t (s)" yLabel="v (m/s)">
              <Fn id="vc" f={vel} label="v(t)" />
              <Points id="vn" pts={[[s.t, s.v]]} state="active" />
            </Plot>
          </Row>
          <Plot id="ep" x={[0, T]} y={[0, 1.2 * E]} xLabel="t (s)" yLabel="Energy (J)">
            <Fn id="kc" f={ke} label="KE" />
            <Fn id="pc" f={pe} label="PE" />
            <Fn id="ec" f={t => E} label="KE + PE" />
            <Points id="kn" pts={[[s.t, s.KE]]} state="active" />
            <Points id="pn" pts={[[s.t, s.PE]]} state="active" />
          </Plot>
        </Column>
      )}
    />
  );
}
```

Read the figure: $x$ peaks at the ends, where PE is largest and $v = 0$. $v$ peaks at $x = 0$, where KE is largest. The sliders change $m$, $k$, and $A$, and the period follows them.

Skipped: damping, and the derivation of $x(t)$ from Newton's second law. Risk: the model assumes no friction and a linear spring, so it fails past the elastic limit.