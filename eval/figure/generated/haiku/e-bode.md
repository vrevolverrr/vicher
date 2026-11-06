A first-order low-pass filter passes low frequencies and attenuates high ones. Its cutoff $\omega_c$ is where the gain falls 3 dB. Move the slider to change $\omega_c$.

```figure
export const params = {
  lc: { label: 'Cutoff exponent x, ωc = 10^x rad/s', min: 0, max: 3, step: 0.05, value: 2 }
};

export default function ({ lc }) {
  const u = lc;                        // log10 of the cutoff
  const wc = Math.pow(10, lc);         // cutoff in rad/s
  const xe = Math.min(4, u + 2);       // end of the -20 dB/decade asymptote
  const gain = x => -10 * Math.log10(1 + Math.pow(10, 2 * (x - u)));
  const phase = x => -Math.atan(Math.pow(10, x - u)) * 180 / Math.PI;
  return (
    <Figure
      steps={[{ wc }]}
      caption={step => String.raw`Cutoff $\omega_c = ${step.wc.toPrecision(3)}$ rad/s. At $\omega_c$ the gain is $-3$ dB and the phase is $-45^\circ$.`}
      render={() => (
        <Column gap="md">
          <Plot id="mag" x={[-1, 4]} y={[-40, 5]} xLabel="$\log_{10}\omega$" yLabel="Gain (dB)">
            <Fn id="gain" f={gain} label="gain" />
            <Shape id="asym" pts={[[-1, 0], [u, 0], [xe, -20 * (xe - u)]]} state="dim" />
            <Segment id="cm" from={[u, -40]} to={[u, 5]} state="dim" />
            <Points id="cp" pts={[[u, -3.01]]} />
            <Label id="cl" at={[u + 0.1, -8]} text="$\omega_c$" />
          </Plot>
          <Plot id="ph" x={[-1, 4]} y={[-100, 5]} xLabel="$\log_{10}\omega$" yLabel="Phase (deg)">
            <Fn id="pha" f={phase} label="phase" />
            <Shape id="pasym" pts={[[-1, 0], [u - 1, 0], [u + 1, -90], [4, -90]]} state="dim" />
            <Segment id="pm" from={[u, -100]} to={[u, 5]} state="dim" />
            <Points id="pp" pts={[[u, -45]]} />
          </Plot>
        </Column>
      )}
    />
  );
}
```

With $\omega$ in rad/s, the filter law is:

$$H(j\omega)=\frac{1}{1+j\omega/\omega_c}$$

Gain in dB and phase follow from it:

$$|H|_{\text{dB}}=-10\log_{10}\!\left(1+\frac{\omega^2}{\omega_c^2}\right)\qquad \angle H=-\arctan\frac{\omega}{\omega_c}$$

Example with $\omega_c = 100$ rad/s:

- At $\omega = 100$: $|H|_{\text{dB}} = -10\log_{10}2 \approx -3.01$ dB, and $\angle H = -\arctan 1 = -45^\circ$.
- At $\omega = 1000$: $|H|_{\text{dB}} = -10\log_{10}101 \approx -20.04$ dB, and $\angle H = -\arctan 10 \approx -84.3^\circ$. Above the cutoff, the gain falls 20 dB per decade.

The law holds only for a first-order filter with no load.

Skipped: the `Plot` axes are linear, so the frequency axis is $\log_{10}\omega$, not a log scale. Not checked: the rendered output in the app, including how the asymptote lines clip at the box edge.