A one-sample t-test checks whether a sample mean is too far from a claimed value for chance to explain the gap. It is used when the population standard deviation is unknown, so the sample standard deviation $s$ replaces it and the t distribution replaces the normal.

**Definition.** For $n$ independent observations from an approximately normal population with unknown $\sigma$, test $H_0: \mu = \mu_0$ with

$$t = \frac{\bar{x} - \mu_0}{s/\sqrt{n}}$$

Here $\bar{x}$ is the sample mean, $\mu_0$ is the value under $H_0$, $s$ is the sample standard deviation, and $n$ is the sample size. If $H_0$ is true, $t$ follows Student's t distribution with $df = n - 1$. At two-sided level $\alpha$, reject $H_0$ when $|t| > t_{\alpha/2,\, n-1}$.

```figure
const df = 15;
const C = 0.39233;  // Γ(8) / (√(15π) · Γ(7.5))
const pdf = x => C * Math.pow(1 + x * x / df, -(df + 1) / 2);
const crit = 2.131;
const tObs = 2;

export default function () {
  return (
    <Plot id="tplot" x={[-4, 4]} y={[0, 0.45]} xLabel="t" yLabel="density">
      <Fn id="pdf" f={pdf} label="t, df = 15" />
      <Region id="left" top="pdf" from={-4} to={-crit} label="reject H0" />
      <Region id="right" top="pdf" from={crit} to={4} label="reject H0" />
      <Segment id="obs" from={[tObs, 0]} to={[tObs, pdf(tObs)]} label="t = 2" />
    </Plot>
  );
}
```

**Your numbers**

1. Standard error: $SE = s/\sqrt{n} = 8/\sqrt{16} = 8/4 = 2$.
2. Statistic: $t = (52 - 48)/2 = 2$.
3. Degrees of freedom: $df = 16 - 1 = 15$.
4. Critical value: at $\alpha = 0.05$ two-sided, each tail holds $0.025$. From the t table, $t_{0.975,\,15} = 2.131$. Reject if $|t| > 2.131$.
5. Compare: $|2| < 2.131$, so fail to reject $H_0$.
6. p-value: about $0.064$. It is above $0.05$, which gives the same decision.
7. Check with the confidence interval: $52 \pm 2.131 \cdot 2 = 52 \pm 4.26$, so $(47.74,\ 56.26)$. This interval contains 48, which agrees with step 5.

At the 5% level, the data do not show that $\mu$ differs from 48. The test does not show that $\mu = 48$.

**Limits.** The test needs independent observations and a roughly normal population. With $n = 16$, strong skew or outliers can make the p-value unreliable. Check a histogram first, or use a nonparametric test.