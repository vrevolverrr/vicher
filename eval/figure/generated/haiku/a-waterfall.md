Operating cash flow is **$110k**.

```figure
const bars = [
  { name: 'Net income', from: 0, to: 80, group: 'Total', text: '$80k' },
  { name: 'Depreciation', from: 80, to: 110, group: 'Increase', text: '+$30k' },
  { name: 'Receivables', from: 110, to: 85, group: 'Decrease', text: '−$25k' },
  { name: 'Inventory', from: 85, to: 95, group: 'Increase', text: '+$10k' },
  { name: 'Payables', from: 95, to: 110, group: 'Increase', text: '+$15k' },
  { name: 'Operating CF', from: 0, to: 110, group: 'Total', text: '$110k' },
];
const U = 10;        // one unit = $10k
const base = 1.5;    // y of the zero line, leaves room for names
const Y = v => base + v / U;
const pitch = 1.6, w = 1;

export default function () {
  const out = [];
  bars.forEach((b, i) => {
    const x0 = i * pitch, x1 = x0 + w, cx = x0 + w / 2;
    const lo = Y(Math.min(b.from, b.to)), hi = Y(Math.max(b.from, b.to));
    out.push(<Shape id={`bar${i}`} pts={[[x0, lo], [x1, lo], [x1, hi], [x0, hi]]} closed group={b.group} />);
    out.push(<Label id={`val${i}`} at={[cx, hi + 0.5]} text={b.text} />);
    out.push(<Label id={`name${i}`} at={[cx, 0.7]} text={b.name} />);
    if (i < bars.length - 1) out.push(<Segment id={`link${i}`} from={[x1, Y(b.to)]} to={[x1 + pitch - w, Y(b.to)]} />);
  });
  return (
    <Diagram id="waterfall" width={9.5} height={14}>
      <>{out}</>
    </Diagram>
  );
}
```

Signs used:

- Receivables up: subtract. Sales are booked but cash is not yet collected.
- Inventory down: add. Cash is freed from stock.
- Payables up: add. Cash is kept because bills are not yet paid.

Check: 80 + 30 − 25 + 10 + 15 = 110.