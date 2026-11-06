A Bode plot shows a filter’s gain and phase shift across frequency. For a first-order low-pass filter,

$$H(jf)=\frac{1}{1+jf/f_c}$$

Here $f$ is frequency and $f_c$ is the adjustable cutoff frequency. The plots use a logarithmic frequency axis; at cutoff, the gain is about $-3$ dB and the phase is $-45^\circ$.

```figure
export const params = {
  fc: { label: 'Cutoff frequency', min: 0.1, max: 1000, step: 0.1, value: 10, unit: 'Hz' }
};

export default function ({ fc }) {
  const steps = [{ fc }];
  return (
    <Figure
      steps={steps}
      caption={step => `Cutoff frequency: **${step.fc} Hz**`}
      render={step => {
        const cutoffX = Math.log10(step.fc);
        const ratio = x => Math.pow(10, x) / step.fc;
        const gain = x => 20 * Math.log10(1 / Math.sqrt(1 + ratio(x) ** 2));
        const phase = x => -Math.atan(ratio(x)) * 180 / Math.PI;
        return (
          <Column gap="md">
            <Row gap="md">
              <Plot id="gain-plot" x={[-2, 4]} y={[-45, 5]} xLabel="log₁₀(frequency / Hz)" yLabel="Gain (dB)">
                <Fn id="gain" f={gain} label="Gain" />
                <Segment id="gain-cutoff" from={[cutoffX, -45]} to={[cutoffX, 5]} />
                <Points id="gain-point" pts={[[cutoffX, gain(cutoffX)]]} label="fc" />
              </Plot>
              <Plot id="phase-plot" x={[-2, 4]} y={[-100, 10]} xLabel="log₁₀(frequency / Hz)" yLabel="Phase (degrees)">
                <Fn id="phase" f={phase} label="Phase" />
                <Segment id="phase-cutoff" from={[cutoffX, -100]} to={[cutoffX, 10]} />
                <Points id="phase-point" pts={[[cutoffX, phase(cutoffX)]]} label="fc" />
              </Plot>
            </Row>
          </Column>
        );
      }}
    />
  );
}
```

