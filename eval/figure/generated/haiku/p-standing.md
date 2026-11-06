Only some wavelengths fit on a string fixed at both ends. Each one is a **harmonic**. A wave reflects at each end and overlaps with the waves travelling the other way. Only certain wavelengths give a standing wave, where the ends stay still (**nodes**) and the string swings in loops between them.

For a string of length $L$ and wave speed $v$:

$$\lambda_n = \frac{2L}{n}$$

$$f_n = \frac{n\,v}{2L}$$

Here $n = 1, 2, 3, \dots$ is the harmonic number, $\lambda_n$ is the wavelength in metres, and $f_n$ is the frequency in hertz.

Example: $L = 0.90$ m and $v = 60$ m/s. Find $f_1$:

$$f_1 = \frac{1 \times 60}{2 \times 0.90} = \frac{60}{1.8} = 33.3 \text{ Hz}$$

Each higher harmonic is a whole multiple of this, so $f_3 = 3f_1 = 100$ Hz and $\lambda_3 = \frac{2(0.90)}{3} = 0.60$ m.

The figure shows the first three shapes. Harmonic 1 has one loop, harmonic 2 has two, and harmonic 3 has three. The dots mark the nodes.

```figure
const L = 0.9;   // string length, m
const v = 60;    // wave speed, m/s

export default function () {
  const steps = [1, 2, 3].map(n => ({
    n,
    lam: 2 * L / n,
    f: n * v / (2 * L),
    nodes: Array.from({ length: n + 1 }, (_, k) => [k / n, 0]),
  }));
  return (
    <Figure steps={steps}
      caption={step => String.raw`**Harmonic ${step.n}**: $\lambda_{${step.n}} = ${step.lam.toFixed(2)}$ m, $f_{${step.n}} = ${step.f.toFixed(1)}$ Hz`}
      render={step => (
        <Plot id="string" x={[0, 1]} y={[-1.2, 1.2]} xLabel="x / L" yLabel="y">
          <Fn id="wave" f={x => Math.sin(step.n * Math.PI * x)} from={0} to={1} label="mode shape" />
          <Points id="nodes" pts={step.nodes} label="nodes" />
        </Plot>
      )} />
  );
}
```

The formula assumes an ideal string with small swings. Stiffness or large amplitude shifts the frequencies.