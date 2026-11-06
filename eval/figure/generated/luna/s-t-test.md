A one-sample *t*-test checks whether a sample gives enough evidence that its population mean differs from a stated value. Here the null says the mean is 48, and the two-sided alternative says it is not 48.

1. **Set the hypotheses and cutoff.** $H_0:\mu=48$; $H_1:\mu\ne48$. The significance level is $\alpha=0.05$.
2. **Find the standard error and test statistic.** The standard error is the estimated spread of sample means:

$$
SE=\frac{s}{\sqrt{n}}=\frac{8}{\sqrt{16}}=2
$$

$$
t=\frac{\bar{x}-\mu_0}{SE}=\frac{52-48}{2}=2
$$

3. **Find the degrees of freedom.** For a one-sample *t*-test, $df=n-1=15$. At 5% significance, two-sided, the critical values are about $-2.131$ and $2.131$.
4. **Decide.** The observed $t=2$ is between the critical values, so **fail to reject $H_0$**. The two-sided *p*-value is about $0.064$, above $0.05$. This sample does not provide sufficient evidence at the 5% level that the population mean differs from 48.

```figure
const steps = [
  { heading: 'Set the hypotheses', body: '$H_0: \\mu=48$; $H_1: \\mu\\ne48$. Use $\\alpha=0.05$.' },
  { heading: 'Calculate the test statistic', body: '$SE=8/\\sqrt{16}=2$, so $t=(52-48)/2=2$.' },
  { heading: 'Set the reference values', body: '$df=16-1=15$. The two-sided critical values are about $\\pm2.131$.' },
  { heading: 'Make the decision', body: '$|t|=2<2.131$ and $p\\approx0.064>0.05$: fail to reject $H_0$.' }
];

export default function () {
  return (
    <Figure
      steps={steps}
      title="One-sample t-test"
      heading={step => step.heading}
      caption={step => step.body}
      render={step => (
        <Panel id="test-step" title={step.heading}>
          <Text id="step-detail">{step.body}</Text>
        </Panel>
      )}
    />
  );
}
```

This test assumes the observations are independent and the sample is random; with only 16 observations, the population should be reasonably close to normal.

