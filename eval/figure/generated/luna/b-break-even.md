Break-even is where revenue covers all costs. For a price of $50 per unit, each unit contributes $20 toward fixed costs, so you break even after 600 units.

$$
Q_{\text{BE}} = \frac{\text{fixed costs}}{\text{price} - \text{variable cost per unit}}
$$

Here, $Q_{\text{BE}}$ is the number of units needed to break even. The chart shows revenue and total cost; move the price slider to see where the lines meet.

```figure
export const params = {
  price: { label: 'Price per unit', min: 20, max: 80, step: 1, value: 50, unit: '$' }
};

export default function ({ price }) {
  const breakEvenUnits = 12000 / (price - 30);
  const showBreakEven = price > 30 && breakEvenUnits <= 1000;

  return (
    <Plot
      id="break-even-chart"
      x={[0, 1000]}
      y={[0, 80000]}
      xLabel="Units sold"
      yLabel="Dollars"
    >
      <Fn id="revenue" f={x => price * x} label={`Revenue at $${price}/unit`} />
      <Fn id="total-cost" f={x => 12000 + 30 * x} label="Total cost" />
      {showBreakEven && (
        <>
          <Points id="break-even-point" pts={[[breakEvenUnits, price * breakEvenUnits]]} label="Break-even" />
          <Label at={[breakEvenUnits, price * breakEvenUnits]} text={`${Math.round(breakEvenUnits)} units`} />
        </>
      )}
    </Plot>
  );
}
```

At prices of $30 or less, there is no positive break-even quantity: revenue cannot cover both the variable cost and fixed costs.

