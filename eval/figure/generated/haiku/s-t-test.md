A one-sample t-test checks whether one sample's mean is far enough from a claimed value that chance alone is an unlikely explanation. Use it when you have one group and do not know the population standard deviation, so you estimate it with $s$.

### The test statistic

The **null hypothesis** $H_0$ says the true mean equals a claimed value $\mu_0$. The **two-sided alternative** $H_1$ says the mean differs in either direction, $\mu \neq \mu_0$. If $H_0$ is true and the data are roughly normal, this **test statistic** follows a t-distribution with $n-1$ degrees of freedom:

$$t = \frac{\bar{x} - \mu_0}{s/\sqrt{n}}$$

Here $\bar{x}$ is the sample mean, $\mu_0$ the claimed mean, $s$ the sample standard deviation, and $n$ the sample size. The denominator $s/\sqrt{n}$ is the **standard error** of the mean. You reject $H_0$ when $|t|$ exceeds the critical value $t_{\alpha/2,\,n-1}$. At 5% two-sided, 2.5% sits in each tail.

### Worked example

Given $n = 16$, $\bar{x} = 52$, $s = 8$, $\mu_0 = 48$:

1. Degrees of freedom: $df = 16 - 1 = 15$.
2. Standard error: $8/\sqrt{16} = 8/4 = 2$.
3. Test statistic: $t = (52 - 48)/2 = 2$.
4. Critical value, from a t-table at $df = 15$ with 0.025 in each tail: $t_{0.025,15} = 2.131$.
5. Decision: $|2| < 2.131$, so fail to reject $H_0$.

The p-value is about 0.064, above 0.05, which agrees. A 95% confidence interval also agrees: $52 \pm 2.131 \times 2 = (47.74,\ 56.26)$ contains 48.

"Fail to reject" means the data show no clear difference. It does not prove $\mu = 48$.

```figure
const C = 0.39233;                  // t density constant for df = 15
const f = t => C * Math.pow(1 + t * t / 15, -8);
const crit = 2.131;                 // two-sided 5% critical value, df = 15
const obs = 2;                      // observed t

export default function () {
  return (
    <Plot id="tdist" x={[-5, 5]} y={[0, 0.45]} xLabel="t" yLabel="density">
      <Fn id="pdf" f={f} label="t, df = 15" />
      <Region id="left" top="pdf" from={-5} to={-crit} group="Reject H0" />
      <Region id="right" top="pdf" from={crit} to={5} group="Reject H0" />
      <Segment id="crit-l" from={[-crit, 0]} to={[-crit, f(crit)]} label="-2.131" />
      <Segment id="crit-r" from={[crit, 0]} to={[crit, f(crit)]} label="2.131" />
      <Segment id="obs" from={[obs, 0]} to={[obs, f(obs)]} label="t = 2" state="active" />
    </Plot>
  );
}
```

The test assumes random sampling and roughly normal data. With small $n$, strong skew, or outliers, the p-value and critical value can mislead.

Not checked: whether your raw data are roughly normal, since you gave only summary numbers. The p-value is approximate from the t-table; software gives the exact value.