A one-sample *t*-test checks whether a sample gives enough evidence that its population mean differs from a proposed value. Here, the sample mean is 4 points above the value in the null hypothesis.

For a two-sided test, calculate the test statistic and compare its size with the critical *t* value:

$$t = \frac{\bar{x}-\mu_0}{s/\sqrt{n}}$$

Here, $\bar{x}=52$ is the sample mean, $\mu_0=48$ is the null mean, $s=8$ is the sample standard deviation, and $n=16$ is the sample size. The degrees of freedom are $n-1=15$.

1. **Find the standard error:** $s/\sqrt{n}=8/\sqrt{16}=2$.
2. **Calculate the test statistic:** $t=(52-48)/2=2$.
3. **Compare with the cutoff:** At the 5% level, the two-sided critical values for 15 degrees of freedom are about $-2.131$ and $2.131$. Since $2$ is between them, **do not reject $H_0$**. The two-sided *p*-value is about $0.064$, above $0.05$.

The sample mean is higher than 48, but the evidence is not strong enough to conclude that the population mean differs from 48 at the 5% level. This test assumes independent observations and, with this small sample, a population that is approximately normal.

```figure
export default function () {
  const steps = [
    { active: 'hyp', text: 'Start with the null claim: $\\mu=48$.' },
    { active: 'se', text: 'The standard error is $8/\\sqrt{16}=2$.' },
    { active: 't', text: 'The observed statistic is $t=(52-48)/2=2$ with 15 degrees of freedom.' },
    { active: 'decision', text: '$2$ lies inside the cutoffs $\\pm 2.131$, so do not reject $H_0$.' }
  ];
  return <Figure steps={steps} caption={step => step.text} render={step => (
    <Row gap="sm" align="center">
      <Seq id="test-steps" title="Test steps" index
        items={[
          { id: 'hyp', label: 'Null claim' },
          { id: 'se', label: 'Standard error' },
          { id: 't', label: 'Test statistic' },
          { id: 'decision', label: 'Decision' }
        ]}
        states={{
          hyp: step.active === 'hyp' ? 'active' : 'done',
          se: step.active === 'se' ? 'active' : (step.active === 'hyp' ? 'dim' : 'done'),
          t: step.active === 't' ? 'active' : (step.active === 'hyp' || step.active === 'se' ? 'dim' : 'done'),
          decision: step.active === 'decision' ? 'active' : 'dim'
        }} />
    </Row>
  )} />;
}
```

@Quiz(id="t-test-check", question="At the 5% level, what would you conclude if the test statistic were 2.5, with the same 15 degrees of freedom?", options={["Reject H₀", "Do not reject H₀"]}, correct="Reject H₀", explanation="2.5 is beyond the critical value 2.131 in absolute size.")

