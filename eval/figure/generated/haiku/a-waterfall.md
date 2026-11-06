Operating cash flow is **$110k**.

```figure
const bars = [
  { name: 'Net income', from: 0, to: 80, group: 'Total' },
  { name: 'Depreciation', from: 80, to: 110, group: 'Adds to cash' },
  { name: 'Receivables', from: 110, to: 85, group: 'Uses cash' },
  { name: 'Inventory', from: 85, to: 95, group: 'Adds to cash' },
  { name: 'Payables', from: 95, to: 110, group: 'Adds to cash' },
  { name: 'Op. cash flow', from: 0, to: 110, group: 'Total' },
];
const deltas = ['', '+30', '-25', '+10', '+15', ''];

export default function () {
  return (
    <Plot id="waterfall" x={[-0.6, 5.6]} y={[-18, 125]} yLabel="$k">
      {bars.map((b, i) => (
        <>
          <Region id={`bar-${i}`} top={Math.max(b.from, b.to)} base={Math.min(b.from, b.to)} from={i - 0.35} to={i + 0.35} group={b.group} />
          <Label id={`name-${i}`} at={[i, -8]} text={b.name} />
          <Label id={`val-${i}`} at={[i, Math.max(b.from, b.to) + 6]} text={deltas[i] || String(b.to)} />
        </>
      ))}
    </Plot>
  );
}
```

$80 + 30 - 25 + 10 + 15 = 110$

Skipped: a legend for the bar colors beyond the group names, and axis ticks. Not checked: label overlap at narrow pane widths, since I cannot render the figure here.