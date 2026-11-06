A **Taylor polynomial** approximates a curve near a chosen point using powers of the distance from that point. Around $0$, each new term in the sine series improves the approximation near $0$:

$$
P_n(x)=\sum_{k=0}^{n-1}(-1)^k\frac{x^{2k+1}}{(2k+1)!}
$$

Here $n$ is the number of terms. At $x=1$, the first terms give $1$, then $1-\frac16\approx0.8333$, then $1-\frac16+\frac1{120}\approx0.8417$, and then about $0.8415$. Since $\sin(1)\approx0.84147$, these values get closer as terms are added.

```figure
function taylor(x, terms) {
  let sum = 0;
  let factorial = 1;
  for (let k = 0; k < terms; k++) {
    const power = 2 * k + 1;
    if (k === 0) factorial = 1;
    else factorial *= (2 * k) * (2 * k + 1);
    sum += (k % 2 === 0 ? 1 : -1) * Math.pow(x, power) / factorial;
  }
  return sum;
}

const steps = Array.from({ length: 5 }, (_, i) => ({
  terms: i + 1,
  text: `With **${i + 1} ${i === 0 ? 'term' : 'terms'}**, the polynomial follows $\\sin x$ more closely near $0$.`
}));

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Plot x={[-2.5, 2.5]} y={[-2, 2]} xLabel="x" yLabel="y">
        <Fn id="sine" f={x => Math.sin(x)} label="$\\sin x$" />
        {Array.from({ length: 5 }, (_, i) => {
          const terms = i + 1;
          return (
            <Fn
              id={`p${terms}`}
              f={x => terms <= step.terms ? taylor(x, terms) : NaN}
              label={`$P_${terms}(x)$`}
              state={terms < step.terms ? "done" : terms === step.terms ? "active" : "dim"}
            />
          );
        })}
      </Plot>
    )} />
  );
}
```

This improvement is most useful near $0$; far from $0$, a polynomial can eventually stray from the sine curve.

