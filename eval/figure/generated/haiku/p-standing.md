A **standing wave** is a wave pattern that stays in place. It forms when two identical waves travel in opposite directions and add together. On a string fixed at both ends, the ends cannot move, so each end must be a **node** (a point of zero motion). Only some wavelengths fit that rule. The **harmonics** are these allowed patterns, numbered by $n$, the number of loops.

For a string of length $L$, the allowed wavelengths are:

$$\lambda_n = \frac{2L}{n}, \qquad n = 1, 2, 3, \dots$$

Here $\lambda_n$ is the wavelength of harmonic $n$. Each harmonic has a frequency:

$$f_n = \frac{n\,v}{2L}$$

Here $v$ is the wave speed on the string. $f_1$ is the **fundamental**, and every other harmonic is a whole multiple of it.

```figure
export default function () {
  const steps = [1, 2, 3, 4].map(n => ({ n }));
  return (
    <Figure
      steps={steps}
      heading={step => `Harmonic ${step.n}`}
      caption={step => String.raw`$\lambda = \frac{2L}{${step.n}}$. Dots mark the nodes, where the string stays still.`}
      render={step => (
        <Plot id="string" x={[0, 1]} y={[-1.2, 1.2]} xLabel="x / L" yLabel="y">
          <Fn id="mode" f={x => Math.sin(step.n * Math.PI * x)} label={`n = ${step.n}`} />
          <Points pts={Array.from({ length: step.n + 1 }, (_, k) => [k / step.n, 0])} />
        </Plot>
      )}
    />
  );
}
```

**Worked example.** A string is 0.65 m long, under tension $T = 80$ N, with mass per length $\mu = 2.5$ g/m $= 2.5 \times 10^{-3}$ kg/m.

1. Wave speed: $v = \sqrt{T/\mu} = \sqrt{80 / 0.0025} \approx 178.9$ m/s.
2. Fundamental: $f_1 = \dfrac{v}{2L} = \dfrac{178.9}{1.3} \approx 138$ Hz.
3. Higher harmonics: $f_2 = 2f_1 \approx 275$ Hz and $f_3 = 3f_1 \approx 413$ Hz.

| $n$ | $\lambda_n$ (m) | $f_n$ (Hz) |
|---|---|---|
| 1 | 1.30 | 138 |
| 2 | 0.650 | 275 |
| 3 | 0.433 | 413 |

The model assumes an ideal string. A real string is stiff and damped, so its harmonics drift slightly from exact whole multiples.