A Taylor polynomial uses the curve’s value and derivatives at $0$ to build a polynomial that matches it near $0$. For $\sin x$, adding terms gives:

$$
T_n(x)=\sum_{k=0}^{n-1}(-1)^k\frac{x^{2k+1}}{(2k+1)!}
$$

Here, $n$ is the number of terms. For example, at $x=1$, the first three polynomials give $1$, $1-\frac16\approx0.8333$, and $1-\frac16+\frac1{120}\approx0.8417$, approaching $\sin(1)\approx0.8415$. Use the slider to compare the curve with the first $n$ terms.

```figure
export const params = {
  n: { label: 'Terms', min: 1, max: 6, step: 1, value: 1 }
};

function taylorSin(x, n) {
  let term = x;
  let sum = 0;
  for (let k = 0; k < n; k++) {
    sum += term;
    term *= -x * x / ((2 * k + 2) * (2 * k + 3));
  }
  return sum;
}

export default function ({ n }) {
  return (
    <Plot id="sin-taylor" x={[-2, 2]} y={[-2.2, 2.2]} xLabel="x" yLabel="y">
      <Fn id="sin" f={x => Math.sin(x)} label="$\sin x$" />
      <Fn id="approx" f={x => taylorSin(x, n)} label={`$T_${n}(x)$`} />
    </Plot>
  );
}
```

The approximation is most accurate near $0$; a Taylor polynomial need not stay close to the curve far away.

