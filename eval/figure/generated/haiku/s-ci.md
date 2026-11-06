Figure below: 20 independent 95% t-intervals from samples of n = 10, drawn from a population with μ = 50 and σ = 10. Thick bars are the intervals that miss μ. I could not run the simulation (the Bash tool was denied), so the miss count appears only when the figure renders. Change the seed to draw a new set of 20.

```figure
export const params = { seed: { label: 'Seed', min: 1, max: 99, step: 1, value: 7 } };

export default function ({ seed }) {
  const mu = 50, sigma = 10, n = 10;
  const t = 2.262;                              // t(0.975, df = 9)
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const normal = () => Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
  const runs = [];
  for (let k = 1; k <= 20; k++) {
    const xs = Array.from({ length: n }, () => mu + sigma * normal());
    const m = xs.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
    const h = t * sd / Math.sqrt(n);
    runs.push({ k, m, lo: m - h, hi: m + h, miss: mu < m - h || mu > m + h });
  }
  const misses = runs.filter(r => r.miss).length;

  return (
    <Column gap="md">
      <Text>{`Each bar is a 95% CI. The dot is the sample mean. **${misses} of 20** intervals miss μ. Thick bars miss μ.`}</Text>
      <Plot id="cis" x={[30, 70]} y={[0, 21]} xLabel="value" yLabel="sample">
        <>
          {runs.map(r => (
            <Segment key={`ci${r.k}`} id={`ci${r.k}`} from={[r.lo, r.k]} to={[r.hi, r.k]}
              group={r.miss ? 'Misses μ' : 'Contains μ'} state={r.miss ? 'active' : undefined} />
          ))}
          <Points id="means" pts={runs.map(r => [r.m, r.k])} label="sample mean" />
          <Segment id="mu" from={[mu, 0]} to={[mu, 21]} label="μ = 50" />
        </>
      </Plot>
    </Column>
  );
}
```