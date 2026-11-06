The **central limit theorem** says that averages from many independent draws tend to form a bell-shaped distribution, even when the population itself is skewed. The averages also vary less as the sample size grows.

For independent, identically distributed draws with population mean $\mu$ and finite standard deviation $\sigma$, the standardized sample mean approaches a standard normal distribution as $n$ grows:

$$
Z = \frac{\bar X-\mu}{\sigma/\sqrt n}
$$

Here $\bar X$ is the sample mean, and $\sigma/\sqrt n$ is its standard deviation. The figure uses an exponential population, which is strongly skewed, and shows the standardized sample-mean distribution as you change $n$.

For example, if $\mu=1$ and $\sigma=1$, then with $n=25$ the sample mean’s standard deviation is $1/\sqrt{25}=0.2$. A sample mean of $1.4$ is two standard deviations above the population mean, so the theorem gives an approximate probability of about $97.7\%$ that the sample mean is below $1.4$. This approximation improves as the sample size grows; it can work poorly for small samples from especially skewed populations.

```figure
export const params = {
  n: { label: 'Sample size', min: 1, max: 40, step: 1, value: 1 }
};

function logGammaInteger(n) {
  let result = 0;
  for (let k = 1; k < n; k++) result += Math.log(k);
  return result;
}

export default function ({ n }) {
  const logGamma = logGammaInteger(n);
  const steps = [{ n }];

  return (
    <Figure
      steps={steps}
      title="Standardized sample means"
      render={step => (
        <Plot id="clt-plot" x={[-4, 5]} y={[0, 0.5]} xLabel="Standardized sample mean" yLabel="Density">
          <Fn
            id="sample-means"
            from={-4}
            to={5}
            label={`Exponential population, n = ${step.n}`}
            f={z => {
              const rootN = Math.sqrt(step.n);
              const a = 1 + z / rootN;
              if (a <= 0) return 0;
              return Math.exp(
                0.5 * Math.log(step.n) +
                step.n * Math.log(step.n) -
                logGamma +
                (step.n - 1) * Math.log(a) -
                step.n * a
              );
            }}
          />
          <Fn
            id="normal-curve"
            from={-4}
            to={5}
            label="Standard normal"
            f={z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)}
          />
        </Plot>
      )}
    />
  );
}
```

