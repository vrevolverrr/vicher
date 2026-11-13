A **one-sample t-test** checks whether a sample provides enough evidence that its population mean differs from a chosen value. It uses the *t* distribution because the population standard deviation is unknown, so we estimate it with the sample standard deviation, $s$.

Here the hypotheses are $H_0:\mu=48$ and $H_A:\mu\ne48$. The test statistic is:

$$
t=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}
$$

Here $\bar{x}$ is the sample mean, $\mu_0$ is the mean stated in the null hypothesis, $s$ is the sample standard deviation, and $n$ is the sample size. The degrees of freedom are $n-1$.

```figure
const steps = [
  { text: 'Set up the two-sided test.', states: { setup: 'active' } },
  { text: 'Compute the test statistic and degrees of freedom.', states: { setup: 'done', compute: 'active' } },
  { text: 'Compare the statistic with the 5% cutoff.', states: { setup: 'done', compute: 'done', compare: 'active' } },
  { text: 'State the conclusion in context.', states: { setup: 'done', compute: 'done', compare: 'done', conclude: 'active' } },
];

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Graph
        nodes={[
          { id: 'setup', label: 'Hypotheses', sub: '48 vs. not 48' },
          { id: 'compute', label: 'Calculate', sub: 't = 2, df = 15' },
          { id: 'compare', label: 'Compare', sub: '2 < 2.131' },
          { id: 'conclude', label: 'Conclusion', sub: 'Do not reject H₀' },
        ]}
        edges={[
          { id: 'e1', from: 'setup', to: 'compute', directed: true },
          { id: 'e2', from: 'compute', to: 'compare', directed: true },
          { id: 'e3', from: 'compare', to: 'conclude', directed: true },
        ]}
        states={step.states}
      />
    )} />
  );
}
```

Substitute the sample values: the standard error is $8/\sqrt{16}=2$, so $t=(52-48)/2=2$. The degrees of freedom are $16-1=15$. For a two-sided test at 5%, the critical values are about $-2.131$ and $2.131$. Since $2$ falls between them, we **do not reject $H_0$**. The two-sided p-value is about $0.064$, above $0.05$. The sample mean is 4 points above 48, but this sample does not provide strong enough evidence at the 5% level that the population mean differs from 48.

