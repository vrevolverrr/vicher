Launching has an expected value of **$48,000**, so it beats not launching, which has an expected value of **$0**. Expected value is the probability-weighted average of the possible net outcomes.

$$
\text{Launch EV} = 0.60(\$100{,}000) + 0.40(-\$30{,}000) = \$48{,}000
$$

The launch cost is subtracted from each outcome: $150,000 − $50,000 = $100,000$, and $20,000 − $50,000 = −$30,000$.

```figure
export default function () {
  return (
    <Graph
      nodes={[
        { id: 'decision', label: 'Decision' },
        { id: 'launch', label: 'Launch', sub: 'EV = $48k' },
        { id: 'chance', label: 'Outcome' },
        { id: 'high', label: '+$100k', sub: '60%' },
        { id: 'low', label: '−$30k', sub: '40%' },
        { id: 'skip', label: 'Do not launch', sub: 'EV = $0' },
      ]}
      edges={[
        { id: 'e1', from: 'decision', to: 'launch', label: 'Launch', directed: true },
        { id: 'e2', from: 'launch', to: 'chance', directed: true },
        { id: 'e3', from: 'chance', to: 'high', label: '60%', directed: true },
        { id: 'e4', from: 'chance', to: 'low', label: '40%', directed: true },
        { id: 'e5', from: 'decision', to: 'skip', label: 'Do not launch', directed: true },
      ]}
    />
  );
}
```

