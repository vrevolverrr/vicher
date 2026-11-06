The central limit theorem says that averages of many draws follow a bell curve, even when the draws themselves do not. Take a sample, compute its mean, repeat many times, and the means form a normal curve as the sample size grows.

More precisely, for independent draws from one population with finite mean $\mu$ and finite variance $\sigma^2$, the sample mean $\bar X_n$ of $n$ draws is approximately normal for large $n$:

$$\bar X_n \approx N\!\left(\mu,\ \frac{\sigma^2}{n}\right)$$

Here $\mu$ is the population mean, $\sigma^2$ is its variance, and $n$ is the sample size. The spread of the means shrinks as $1/\sqrt{n}$.

The population in the figure is exponential, with $\mu = 1$ and $\sigma = 1$. Its long right tail makes it skewed. The top panel stays fixed. Move the slider and watch the bottom histogram change shape.

```figure
export const params = {
  n: { label: 'Sample size n', min: 1, max: 100, step: 1, value: 5 },
};

const MU = 1;       // mean of the population, Exp(1)
const SIGMA = 1;    // standard deviation of the population, Exp(1)
const REPS = 2000;  // how many sample means we draw
const BIN = 0.05;   // histogram bin width
const XMAX = 3;     // chart runs from 0 to XMAX

// Park-Miller generator: fixed seed, so every run gives the same numbers
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (16807 * s) % 2147483647;
    return s / 2147483647;
  };
}

// Draw REPS samples of size n from the skewed population and return their means
function sampleMeans(n) {
  const rand = makeRandom(12345);
  const means = [];
  for (let r = 0; r < REPS; r++) {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += -Math.log(rand()); // one Exp(1) draw
    means.push(sum / n);
  }
  return means;
}

const normalPdf = (x, m, s) =>
  Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

export default function ({ n }) {
  const means = sampleMeans(n);
  const bins = Math.round(XMAX / BIN);
  const counts = Array(bins).fill(0);
  for (const m of means) {
    const i = Math.floor(m / BIN);
    if (i < bins) counts[i] += 1; // means above XMAX are off the chart
  }
  const shown = counts.reduce((a, b) => a + b, 0);
  const dens = counts.map(c => c / (REPS * BIN)); // bar heights as density

  const mean = means.reduce((a, b) => a + b, 0) / REPS;
  const sd = Math.sqrt(means.reduce((a, m) => a + (m - mean) ** 2, 0) / (REPS - 1));
  const se = SIGMA / Math.sqrt(n);  // theory: sd of the sample mean
  const peak = normalPdf(MU, MU, se);

  return (
    <Figure
      steps={[{}]}
      title="Sample means from a skewed population"
      render={() => (
        <Column gap="md">
          <Panel title="Population (exponential, μ = 1)">
            <Plot id="pop" x={[0, XMAX]} xLabel="$x$" yLabel="density">
              <Fn id="popf" f={x => Math.exp(-x)} from={0} to={XMAX} label="population density" group="population" />
            </Plot>
          </Panel>
          <Panel title={`Sample means: n = ${n}, ${REPS} samples`}>
            <Plot id="means" x={[0, XMAX]} xLabel="$\bar{x}$" yLabel="density">
              {dens.map((d, i) => (
                <Region id={`bin${i}`} top={d} from={i * BIN} to={(i + 1) * BIN} group="sample means" />
              ))}
              <Fn id="normal" f={x => normalPdf(x, MU, se)} from={0} to={XMAX} label="normal curve" group="normal" />
              <Segment id="mu" from={[MU, 0]} to={[MU, peak]} label="$\mu = 1$" />
            </Plot>
          </Panel>
          <Row gap="md" align="center">
            <Node id="mean-node" label={mean.toFixed(3)} sub="mean of means, theory 1" />
            <Node id="sd-sim" label={sd.toFixed(3)} sub="sd of means, simulated" />
            <Node id="se-theory" label={se.toFixed(3)} sub="σ/√n, theory" />
          </Row>
          <Tex id="se-formula" tex={String.raw`\sigma_{\bar X}=\frac{\sigma}{\sqrt{${n}}}=${se.toFixed(3)}`} />
          <Text>{`${shown} of ${REPS} means fall inside the chart.`}</Text>
        </Column>
      )}
    />
  );
}
```

Worked example with $n = 5$: the spread of the means is $\sigma/\sqrt{5} = 0.447$. The chance that a sample mean exceeds 1.5 is about

$$P\!\left(Z > \frac{1.5 - 1}{0.447}\right) = P(Z > 1.118) \approx 0.132$$

Set the slider to 5. The bars right of 1.5 should cover about 13% of the total area.

The theorem needs a finite variance. A Cauchy population has none, so its sample means never settle into a bell. A small $n$ with heavy skew also still looks lopsided.

Not checked: I did not render the figure. The seed is fixed, so repeated runs show the same means.