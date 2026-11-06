The central limit theorem says that averages of many independent draws tend to form a bell-shaped distribution, even when the population itself is skewed. The slider shows this using an exponential population, which has mean and standard deviation 1.

For independent, identically distributed draws with finite mean $\mu$ and standard deviation $\sigma$, the sample mean is approximately normal for large $n$:

$$
\bar X \approx \mathcal{N}\left(\mu,\frac{\sigma^2}{n}\right)
$$

Here, $n$ is the sample size. For this population, at $n=25$, sample means are centered near 1, with standard error $1/\sqrt{25}=0.2$.

```figure
export const params = {
  n: { label: 'Sample size', min: 1, max: 40, step: 1, value: 1 }
};

export default function ({ n }) {
  const replications = 5000;
  const bins = 100;
  const binWidth = 5 / bins;
  let seed = 20261106;
  const uniform = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };

  const counts = Array(bins).fill(0);
  for (let r = 0; r < replications; r++) {
    let total = 0;
    for (let j = 0; j < n; j++) {
      total += -Math.log(1 - uniform());
    }
    const mean = total / n;
    const bin = Math.floor(mean / binWidth);
    if (bin >= 0 && bin < bins) counts[bin]++;
  }

  const standardError = 1 / Math.sqrt(n);
  return (
    <Figure title="A skewed population, then its sample means">
      <Row gap="lg" align="start">
        <Column gap="md">
          <Panel title="Population: exponential">
            <Plot id="population" x={[0, 5]} y={[0, 1.2]} xLabel="Value" yLabel="Density">
              <Fn id="exp-density" f={x => Math.exp(-x)} from={0} to={5} label="Exponential density" />
            </Plot>
            <Text>Right-skewed; mean $1$, standard deviation $1$.</Text>
          </Panel>
        </Column>
        <Column gap="md">
          <Panel title={`Distribution of sample means (n = ${n})`}>
            <Plot id="means" x={[0, 5]} y={[0, 4]} xLabel="Sample mean" yLabel="Density">
              {counts.map((count, i) => (
                <Region
                  id={`bin-${i}`}
                  from={i * binWidth}
                  to={(i + 1) * binWidth}
                  top={count / (replications * binWidth)}
                  label="Simulated sample means"
                  group="sample-means"
                />
              ))}
              <Fn
                id="normal-approx"
                f={x => {
                  const z = (x - 1) / standardError;
                  return Math.exp(-0.5 * z * z) / (standardError * Math.sqrt(2 * Math.PI));
                }}
                from={0}
                to={5}
                label="Normal approximation"
              />
            </Plot>
            <Text>{`The approximate standard error is $1/\\sqrt{${n}} = ${standardError.toFixed(2)}$.`}</Text>
          </Panel>
        </Column>
      </Row>
    </Figure>
  );
}
```

