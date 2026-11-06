A **first-order low-pass filter** passes low frequencies and attenuates high frequencies. Its Bode plot shows gain and phase versus frequency, with frequency on a logarithmic scale. The cutoff frequency $f_c$ is where the gain has fallen to about $-3$ dB.

For a filter with unity gain at low frequencies:

$$
H(j2\pi f)=\frac{1}{1+jf/f_c}
$$

The magnitude and phase are:

$$
|H|_{\mathrm{dB}}=-10\log_{10}\left(1+(f/f_c)^2\right)
$$

$$
\angle H=-\tan^{-1}(f/f_c)
$$

At $f=f_c$, the gain is about $-3$ dB and the phase is $-45^\circ$. For $f_c=100$ Hz and $f=1000$ Hz, $f/f_c=10$, so the gain is about $-20$ dB and the phase is about $-84^\circ$.

Adjust the cutoff frequency below to see both curves shift.

```figure
export const params = {
  fc: { label: 'Cutoff frequency', min: 10, max: 1000, step: 10, value: 100, unit: 'Hz' }
};

export default function ({ fc }) {
  const magnitude = x => -10 * Math.log10(1 + (10 ** x / fc) ** 2);
  const phase = x => -Math.atan(10 ** x / fc) * 180 / Math.PI;

  return (
    <Column gap="md">
      <Plot id="magnitude" x={[-1, 4]} y={[-60, 5]}
        xLabel="$\log_{10}(f/\mathrm{Hz})$" yLabel="Gain (dB)">
        <Fn id="gain" f={magnitude} from={-1} to={4} label="Gain" />
        <Fn id="cutoffGain" f={x => x === Math.log10(fc) ? -3.0103 : NaN}
          from={-1} to={4} label="Cutoff" />
      </Plot>
      <Plot id="phase" x={[-1, 4]} y={[-100, 10]}
        xLabel="$\log_{10}(f/\mathrm{Hz})$" yLabel="Phase (°)">
        <Fn id="phaseCurve" f={phase} from={-1} to={4} label="Phase" />
      </Plot>
      <Text>{`Cutoff: **${fc} Hz**`}</Text>
    </Column>
  );
}
```

