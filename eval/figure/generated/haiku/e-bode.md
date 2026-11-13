The Bode plot is below. Drag the **Cutoff frequency** slider to move $f_c$. The faded vertical line marks $f_c$.

```figure
export const params = { fc: { label: 'Cutoff frequency', min: 1, max: 5000, step: 1, value: 100, unit: 'Hz' } };

export default function ({ fc }) {
  const lc = Math.log10(fc);
  const xEnd = Math.min(4, lc + 3);
  return (
    <Column gap="lg">
      <Plot id="mag" x={[0, 4]} y={[-60, 5]} xLabel="$\log_{10} f$ (Hz)" yLabel="$|H|$ (dB)">
        <Fn id="magCurve" f={x => -10 * Math.log10(1 + Math.pow(10, 2 * (x - lc)))} label="exact" />
        <Shape id="asym" pts={[[0, 0], [lc, 0], [xEnd, -20 * (xEnd - lc)]]} label="asymptote" state="dim" />
        <Segment id="fcMag" from={[lc, -60]} to={[lc, 5]} state="dim" />
        <Points id="ptMag" pts={[[lc, -10 * Math.log10(2)]]} label="-3 dB" />
      </Plot>
      <Plot id="ph" x={[0, 4]} y={[-100, 5]} xLabel="$\log_{10} f$ (Hz)" yLabel="$\angle H$ (deg)">
        <Fn id="phCurve" f={x => -Math.atan(Math.pow(10, x - lc)) * 180 / Math.PI} label="phase" />
        <Segment id="fcPh" from={[lc, -100]} to={[lc, 5]} state="dim" />
        <Points id="ptPh" pts={[[lc, -45]]} label="-45°" />
      </Plot>
    </Column>
  );
}
```

For input frequency $f$ and cutoff $f_c$ (both in hertz):

$$|H|_{\text{dB}} = -10\log_{10}\left(1+\left(\frac{f}{f_c}\right)^2\right)$$

$$\phi = -\arctan\left(\frac{f}{f_c}\right)\cdot\frac{180}{\pi}\ \text{degrees}$$

Worked example, $f_c = 100$ Hz:

- At $f = 10$ Hz: $|H|_{\text{dB}} = -10\log_{10}(1.01) \approx -0.04$ dB, $\phi \approx -5.7^\circ$. The signal passes almost unchanged.
- At $f = f_c = 100$ Hz: $|H|_{\text{dB}} = -10\log_{10}2 \approx -3.01$ dB, $\phi = -45^\circ$. This is the $-3$ dB point.

Not checked: I did not render the figure, so confirm the slider redraws both plots. The frequency axis is fixed at 1 Hz to 10 kHz.