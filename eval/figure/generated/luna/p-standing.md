A **standing wave** on a string fixed at both ends has zero displacement at the ends. Each harmonic fits an integer number of half-wavelengths along the string:

$$
L = \frac{n\lambda_n}{2}
$$

Here $L$ is the string length, $n=1,2,3,\ldots$ is the harmonic number, and $\lambda_n$ is its wavelength. The first harmonic has one half-wave; the second has two; the third has three. The dots show nodes, points that stay still.

```figure
export default function () {
  const steps = [1, 2, 3, 4].map(n => ({
    n,
    nodes: Array.from({ length: n + 1 }, (_, k) => [k / n, 0]),
    antinodes: Array.from({ length: n }, (_, k) => [(k + 0.5) / n, (k % 2 === 0 ? 1 : -1)]),
    text: `Harmonic **${n}**: ${n} half-wave${n === 1 ? '' : 's'} fit between the fixed ends.`
  }));

  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Plot x={[0, 1]} y={[-1.2, 1.2]} xLabel="Position along string" yLabel="Displacement">
        <Fn id="wave" f={x => Math.sin(step.n * Math.PI * x)} from={0} to={1} />
        <Points id="nodes" pts={step.nodes} label="Nodes" />
        <Points id="antinodes" pts={step.antinodes} label="Antinodes" />
      </Plot>
    )} />
  );
}
```

For example, the third harmonic has three half-waves and four nodes, including the two fixed ends.

