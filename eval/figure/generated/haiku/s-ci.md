Bash was denied, so I could not run a script. The figure below runs the simulation itself with a fixed seed. I chose μ = 50, σ = 10 (assumed known), n = 25, so each interval is x̄ ± 1.96 × 10/√25 = x̄ ± 3.92. Change the seed to draw a new set of 20.

```figure
export const params = { seed: { label: 'Seed', min: 1, max: 99, step: 1, value: 7 } };

export default function ({ seed }) {
  const mu = 50, sigma = 10, n = 25, z = 1.96;
  const h = z * sigma / Math.sqrt(n);            // 1.96 × (10 / √25) = 3.92
  let s = seed >>> 0;
  const rand = () => {                           // seeded generator: same seed, same samples
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const rows = [];
  for (let k = 1; k <= 20; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += mu + sigma * normal();
    const m = sum / n;
    const miss = m + h < mu || m - h > mu;       // interval does not cover μ
    rows.push({ k, m, lo: m - h, hi: m + h, miss });
  }
  const misses = rows.filter(r => r.miss).length;
  const emphasis = r => (r.miss ? { state: 'active' } : {});
  return (
    <Figure
      steps={[rows]}
      title="20 samples of size 25, σ = 10 known"
      legend={{ 'misses μ': 'red' }}
      caption={() => `${misses} of 20 intervals miss μ = 50. Expect about 1 in 20 (5%).`}
      render={rs => (
        <Plot id="ci" x={[0, 21]} y={[38, 62]} xLabel="Sample" yLabel="Mean and 95% CI">
          <Segment id="mu" from={[0, mu]} to={[21, mu]} label="μ = 50" group="true mean" />
          {rs.map(r => <Segment key={`s${r.k}`} id={`s${r.k}`} from={[r.k, r.lo]} to={[r.k, r.hi]} group={r.miss ? 'misses μ' : 'covers μ'} {...emphasis(r)} />)}
          {rs.filter(r => !r.miss).map(r => <Points key={`h${r.k}`} id={`h${r.k}`} pts={[[r.k, r.m]]} group="covers μ" />)}
          {rs.filter(r => r.miss).map(r => <Points key={`m${r.k}`} id={`m${r.k}`} pts={[[r.k, r.m]]} group="misses μ" state="active" />)}
        </Plot>
      )}
    />
  );
}
```

Red bars with bold outline are the intervals that miss μ = 50. Blue-style bars cover it.

Not checked: the figure has not been rendered here, and I did not verify the miss count for seed 7. If the figure shows an error instead of a plot, that is the first thing to report. Skipped: a t-interval and a real random run outside the figure.