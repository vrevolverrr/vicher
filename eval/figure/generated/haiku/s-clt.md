The average of many samples forms a bell curve, even when the population itself is lopsided. This is the central limit theorem (CLT). Drag `n` in the figure: the left plot is the skewed population, and the right histogram shows 4000 sample means with the normal curve on top. The bars move toward the curve as `n` grows, and their width shrinks.

```figure
export const params = { n: { label: 'Sample size n', min: 1, max: 50, step: 1, value: 2 } };

const N_SAMPLES = 4000;   // sample means drawn per run
const BINS = 60;
const X_MAX = 3;
const W = X_MAX / BINS;   // histogram bin width

function rng(seed) {      // seeded random numbers: same draws on every run
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ({ n }) {
  const rand = rng(2026);
  const means = [];
  for (let k = 0; k < N_SAMPLES; k++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += -Math.log(1 - rand());   // one Exp(1) draw
    means.push(sum / n);
  }
  const se = 1 / Math.sqrt(n);   // sigma = 1, so SD of the mean = sigma / sqrt(n)
  const m = means.reduce((s, v) => s + v, 0) / N_SAMPLES;
  const sd = Math.sqrt(means.reduce((s, v) => s + (v - m) ** 2, 0) / N_SAMPLES);
  const counts = new Array(BINS).fill(0);
  for (const v of means) {
    const b = Math.floor(v / W);
    if (b >= 0 && b < BINS) counts[b]++;
  }
  const density = counts.map(c => c / (N_SAMPLES * W));
  const normal = x => Math.exp(-((x - 1) ** 2) / (2 * se * se)) / (se * Math.sqrt(2 * Math.PI));
  const yMax = Math.max(...density, normal(1)) * 1.15;

  return (
    <Column gap="md">
      <Row gap="lg" align="center">
        <Plot id="pop" x={[0, 4]} y={[0, 1.1]} xLabel="x" yLabel="density">
          <Fn id="popdens" f={x => Math.exp(-x)} from={0} to={4} label="Population, Exp(1)" />
        </Plot>
        <Plot id="means" x={[0, X_MAX]} y={[0, yMax]} xLabel="sample mean" yLabel="density">
          <>{density.map((d, i) => <Region id={`bin${i}`} top={d} from={i * W} to={(i + 1) * W} />)}</>
          <Fn id="clt" f={normal} from={0} to={X_MAX} label="Normal, SD = $1/\sqrt{n}$" />
        </Plot>
      </Row>
      <Row gap="md">
        <Node id="n" label={String(n)} sub="sample size" />
        <Node id="mean" label={m.toFixed(3)} sub="mean of means (theory 1)" />
        <Node id="sd" label={sd.toFixed(3)} sub={`SD (theory ${se.toFixed(3)})`} />
      </Row>
    </Column>
  );
}
```

**The theorem.** Take samples of size $n$, independently, from a population with mean $\mu$ and finite variance $\sigma^2$. As $n$ grows, the distribution of the sample mean $\bar{X}$ approaches a normal curve, whatever the population's shape. For large $n$:

$$\bar{X} \approx \mathcal{N}\!\left(\mu,\ \frac{\sigma^2}{n}\right)$$

Here $\mu$ is the population mean, $\sigma$ is its standard deviation, and $n$ is the sample size. The spread of $\bar{X}$ is $\sigma/\sqrt{n}$, so larger samples give tighter averages.

**Example.** The population is Exp(1), with $\mu = 1$ and $\sigma = 1$. Take $n = 4$ and find $P(\bar{X} > 2)$:

1. SD of the mean: $\sigma/\sqrt{n} = 1/2 = 0.5$.
2. Standardise: $z = (2 - 1)/0.5 = 2$.
3. Normal curve: $P(Z > 2) \approx 0.023$.

**Where it weakens.** The exact answer is $0.042$, because the sum of four Exp(1) values follows a Gamma(4, 1) law. At $n = 4$, the normal curve underestimates the right tail. The plot stops at 3, so means above 3 are not drawn.

Not checked: I did not run the figure, so the rendering is unverified. Skipped: other population shapes and a formal tail-accuracy check.