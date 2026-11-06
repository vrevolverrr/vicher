Start at Sunny: $\pi_0 = (1, 0, 0)$. Each day, multiply the row vector by $P$: $\pi_{n+1} = \pi_n P$.

```mermaid
stateDiagram-v2
    direction LR
    Sunny --> Sunny: 0.6
    Sunny --> Cloudy: 0.3
    Sunny --> Rainy: 0.1
    Cloudy --> Sunny: 0.3
    Cloudy --> Cloudy: 0.4
    Cloudy --> Rainy: 0.3
    Rainy --> Sunny: 0.2
    Rainy --> Cloudy: 0.4
    Rainy --> Rainy: 0.4
```

Day 2 from day 1 (Sunny row of $P$ weighted by day 1):

$$\pi_2 = (0.6,\ 0.3,\ 0.1)\begin{pmatrix}0.6&0.3&0.1\\0.3&0.4&0.3\\0.2&0.4&0.4\end{pmatrix}$$

Sunny: $0.6(0.6) + 0.3(0.3) + 0.1(0.2) = 0.47$. Cloudy and Rainy use the same column sums: $0.34$ and $0.19$.

| Day | Sunny | Cloudy | Rainy |
|----:|------:|-------:|------:|
| 0 | 1.0000 | 0.0000 | 0.0000 |
| 1 | 0.6000 | 0.3000 | 0.1000 |
| 2 | 0.4700 | 0.3400 | 0.1900 |
| 3 | 0.4220 | 0.3530 | 0.2250 |
| 4 | 0.4041 | 0.3578 | 0.2381 |
| 5 | 0.3974 | 0.3596 | 0.2430 |

Each row sums to 1. The chain is regular (every entry is positive), so the distribution converges to the stationary solution of $\pi = \pi P$, about $(0.393, 0.361, 0.246)$, or $(24, 22, 15)/61$.

Skipped: a chart, since the table already gives the series. Not checked: a numerical solver; the arithmetic was done by hand and each row was checked to sum to 1.