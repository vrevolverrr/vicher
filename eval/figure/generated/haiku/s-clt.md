The Central Limit Theorem says that the average of many draws looks roughly normal, even when the population the draws come from is skewed. Each sample mean $\bar{x}$ is one number. Collect many of them and their histogram becomes a bell curve as the sample size $n$ grows.

The figure uses an exponential population with $\mu = 1$ and $\sigma = 1$. Its skewness is 2, so it is far from normal. The exact curve for the sample mean is drawn in colour. Move the slider to change $n$.

## The formula

For independent draws with mean $\mu$ and standard deviation $\sigma$, the sample mean is approximately normal when $n$ is large:

$$\bar{x} \approx N\!\left(\mu,\ \frac{\sigma^2}{n}\right)$$

Here $\mu$ is the population mean, $\sigma$ is the population standard deviation, and $n$ is the sample size. The spread of $\bar{x}$ is $\sigma/\sqrt{n}$, so it shrinks as $n$ grows.

## Worked example, n = 4

Here $\mu = 1$ and $\sigma = 1$, so $\bar{x} \approx N(1, 0.5^2)$. Find $P(\bar{x} > 1.5)$.

- Normal approximation: $z = (1.5 - 1)/0.5 = 1$, so $P \approx 0.1587$.
- Exact value, from the Gamma distribution of the sum: $P = 61e^{-6} \approx 0.1512$.

The approximation is close but not exact. At $n = 4$ the skewness of $\bar{x}$ is still $2/\sqrt{4} = 1$.

The theorem fails when the variance is infinite, as it is for the Cauchy distribution.

Not run: I did not render the figure. The $n = 4$ values were worked by hand.