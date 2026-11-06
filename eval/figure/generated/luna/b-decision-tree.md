Subtract the $50k launch cost from either revenue outcome: launching pays $100k with 60% probability or loses $30k with 40% probability. Its expected value is $48k, so launching has the higher expected value than not launching ($0).

$$
EV = \sum_i p_i \times \text{payoff}_i
$$

```figure
export default function () {
  return (
    <Graph
      nodes={[
        { id: 'decision', label: 'Decision', sub: 'Choose an option' },
        { id: 'launch', label: 'Launch', sub: 'EV = $48k' },
        { id: 'no_launch', label: 'Do not launch', sub: 'EV = $0' },
        { id: 'success', label: '+$100k', sub: '60% chance' },
        { id: 'failure', label: '−$30k', sub: '40% chance' },
      ]}
      edges={[
        { id: 'e1', from: 'decision', to: 'launch', label: 'Launch', directed: true },
        { id: 'e2', from: 'decision', to: 'no_launch', label: 'Do not launch', directed: true },
        { id: 'e3', from: 'launch', to: 'success', label: '60%', directed: true },
        { id: 'e4', from: 'launch', to: 'failure', label: '40%', directed: true },
      ]}
    />
  );
}
```

For launch: $0.6 \times 100 - 0.4 \times 30 = 48$ (thousand dollars).

