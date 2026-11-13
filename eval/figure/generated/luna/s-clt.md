The **central limit theorem** says that averages of many independent draws become approximately bell-shaped, even when the population is skewed, if it has finite variance. The chart compares a right-skewed exponential population with the distribution of its sample means. Move the slider to change how many draws go into each mean; at 16 draws, the standard error is 0.25.

```figure
export const params = {
  n: { label: 'Sample size', min: 1, max: 30, step: 1, value: 1 }
};

function logFactorial(k) {
  let total = 0;
  for (let j = 2; j <= k; j++) total += Math.log(j);
  return total;
}

export default function ({ n }) {
  const meanDensity = x => {
    if (x <= 0) return n === 1 ? 1 : 0;
    return Math.exp(
      n * Math.log(n * x) - n * x - logFactorial(n - 1) - Math.log(x)
    );
  };

  return (
    <Column gap="md">
      <Plot id="sampling-distribution" x={[0, 3]} y={[0, 2.5]} xLabel="Value" yLabel="Density">
        <Fn id="population" f={x => Math.exp(-x)} from={0} to={3} label="Population: Exp(1)" />
        <Fn id="sample-means" f={meanDensity} from={0} to={3} label={`Means of ${n} draws`} />
      </Plot>
      <Row gap="md">
        <Node label={n} sub="draws per sample" />
        <Node label={(1 / Math.sqrt(n)).toFixed(2)} sub="standard error (population σ = 1)" />
      </Row>
    </Column>
  );
}
```

