Only about 9 in 100 positive results are real. The healthy group is so large that its small error rate produces more positives than the sick group does.

**Positive predictive value** is the chance that a person with a positive test has the disease. Bayes' theorem gives it:

$$P(D \mid +) = \frac{P(+ \mid D)\,P(D)}{P(+ \mid D)\,P(D) + P(+ \mid \neg D)\,P(\neg D)}$$

Here $D$ means "has the disease" and $+$ means "test positive". $P(D) = 0.01$ is the prevalence, $P(+ \mid D) = 0.95$ is the sensitivity, and $P(+ \mid \neg D) = 0.10$ is the false-positive rate, which is 1 minus the specificity. The formula assumes people are tested at random from the population that has 1% prevalence.

Take 10,000 people:

- **Sick:** $10{,}000 \times 0.01 = 100$. The test catches $0.95 \times 100 = 95$ and misses 5.
- **Healthy:** $9{,}900$. The test wrongly flags $0.10 \times 9{,}900 = 990$.

| | Has disease | No disease | Total |
|---|---|---|---|
| Test positive | 95 | 990 | 1,085 |
| Test negative | 5 | 8,910 | 8,915 |
| Total | 100 | 9,900 | 10,000 |

$$P(D \mid +) = \frac{95}{95 + 990} = \frac{95}{1085} \approx 0.088$$

A positive result means an 8.8% chance of disease. The other 91.2% of positives, 990 of 1,085, are false alarms.

The false alarms outnumber the true ones about 10 to 1 because 99 healthy people are tested for every sick person. A better test lowers the false-positive rate, but low prevalence drives the result. The same formula gives about 51% at 10% prevalence.