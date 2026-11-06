A 95% confidence interval is made by a method that captures the true mean in about 95% of repeated samples. With known population standard deviation, the interval is:

$$
\bar{x} \pm 1.96\frac{\sigma}{\sqrt{n}}
$$

Here $\bar{x}$ is the sample mean, $\sigma$ the population standard deviation, and $n$ the sample size. The figure simulates 20 samples of size 25 from a population with mean 50 and standard deviation 10. The vertical line marks the true mean; × marks intervals that miss it.

```figure
const trueMean = 50;
const sigma = 10;
const n = 25;
const margin = 1.96 * sigma / Math.sqrt(n);

function makeSamples() {
  let seed = 2026;
  const uniform = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  const normal = () => {
    const u1 = uniform();
    const u2 = uniform();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  return Array.from({ length: 20 }, () => {
    const mean = trueMean + sigma * Array.from({ length: n }, normal).reduce((a, b) => a + b, 0) / n;
    return { mean, low: mean - margin, high: mean + margin };
  });
}

export default function () {
  const samples = makeSamples();
  return (
    <Plot x={[40, 60]} y={[0, 21]} xLabel="Measurement" yLabel="Sample">
      <Shape id="true-mean" pts={[[trueMean, 0], [trueMean, 21]]} group="True mean" />
      {samples.map((sample, i) => {
        const y = i + 1;
        const misses = sample.low > trueMean || sample.high < trueMean;
        return (
          <>
            <Shape
              id={`interval-${i}`}
              pts={[[sample.low, y], [sample.high, y]]}
              group={misses ? "Misses" : "Covers mean"}
            />
            {misses && <Label id={`miss-${i}`} at={[sample.mean, y]} text="×" group="Misses" />}
          </>
        );
      })}
    </Plot>
  );
}
```

