Move the price slider to see the break-even point, where the revenue line crosses the total cost line.

```figure
const F = 12000;     // fixed costs, $
const V = 30;        // variable cost per unit, $
const MAX_X = 1500;  // chart runs to 1,500 units

export const params = {
  price: { label: 'Price per unit', min: 40, max: 100, step: 1, value: 60, unit: '$' }
};

const money = n => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function ({ price }) {
  const qs = F / (price - V);   // break-even units
  const rs = qs * price;        // break-even revenue
  return (
    <Row gap="lg" align="start">
      <Plot id="be" x={[0, MAX_X]} xLabel="Units sold" yLabel="Dollars">
        <Fn id="rev" f={x => price * x} from={0} to={MAX_X} label="Revenue" />
        <Fn id="cost" f={x => F + V * x} from={0} to={MAX_X} label="Total cost" />
        <Segment id="drop" from={[qs, 0]} to={[qs, rs]} state="dim" />
        <Points id="be-pt" pts={[[qs, rs]]} label={`Break-even: ${Math.round(qs)} units`} />
      </Plot>
      <Column gap="sm">
        <Node id="units" label={`${Math.round(qs)}`} sub="units to break even" />
        <Node id="rev-n" label={money(rs)} sub="revenue at break-even" />
        <Node id="margin" label={money(price - V)} sub="profit per unit after variable cost" />
      </Column>
    </Row>
  );
}
```

The break-even formula, with $F$ fixed cost, $v$ variable cost per unit, $p$ price:

$$Q^* = \frac{F}{p - v} = \frac{12000}{60 - 30} = 400 \text{ units}$$

Not checked: the figure was not rendered in your viewer. Risk: below $40 per unit the break-even passes 1,500 units and leaves the chart, so the slider starts at $40.