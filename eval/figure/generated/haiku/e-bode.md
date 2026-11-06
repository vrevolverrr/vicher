Drag the slider to change the cutoff. The slider sets $e$ where $f_c = 10^{e}$ Hz, so each step is a fixed ratio.

```figure
export const params = {
  e: { label: 'Cutoff exponent e, fc = 10^e Hz', min: 1, max: 4.5, step: 0.05, value: 3 }
};

export default function ({ e }) {
  const fc = Math.pow(10, e);
  const mag = u => -10 * Math.log10(1 + Math.pow(10, 2 * (u - e)));
  const phase = u => -Math.atan(Math.pow(10, u - e)) * 180 / Math.PI;

  return (
    <Column gap="md">
      <Plot id="mag" x={[0, 5]} y={[-60, 5]} xLabel="log10(f / Hz)" yLabel="Gain (dB)">
        <Fn id="gain" f={mag} label="$|H|$" />
        <Segment id="fc-mag" from={[e, -60]} to={[e, 5]} state="dim" />
        <Points id="pt-mag" pts={[[e, -10 * Math.log10(2)]]} label="-3 dB" />
      </Plot>
      <Plot id="ph" x={[0, 5]} y={[-100, 5]} xLabel="log10(f / Hz)" yLabel="Phase (deg)">
        <Fn id="phi" f={phase} label="phase" />
        <Segment id="fc-ph" from={[e, -100]} to={[e, 5]} state="dim" />
        <Points id="pt-ph" pts={[[e, -45]]} label="-45°" />
      </Plot>
      <Node id="fc" label={`${Number(fc.toPrecision(3))} Hz`} sub="cutoff frequency" />
    </Column>
  );
}
```

The gain and phase of the filter, where $f$ is the input frequency in Hz and $f_c$ is the cutoff frequency in Hz:

$$|H|_{\text{dB}} = -10\log_{10}\left(1+\left(\frac{f}{f_c}\right)^2\right)$$

$$\varphi = -\arctan\left(\frac{f}{f_c}\right)$$

Well below $f_c$ the gain is 0 dB. Well above it, the gain falls 20 dB per decade. At $f = f_c$ the gain is $-3.01$ dB and the phase is $-45^\circ$.

Worked example, with $f_c = 1$ kHz and $f = 10$ kHz:

- $|H|_{\text{dB}} = -10\log_{10}(1+10^2) = -20.04$ dB
- $\varphi = -\arctan(10) = -84.3^\circ$

Not checked: how your viewer draws the figure. The horizontal axis is linear in $\log_{10} f$, because `Plot` has no log scale, so the tick labels are exponents.