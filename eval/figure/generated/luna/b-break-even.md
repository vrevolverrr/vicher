Break-even is where revenue meets total cost. Change the selling price with the slider; the marked point shows the break-even quantity.

```figure
export const params = {
  price: { label: 'Price per unit', min: 35, max: 60, step: 1, value: 60, unit: '$' }
};

export default function ({ price }) {
  const quantity = 12000 / (price - 30);
  return (
    <Figure
      steps={[{ price, quantity }]}
      render={step => (
        <Plot x={[0, 2500]} y={[0, 150000]} xLabel="Units sold" yLabel="Dollars">
          <Fn
            id="total-cost"
            f={q => 12000 + 30 * q}
            from={0}
            to={2500}
            label="Total cost: $12,000 + $30 per unit"
          />
          <Fn
            id="revenue"
            f={q => step.price * q}
            from={0}
            to={2500}
            label={`Revenue: $${step.price} per unit`}
          />
          <Points
            pts={[[step.quantity, step.price * step.quantity]]}
            label={`Break-even: ${Math.round(step.quantity)} units`}
          />
        </Plot>
      )}
    />
  );
}
```

