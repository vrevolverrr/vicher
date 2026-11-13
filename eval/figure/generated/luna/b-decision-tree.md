The launch option has an expected value of **$48,000**, so launch; not launching is worth $0. The launch outcomes are $100,000 net ($150,000 − $50,000) with 60% probability, or −$30,000 net ($20,000 − $50,000) with 40% probability.

$$
EV(\text{launch}) = 0.6(100{,}000) + 0.4(-30{,}000) = 48{,}000
$$

```figure
export default function () {
  return (
    <Graph
      nodes={[
        { id: 'decision', label: 'Decision', sub: 'Best value: $48,000' },
        { id: 'launch', label: 'Launch', sub: 'EV: $48,000' },
        { id: 'skip', label: 'Do not launch', sub: '$0' },
        { id: 'success', label: '$100,000 net' },
        { id: 'failure', label: '−$30,000 net' },
      ]}
      edges={[
        { id: 'choose-launch', from: 'decision', to: 'launch', label: 'Launch', directed: true },
        { id: 'choose-skip', from: 'decision', to: 'skip', label: 'Do not launch', directed: true },
        { id: 'outcome-success', from: 'launch', to: 'success', label: '60%', directed: true },
        { id: 'outcome-failure', from: 'launch', to: 'failure', label: '40%', directed: true },
      ]}
    />
  );
}
```

