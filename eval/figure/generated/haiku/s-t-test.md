A one-sample t-test checks whether a sample mean is far enough from a claimed value $\mu_0$ that chance alone is an unlikely explanation. Because the population standard deviation $\sigma$ is unknown, you estimate it with $s$ and judge the result against a **t-distribution**.

For a sample of size $n$ with mean $\bar{x}$ and standard deviation $s$, test $H_0: \mu = \mu_0$ with

$$t = \frac{\bar{x} - \mu_0}{s/\sqrt{n}}$$

Here $s/\sqrt{n}$ is the **standard error** (SE), the typical distance of $\bar{x}$ from $\mu$ across samples. So $t$ counts how many standard errors the sample mean sits from $\mu_0$. Under $H_0$, $t$ follows a t-distribution with $df = n - 1$. Two-sided at $\alpha = 0.05$ means you reject $H_0$ when $|t|$ exceeds the critical value.

Worked example, with $n = 16$, $\bar{x} = 52$, $s = 8$, $\mu_0 = 48$:

1. Standard error:
$$SE = \frac{s}{\sqrt{n}} = \frac{8}{\sqrt{16}} = 2$$
2. Test statistic:
$$t = \frac{52 - 48}{2} = 2$$
3. Degrees of freedom: $df = 16 - 1 = 15$.
4. Critical value: a two-sided 5% t-table at $df = 15$ gives $\pm 2.131$.
5. Decision: $|2| < 2.131$, so **fail to reject $H_0$**.

The shaded tails start at $\pm 2.131$. The observed $t = 2$ falls in the unshaded middle.

```figure
export default function () {
  const nu = 15;
  const c = 0.3924;  // constant of the t(15) density
  const pdf = t => c * Math.pow(1 + t * t / nu, -(nu + 1) / 2);
  const crit = 2.131;
  return (
    <Plot id="tdist" x={[-4, 4]} y={[0, 0.45]} xLabel="$t$" yLabel="density">
      <Fn id="curve" f={pdf} from={-4} to={4} label="$t$, df = 15" />
      <Region id="left" top="curve" base={0} from={-4} to={-crit} group="reject" />
      <Region id="right" top="curve" base={0} from={crit} to={4} group="reject" />
      <Segment id="obs" from={[2, 0]} to={[2, pdf(2)]} label="$t = 2$" />
      <Label id="lo" at={[-crit, 0.02]} text="$-2.131$" />
      <Label id="hi" at={[crit, 0.02]} text="$2.131$" />
    </Plot>
  );
}
```

Two checks agree with the decision:

- **p-value:** $p \approx 0.064$ (two-sided). It is above 0.05.
- **Confidence interval:** $52 \pm 2.131 \times 2 = (47.74,\ 56.26)$. It contains 48.

"Fail to reject" means the data show no clear difference from 48. It does not prove $\mu = 48$.

The test assumes a random sample from a roughly normal population. Heavy skew or outliers make the t-values unreliable, so inspect the data first.

Not checked: the p-value is approximate (from a table or calculator, not software), and normality is assumed because no raw data was given.