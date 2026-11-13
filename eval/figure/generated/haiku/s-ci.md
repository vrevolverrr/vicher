```figure
export const params = { n: { label: 'Sample size', min: 5, max: 100, step: 5, value: 25 } };

export default function ({ n }) {
  const mu = 50, sigma = 10, z = 1.96, K = 20;
  let s = 20260113;                                  // seeded: same 20 samples on every redraw
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const norm = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
  const half = z * sigma / Math.sqrt(n);
  const runs = [];
  for (let i = 0; i < K; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += mu + sigma * norm();
    const mean = sum / n;
    const miss = mu < mean - half || mu > mean + half;
    runs.push({ i: i + 1, mean, lo: mean - half, hi: mean + half, miss });
  }
  const misses = runs.filter(r => r.miss).length;
  return (
    <Column gap="md">
      <Plot id="ci" x={[0, K + 1]} xLabel="Sample number" yLabel="Sample mean and 95% interval">
        <Segment id="mu" from={[0, mu]} to={[K + 1, mu]} label="true mean μ = 50" group="true mean" />
        {runs.map(r => (
          <>
            <Segment id={`ci${r.i}`} from={[r.i, r.lo]} to={[r.i, r.hi]} group={r.miss ? 'misses μ' : 'covers μ'} />
            <Points id={`pt${r.i}`} pts={[[r.i, r.mean]]} group={r.miss ? 'misses μ' : 'covers μ'} />
            {r.miss && <Label id={`lab${r.i}`} at={[r.i, r.lo - 1]} text="miss" group="misses μ" />}
          </>
        ))}
      </Plot>
      <Tex tex="\bar{x} \pm 1.96\,\frac{\sigma}{\sqrt{n}}" />
      <Text>{`Each dot is one sample mean. Its bar is the 95% interval. ${misses} of ${K} intervals miss μ = 50 in this run.`}</Text>
    </Column>
  );
}
```

Each dot is a sample mean and each bar is its 95% interval, with σ = 10 treated as known. Drag the sample-size slider to see the bars narrow as n grows.

Not checked: I could not run the figure because Bash was denied, so the miss count and the render are unverified. Risk: the intervals are built with the known-σ z value, not a t value, which is a simplification for a sample-based interval.