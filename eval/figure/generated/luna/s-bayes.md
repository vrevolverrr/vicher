Imagine testing 10,000 people. With 1% prevalence, 100 have the disease and 9,900 do not.

| Group | Test positive | Test negative |
|---|---:|---:|
| Have disease (100) | 95 | 5 |
| Don’t have disease (9,900) | 990 | 8,910 |

Sensitivity means 95% of people with the disease test positive. Specificity means 90% of people without it test negative, so 10% of them test positive by mistake.

That gives 1,085 positive results, but only 95 are true positives. So about **91% of positive tests are false alarms**:

$$
\frac{990}{95 + 990} \approx 91.2\%
$$

The key is that the disease is rare: the much larger group without the disease produces more false positives, even though each person in that group has only a 10% chance of one.

