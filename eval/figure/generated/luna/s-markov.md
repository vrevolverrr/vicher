A **Markov chain** models a system that changes between states, where the next state depends only on the current one. Here the states are sunny, cloudy, and rainy. Each matrix row gives the probabilities of tomorrow’s weather given today’s weather.

If the current distribution is a row vector $p_t$, the next day’s distribution is:

$$
p_{t+1}=p_tP
$$

Starting sunny means $p_0=(1,0,0)$. The figure shows the transition probabilities and the distribution for each of the next five days.

```figure
const days = [
  ['1.00000', '0.00000', '0.00000'],
  ['0.60000', '0.30000', '0.10000'],
  ['0.47000', '0.34000', '0.19000'],
  ['0.42200', '0.35300', '0.22500'],
  ['0.40410', '0.35780', '0.23810'],
  ['0.39742', '0.35959', '0.24299']
];

export default function () {
  const steps = days.map((_, i) => i);
  return (
    <Figure
      steps={steps}
      caption={day => day === 0 ? 'Day 0 starts sunny.' : `After ${day} transition${day === 1 ? '' : 's'} from the sunny start.`}
      render={(day) => (
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
            id="distributions"
            title="Weather probabilities by day"
            columns={['Day', 'Sunny', 'Cloudy', 'Rainy']}
            rows={days.slice(0, day + 1).map((row, i) => [`${i}`, ...row])}
            rowIds={days.slice(0, day + 1).map((_, i) => `day${i}`)}
            states={{
              ...Object.fromEntries(Array.from({ length: day }, (_, i) => [`day${i}`, 'done'])),
              [`day${day}`]: 'active'
            }}
          />
        </Column>
      )}
    />
  );
}
```

