A **standing wave** is a pattern that stays in place while the string moves. On a string fixed at both ends, the ends must stay still, so they are nodes. Each harmonic fits a whole number of half-wavelengths along the string:

$$L = \frac{n\lambda_n}{2}$$

Here $L$ is the string length, $n$ is the harmonic number, and $\lambda_n$ is its wavelength. If the wave speed is $v$, the harmonic frequencies are $f_n = nv/(2L)$. For a $1.2$ m string with wave speed $120$ m/s, the fundamental frequency is $120/(2 \cdot 1.2) = 50$ Hz, so the second and third harmonics are $100$ Hz and $150$ Hz.

```figure
export default function () {
  const steps = [1, 2, 3, 4].map(n => ({
    n,
    wave: Array.from({ length: 49 }, (_, i) => {
      const x = 12 * i / 48;
      const y = 2.2 + 1.25 * Math.sin(n * Math.PI * i / 48);
      return [x, y];
    }),
    nodes: Array.from({ length: n + 1 }, (_, i) => [12 * i / n, 2.2]),
    caption: `Harmonic ${n}: ${n} half-wavelength${n === 1 ? '' : 's'} fit between the fixed ends.`
  }));

  return (
    <Figure
      steps={steps}
      caption={step => step.caption}
      title="String fixed at both ends"
      render={step => (
        <Diagram width={12} height={4.5}>
          <Shape id="string" pts={[[0, 2.2], [12, 2.2]]} />
          <Shape id="wave" pts={step.wave} />
          <Points id="nodes" pts={step.nodes} label="Nodes" />
          <Label id="left-end" at={[0, 2.2]} text="Fixed" />
          <Label id="right-end" at={[12, 2.2]} text="Fixed" />
        </Diagram>
      )}
    />
  );
}
```

