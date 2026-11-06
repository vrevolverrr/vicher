Use the price slider in the chart to change the price. The break-even point moves as you change it.

```figure
export const params = { p: { label: 'Price per unit', min: 31, max: 100, step: 1, value: 50, unit: 'dollars' } };

const F = 12000; // fixed costs
const v = 30;    // variable cost per unit

export default function ({ p }) {
  const ok = p > v;
  const q = ok ? F / (p - v) : 0;
  const xMax = ok ? Math.max(1000, Math.ceil((q * 1.5) / 100) * 100) : 1000;
  const yMax = Math.ceil((Math.max(p * xMax, F + v * xMax) * 1.1) / 1000) * 1000;
  return (
    <Row gap="lg" align="center">
      <Plot id="chart" x={[0, xMax]} y={[0, yMax]} xLabel="Units sold" yLabel="Dollars">
        <Fn id="rev" f={x => p * x} from={0} to={xMax} label="Revenue" />
        <Fn id="cost" f={x => F + v * x} from={0} to={xMax} label="Total cost" />
        {ok ? <Points id="be" pts={[[q, p * q]]} label="Break-even" /> : null}
      </Plot>
      <Column gap="md">
        <Node id="units" label={ok ? `${Math.round(q)}` : 'none'} sub="break-even units" />
        <Node id="rev-be" label={ok ? `${Math.round(p * q)}` : 'none'} sub="break-even revenue (dollars)" />
      </Column>
    </Row>
  );
}
```

Break-even is where revenue equals total cost:

$$pq = F + vq \implies q^* = \frac{F}{p - v}$$

Here $p$ is the price, $q$ the units sold, $F$ the fixed costs, and $v$ the variable cost per unit.

At $p = 50$: $q^* = \dfrac{12000}{50 - 30} = 600$ units. Revenue is $50 \times 600 = 30000$, and cost is $12000 + 30 \times 600 = 30000$.

Below a price of $30 the lines never cross, so there is no break-even point.