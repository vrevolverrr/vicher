A first-order low-pass filter passes low frequencies and reduces high frequencies. Its Bode plot shows gain and phase versus frequency; the slider moves the cutoff frequency $f_c$, where the gain is about $-3$ dB and the phase is $-45^\circ$.

$$
|H(f)|_{\mathrm{dB}}=-10\log_{10}\left(1+\left(\frac{f}{f_c}\right)^2\right)
$$

$$
\phi(f)=-\tan^{-1}\left(\frac{f}{f_c}\right)\frac{180^\circ}{\pi}
$$

Here $f$ is frequency and $f_c$ is the cutoff frequency. The horizontal coordinate below is $\log_{10}(f/\mathrm{Hz})$, so equal distances represent equal frequency ratios.

```figure
export const params = {
  fcHz: { label: 'Cutoff frequency (Hz)', min: 1, max: 10000, step: 1, value: 100 }
};

export default function ({ fcHz }) {
  const xCutoff = Math.log10(fcHz);
  const steps = [fcHz];

  return (
    <Figure steps={steps}
      caption={step => `Cutoff frequency: **${step} Hz**`}
      render={step => {
        const cutoff = Math.log10(step);
        return (
          <Row gap="md">
            <Plot id="magnitude" x={[-2, 5]} y={[-60, 5]}
              xLabel="$\log_{10}(f/\mathrm{Hz})$" yLabel="Gain (dB)">
              <Fn id="gain" f={x => -10 * Math.log10(1 + (10 ** x / step) ** 2)}
                from={-2} to={5} label="Gain" />
              <Segment id="gainCutoff" from={[cutoff, -60]} to={[cutoff, 5]}
                label="$f_c$" />
            </Plot>
            <Plot id="phase" x={[-2, 5]} y={[-100, 5]}
              xLabel="$\log_{10}(f/\mathrm{Hz})$" yLabel="Phase (degrees)">
              <Fn id="phaseCurve"
                f={x => -Math.atan(10 ** x / step) * 180 / Math.PI}
                from={-2} to={5} label="Phase" />
              <Segment id="phaseCutoff" from={[cutoff, -100]} to={[cutoff, 5]}
                label="$f_c$" />
            </Plot>
          </Row>
        );
      }} />
  );
}
```

