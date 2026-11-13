FIFO uses the oldest purchase costs first; LIFO uses the newest costs first. The first sale costs $1,240 under FIFO and $1,440 under LIFO. After both sales, total cost of goods sold is **$3,060 under FIFO** and **$3,240 under LIFO**.

```figure
const purchases = [
  { type: 'buy', qty: 100, price: 10 },
  { type: 'buy', qty: 150, price: 12 },
  { type: 'sell', qty: 120 },
  { type: 'buy', qty: 80, price: 13 },
  { type: 'sell', qty: 150 }
];

function run(method) {
  const layers = [];
  let total = 0;
  const steps = [];

  for (const tx of purchases) {
    let saleCost = 0;
    if (tx.type === 'buy') {
      layers.push({ qty: tx.qty, price: tx.price });
    } else {
      let remaining = tx.qty;
      while (remaining > 0) {
        const index = method === 'FIFO' ? 0 : layers.length - 1;
        const layer = layers[index];
        const used = Math.min(remaining, layer.qty);
        saleCost += used * layer.price;
        layer.qty -= used;
        remaining -= used;
        if (layer.qty === 0) layers.splice(index, 1);
      }
      total += saleCost;
    }
    steps.push({
      layers: layers.map(layer => ({ ...layer })),
      saleCost,
      total
    });
  }
  return steps;
}

const fifo = run('FIFO');
const lifo = run('LIFO');
const steps = purchases.map((tx, i) => ({
  text: tx.type === 'buy'
    ? `Buy ${tx.qty} at $${tx.price}.`
    : `Sell ${tx.qty}; FIFO cost $${fifo[i].saleCost}, LIFO cost $${lifo[i].saleCost}.`,
  fifo: fifo[i],
  lifo: lifo[i]
}));

function showLayers(layers) {
  return layers.length
    ? layers.map(layer => `${layer.qty} @ $${layer.price}`).join(', ')
    : 'None';
}

export default function () {
  return (
    <Figure steps={steps} caption={step => step.text} render={step => (
      <Table
        title="Inventory after transaction"
        columns={['Method', 'Remaining layers (oldest first)', 'Sale cost', 'Cumulative cost']}
        rows={[
          ['FIFO', showLayers(step.fifo.layers), step.fifo.saleCost || '—', step.fifo.total],
          ['LIFO', showLayers(step.lifo.layers), step.lifo.saleCost || '—', step.lifo.total]
        ]}
        rowIds={['fifo', 'lifo']}
      />
    )} />
  );
}
```

| Method | Cost of first sale | Cost of second sale | Total cost of goods sold | Ending inventory |
|---|---:|---:|---:|---|
| FIFO | $1,240 | $1,820 | **$3,060** | 60 units at $13 = **$780** |
| LIFO | $1,440 | $1,800 | **$3,240** | 60 units at $10 = **$600** |

