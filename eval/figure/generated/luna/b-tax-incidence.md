A per-unit tax raises the price buyers must pay for each quantity supplied, shifting the supply curve up by the tax amount. Here, the tax cuts trade from 40 to 30 units, creating a deadweight loss from the 10 units no longer traded.

Before tax, equilibrium solves $100-Q=20+Q$, giving $Q=40$ and $P=60$. With a tax of 20, the buyer price is $20$ above the seller’s price, so the taxed supply curve is $P=40+Q$:

$$100-Q=40+Q \quad\Rightarrow\quad Q=30$$

Buyers pay $70$, while sellers receive $50$. The lost gains from trade form a triangle between demand and the original supply curve, from $Q=30$ to $Q=40$:

$$\text{DWL}=\frac{1}{2}(40-30)(20)=100$$

```figure
export default function () {
  return (
    <Plot id="tax-chart" x={[0, 60]} y={[0, 110]} xLabel="Quantity $Q$" yLabel="Price $P$">
      <Fn id="demand" f={q => 100 - q} from={0} to={60} label="Demand: $P=100-Q$" />
      <Fn id="supply" f={q => 20 + q} from={0} to={60} label="Supply: $P=20+Q$" />
      <Fn id="taxed-supply" f={q => 40 + q} from={0} to={60} label="Supply with tax: $P=40+Q$" />
      <Region id="dwl" top="demand" base="supply" from={30} to={40} label="DWL" />
      <Points id="before" pts={[[40, 60]]} label="Before tax: $(40,60)$" />
      <Points id="after" pts={[[30, 70], [30, 50]]} label="After tax: buyer $70$, seller $50$" />
    </Plot>
  );
}
```

The tax wedge is 20 per unit traded; the deadweight loss is the value of the trades between 30 and 40 units that no longer happen.

