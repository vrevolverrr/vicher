A Taylor polynomial copies a curve near one point. Each term you add matches one more derivative of the curve at that point, so the copy follows the curve over a wider stretch. Step through the figure to see each odd power added.

```figure
const fact = k => (k <= 1 ? 1 : k * fact(k - 1));

// Taylor polynomial of sin x at 0, keeping every odd power up to x^n
const P = (x, n) => {
  let s = 0;
  for (let k = 1; k <= n; k += 2) {
    const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
    s += sign * Math.pow(x, k) / fact(k);
  }
  return s;
};

export default function () {
  const steps = [1, 3, 5, 7, 9].map(n => {
    const p = P(1, n);
    return { n, p, err: Math.abs(Math.sin(1) - p) };
  });
  return (
    <Figure
      steps={steps}
      heading={step => String.raw`Up to $x^{${step.n}}$`}
      caption={step => String.raw`$P_{${step.n}}(1)=${step.p.toFixed(6)}$, so the error at $x=1$ is ${step.err.toPrecision(3)}.`}
      render={step => (
        <Plot id="plot" x={[-4, 4]} y={[-2, 2]} xLabel="x" yLabel="y" equal>
          <Fn id="sin" f={x => Math.sin(x)} label="$\sin x$" group="target" />
          <Fn id="poly" f={x => P(x, step.n)} label={`$P_{${step.n}}(x)$`} group="approx" />
          <Points id="pt-sin" pts={[[1, Math.sin(1)]]} group="target" />
          <Points id="pt-poly" pts={[[1, step.p]]} group="approx" />
          <Segment id="err" from={[1, step.p]} to={[1, Math.sin(1)]} group="error" />
        </Plot>
      )}
    />
  );
}
```

**Definition.** The Taylor polynomial of degree $n$ of $f$ at $0$ sums $\frac{f^{(k)}(0)}{k!}x^k$ for $k=0$ to $n$. Here $f^{(k)}$ is the $k$-th derivative and $k!$ is $k$ factorial. For $\sin x$, the derivatives at $0$ are $0, 1, 0, -1, \dots$, so only odd powers remain, with signs $+, -, +, \dots$:

$$P_{2m+1}(x)=x-\frac{x^{3}}{3!}+\frac{x^{5}}{5!}-\cdots+(-1)^{m}\frac{x^{2m+1}}{(2m+1)!}$$

Here $P_{2m+1}$ has highest power $x^{2m+1}$, and $m$ counts the terms after $x$.

**Worked example at $x=1$.** Here $\sin 1 = 0.841471$.

- $P_1(1)=1$, error $0.159$.
- $P_3(1)=1-\frac{1}{6}=0.833333$, error $0.00814$.
- $P_5(1)=0.833333+\frac{1}{120}=0.841667$, error $0.000196$.
- $P_7(1)=0.841667-\frac{1}{5040}=0.841468$, error $0.0000027$.

Each error is roughly 20 to 70 times smaller than the one before. The vertical gap at $x=1$ in the figure is that error.

**Where it stops working.** The fit is best near $0$. At $x=3$, $P_1(3)=3$ while $\sin 3 = 0.141$. Even $P_9(3)\approx 0.145$ is still $0.004$ away. Far from $0$, a fixed degree fails, so you need more terms.

Not checked: the figure does not run here. I computed the numbers by hand, not in code.