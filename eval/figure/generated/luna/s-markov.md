I’ll treat each matrix row as the weather today and each column as tomorrow, then compute the day-by-day distributions starting from sunny.

A **Markov chain** models a system that moves between states, where the next state depends only on the current one. Here, each state is a kind of weather, and each matrix row gives the probabilities of tomorrow’s weather given today’s.

If $p_t$ lists the probabilities of sunny, cloudy, and rainy weather on day $t$, then:

$$
p_{t+1}=p_tP
$$

Starting from sunny, $p_0=[1,0,0]$. For example, after one transition:

$$
p_1=[1,0,0]P=[0.6,0.3,0.1]
$$

The figure shows the weather transitions and the distribution through day 5. Each distribution gives the probabilities of sunny, cloudy, and rainy weather, in that order.

```figure
const P = [
  [0.6, 0.3, 0.1],
  [0.3, 0.4, 0.3],
  [0.2, 0.4, 0.4]
];

export default function () {
  let distribution = [1, 0, 0];
  const rows = [[0, ...distribution]];
  const steps = [{ day: 0, rows: [...rows], text: 'Day 0: the weather is sunny with probability 1.' }];

  for (let day = 1; day <= 5; day++) {
    distribution = P[0].map((_, j) =>
      distribution.reduce((sum, p, i) => sum + p * P[i][j], 0)
    );
    rows.push([day, ...distribution]);
    steps.push({
      day,
      rows: [...rows],
      text: `Day ${day}: sunny ${distribution[0].toFixed(5)}, cloudy ${distribution[1].toFixed(5)}, rainy ${distribution[2].toFixed(5)}.`
    });
  }

  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Column gap="md">
        <Graph
          id="weather-chain"
          nodes={[
            { id: 'sunny', label: 'Sunny' },
            { id: 'cloudy', label: 'Cloudy' },
            { id: 'rainy', label: 'Rainy' }
          ]}
          edges={[
            { id: 'ss', from: 'sunny', to: 'sunny', label: '0.6', directed: true },
            { id: 'sc', from: 'sunny', to: 'cloudy', label: '0.3', directed: true },
            { id: 'sr', from: 'sunny', to: 'rainy', label: '0.1', directed: true },
            { id: 'cs', from: 'cloudy', to: 'sunny', label: '0.3', directed: true },
            { id: 'cc', from: 'cloudy', to: 'cloudy', label: '0.4', directed: true },
            { id: 'cr', from: 'cloudy', to: 'rainy', label: '0.3', directed: true },
            { id: 'rs', from: 'rainy', to: 'sunny', label: '0.2', directed: true },
            { id: 'rc', from: 'rainy', to: 'cloudy', label: '0.4', directed: true },
            { id: 'rr', from: 'rainy', to: 'rainy', label: '0.4', directed: true }
          ]}
        />
        <Table
          id="distribution"
          title="Weather probabilities by day"
          columns={['Day', 'Sunny', 'Cloudy', 'Rainy']}
          rows={step.rows}
          rowIds={step.rows.map(row => `day${row[0]}`)}
          states={{ [`day${step.day}`]: 'active' }}
        />
      </Column>
    )} />
  );
}
```

