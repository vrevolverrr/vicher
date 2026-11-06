Fixed costs are $12,000, variable costs are $30 per unit. Adjust the price to see how the break-even point changes.

```figure
export const params = {
  price: { label: 'Price per unit', min: 20, max: 100, step: 1, value: 60, unit: '$' }
};

export default function ({ price }) {
  const breakEvenUnits = price > 30 ? 12000 / (price - 30) : null;
  const inView = breakEvenUnits !== null && breakEvenUnits <= 1000;

  return (
    <Figure
      steps={[{ price, breakEvenUnits, inView }]}
      render={step => (
        <Column gap="md">
          <Plot id="chart" x={[0, 1000]} y={[0, 100000]}
            xLabel="Units sold" yLabel="Dollars">
            <Fn id="revenue" f={x => step.price * x} label="Revenue" />
            <Fn id="total-cost" f={x => 12000 + 30 * x} label="Total cost" />
            {step.inView && (
              <Points id="break-even" pts={[[step.breakEvenUnits, step.price * step.breakEvenUnits]]}
                label="Break-even" />
            )}
          </Plot>
          <Text>
            {step.breakEvenUnits === null
              ? `At $${step.price} per unit, there is no break-even point: revenue does not cover fixed costs.`
              : `Break-even: ${step.breakEvenUnits.toFixed(1)} units at $${(step.price * step.breakEvenUnits).toFixed(0)} in sales${step.inView ? '' : ' (outside the chart range)'}.`}
          </Text>
        </Column>
      )}
    />
  );
}
```

