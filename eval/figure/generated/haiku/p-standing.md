A string fixed at both ends vibrates only in patterns that fit a whole number of half-wavelengths between its ends. Each pattern is a **harmonic**, numbered $n = 1, 2, 3, \dots$. Harmonic $n$ has $n$ loops. The fixed ends are **nodes**, points that never move, and each harmonic has $n-1$ more nodes between them.

```figure
export const params = { L: { label: 'Length', min: 0.3, max: 2, step: 0.05, value: 0.65, unit: 'm' } };

export default function ({ L }) {
  const steps = [1, 2, 3, 4].map(n => ({ n }));
  return (
    <Figure
      steps={steps}
      caption={step => String.raw`Harmonic $n = ${step.n}$: $\lambda_n = 2L/${step.n}$, $f_n = ${step.n} f_1$`}
      render={step => {
        const n = step.n;
        const wave = Array.from({ length: 201 }, (_, i) => {
          const x = L * i / 200;
          return [x, Math.sin(n * Math.PI * x / L)];
        });
        const nodes = Array.from({ length: n + 1 }, (_, k) => [k * L / n, 0]);
        return (
          <Plot id="string" x={[0, L]} y={[-1.3, 1.3]} xLabel="$x$ (m)" yLabel="$y$">
            <Segment id="rest" from={[0, 0]} to={[L, 0]} />
            <Shape id="wave" pts={wave} />
            <Points id="nodes" pts={nodes} />
          </Plot>
        );
      }}
    />
  );
}
```

The fixed ends must be nodes, so $L$ must hold a whole number of half-wavelengths:

$$L = \frac{n\lambda_n}{2}$$

With wave speed $v$, the frequency of harmonic $n$ is:

$$f_n = \frac{n\,v}{2L}$$

Here $L$ is the string length in metres, $\lambda_n$ is the wavelength in metres, $f_n$ is the frequency in hertz, and $v$ is the wave speed in m/s. The speed depends on the string's tension and mass per length.

Worked example: $L = 0.65$ m, $v = 260$ m/s. Find $f_3$:

$$f_3 = \frac{3 \times 260}{2 \times 0.65} = \frac{780}{1.3} = 600\ \text{Hz}$$

Check: $\lambda_3 = 2L/3 = 0.433$ m, and $f_3\lambda_3 = 600 \times 0.433 \approx 260$ m/s.

Since $f_n = n f_1$, the first four harmonics here are 200, 400, 600 and 800 Hz.

Not covered: damping, string stiffness and large motion. The formulas assume an ideal string with small amplitude.