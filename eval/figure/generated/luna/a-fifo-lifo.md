**FIFO** sells the oldest inventory first; **LIFO** sells the newest first. The sale costs are:

| Sale | FIFO cost | LIFO cost |
|---|---:|---:|
| Sell 120 | $1,240 = 100 × $10 + 20 × $12 | $1,440 = 120 × $12 |
| Sell 150 | $1,820 = 130 × $12 + 20 × $13 | $1,880 = 80 × $13 + 70 × $12 |
| **Total cost of goods sold** | **$3,060** | **$3,320** |

After both sales, FIFO leaves 60 units at $13, worth **$780**. LIFO leaves 100 units at $10 and 40 at $12, worth **$1,480**.

```figure
const steps = [
  {
    text: 'After the two purchases: both methods have the same inventory.',
    fifo: [['a', '100 @ $10'], ['b', '150 @ $12']],
    lifo: [['a', '100 @ $10'], ['b', '150 @ $12']]
  },
  {
    text: 'After selling 120: FIFO uses 100 from the oldest lot and 20 from the next; LIFO uses 120 from the newest lot.',
    fifo: [['b', '130 @ $12']],
    lifo: [['a', '100 @ $10'], ['b', '30 @ $12']]
  },
  {
    text: 'After buying 80 at $13, the new lot is added to both inventories.',
    fifo: [['b', '130 @ $12'], ['c', '80 @ $13']],
    lifo: [['a', '100 @ $10'], ['b', '30 @ $12'], ['c', '80 @ $13']]
  },
  {
    text: 'After selling 150: FIFO leaves 60 at $13; LIFO leaves 100 at $10 and 40 at $12.',
    fifo: [['c', '60 @ $13']],
    lifo: [['a', '100 @ $10'], ['b', '40 @ $12']]
  }
];

export default function () {
  return (
    <Figure
      steps={steps}
      caption={step => step.text}
      render={step => (
        <Column gap="md">
          <Seq title="FIFO inventory" items={step.fifo.map(([id, label]) => ({ id: `fifo-${id}`, label }))} />
          <Seq title="LIFO inventory" items={step.lifo.map(([id, label]) => ({ id: `lifo-${id}`, label }))} />
        </Column>
      )}
    />
  );
}
```

