A **Markov chain** is a sequence of states where tomorrow's state depends only on today's state. Here the states are Sunny, Cloudy and Rainy, and the chances stay the same every day.

The chances go in a **transition matrix** $P$. Each row is today's weather, each column is tomorrow's, and each row sums to 1.

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

Let $\pi_n$ be the row vector of probabilities (Sunny, Cloudy, Rainy) on day $n$. The next day's probabilities follow this rule:

$$\pi_{n+1} = \pi_n P$$

Start sunny, so $\pi_0 = (1, 0, 0)$. Day 1 is the Sunny row of $P$: $\pi_1 = (0.6, 0.3, 0.1)$.

For day 2, the Sunny entry adds each day-1 probability times its chance of moving to Sunny:

$$P(\text{Sunny on day 2}) = 0.6(0.6) + 0.3(0.3) + 0.1(0.2) = 0.47$$

Repeat this for each state and each day:

| Day | Sunny | Cloudy | Rainy |
|---|---|---|---|
| 0 | 1.000 | 0.000 | 0.000 |
| 1 | 0.600 | 0.300 | 0.100 |
| 2 | 0.470 | 0.340 | 0.190 |
| 3 | 0.422 | 0.353 | 0.225 |
| 4 | 0.404 | 0.358 | 0.238 |
| 5 | 0.397 | 0.360 | 0.243 |

Sunny falls and Rainy rises, and each day's change is smaller than the one before. The model holds only while the same chances apply every day.