```figure
export const params = { p: { label: 'Price per unit', min: 31, max: 100, step: 1, value: 50, unit: '$' } };

const F = 12000;   // fixed costs, $
const v = 30;      // variable cost per unit, $

const money = n => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function ({ p }) {
  const q = F / (p - v);                      // break-even units
  const revenue = p * q;                      // revenue at break-even
  const xMax = Math.ceil(2 * q / 100) * 100;  // axis reaches twice the break-even
  const yMax = Math.max(p * xMax, F + v * xMax);

  return (
    <Row gap="lg" align="center">
      <Plot id="chart" x={[0, xMax]} y={[0, yMax]} xLabel="Units sold" yLabel="Dollars">
        <Fn id="rev" f={x => p * x} label="Revenue" />
        <Fn id="cost" f={x => F + v * x} label="Total cost" />
        <Points id="be" pts={[[q, revenue]]} label="Break-even" />
      </Plot>
      <Column gap="md">
        <Node id="units" label={String(Math.ceil(q))} sub="units to break even" />
        <Node id="rev-val" label={money(revenue)} sub="revenue at break-even" />
        <Node id="margin" label={money(p - v)} sub="contribution per unit" />
      </Column>
    </Row>
  );
}
```

Break-even units: $Q = \dfrac{F}{p - v}$. At $p = \$50$: $Q = 12000 / (50 - 30) = 600$ units.

Prices of $30 or less never break even, so the slider starts at $31.

Skipped: a slider for fixed or variable cost. Not checked: rendering in your app.