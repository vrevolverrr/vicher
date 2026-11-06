The Taylor polynomial of $\sin x$ at $0$ is a sum of odd powers of $x$. Each added term matches one more derivative of $\sin$ at $0$, so the polynomial stays close to the curve over a wider range.

**Taylor polynomial.** The degree-$n$ Taylor polynomial of $f$ at $0$ is:

$$P_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(0)}{k!}\,x^k$$

Here $f^{(k)}(0)$ is the $k$th derivative of $f$ at $0$, and $k!$ is $k$ factorial. The derivatives of $\sin$ at $0$ repeat $0, 1, 0, -1$, so only odd powers survive. The degree-7 polynomial is:

$$P_7(x) = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!}$$

**Example at $x = 1$**, where $\sin 1 = 0.841471$:

| Degree | Last term added | $P(1)$ | Error |
|---|---|---|---|
| 1 | $x$ | 1 | 0.158529 |
| 3 | $-\frac{x^3}{3!}$ | 0.833333 | 0.008138 |
| 5 | $+\frac{x^5}{5!}$ | 0.841667 | 0.000196 |
| 7 | $-\frac{x^7}{7!}$ | 0.841468 | 0.0000027 |

**Where it stops working.** For a fixed degree, the error grows as $|x|$ grows. At $x = 3$, $P_7(3) = 0.0911$ misses $\sin 3 = 0.1411$ by $0.0500$. $P_{11}(3) = 0.14087$ misses by only $0.00025$.

Use the step control to add terms, from degree 1 to degree 7:

```figure
const sinOf = x => Math.sin(x);

// Sum of the first m nonzero terms of the sine series.
function P(m, x) {
  let s = 0, term = x;
  for (let j = 0; j < m; j++) {
    s += term;
    term = -term * x * x / ((2 * j + 2) * (2 * j + 3));
  }
  return s;
}

export default function () {
  const steps = [1, 2, 3, 4].map(m => {
    const deg = 2 * m - 1;
    const err = (Math.sin(1) - P(m, 1)).toPrecision(3);
    return {
      m,
      deg,
      text: String.raw`Degree $P_{${deg}}$ has ${m} term${m > 1 ? 's' : ''}. At $x=1$ the error is ${err}.`,
    };
  });
  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Plot id="plot" x={[-3.5, 3.5]} y={[-2, 2]} xLabel="$x$" yLabel="$y$">
          <Fn id="sin" f={x => sinOf(x)} label="$\sin x$" />
          <Fn id="poly" f={x => P(step.m, x)} label={String.raw`$P_{${step.deg}}(x)$`} />
          <Points id="at1" pts={[[1, Math.sin(1)]]} />
        </Plot>
      )}
    />
  );
}
```

Not checked: I did not render the figure, and the table values are hand-computed to six digits.