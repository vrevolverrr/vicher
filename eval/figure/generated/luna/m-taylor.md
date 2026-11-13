Each added term improves the approximation near $0$. For $\sin x$, the terms use odd powers and alternate signs:

$$
T_n(x)=\sum_{k=0}^{n-1}(-1)^k\frac{x^{2k+1}}{(2k+1)!}
$$

Here, $n$ is the number of terms. For example, at $x=1$, the first term gives $1$; adding the second gives $1-\frac{1}{6}\approx0.833$, closer to $\sin(1)\approx0.841$.

Step through the figure to compare each polynomial with $\sin x$. The approximation is especially close near $0$.

```figure
const steps = [];
for (let n = 1; n <= 8; n++) {
  const coefficients = [];
  let factorial = 1;
  for (let j = 1; j <= 2 * n - 1; j++) {
    factorial *= j;
    if (j % 2 === 1) {
      coefficients.push((coefficients.length % 2 === 0 ? 1 : -1) / factorial);
    }
  }
  const poly = x => coefficients.reduce((sum, c, k) => sum + c * x ** (2 * k + 1), 0);
  steps.push({ n, poly });
}

export default function () {
  return (
    <Figure
      steps={steps}
      caption={step => `With **${step.n} ${step.n === 1 ? 'term' : 'terms'}**, the polynomial follows $\\sin x$ more closely near $0$.`}
      render={step => (
        <Plot x={[-4, 4]} y={[-2, 2]} xLabel="x" yLabel="y">
          <Fn id="sine" f={x => Math.sin(x)} label="$\\sin x$" />
          <Fn id="approx" f={x => step.poly(x)} label={`$T_${step.n}(x)$`} />
        </Plot>
      )}
    />
  );
}
```

