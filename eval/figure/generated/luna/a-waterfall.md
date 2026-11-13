Operating cash flow is **$110k**: $80k net income + $30k depreciation − $25k receivables + $10k inventory + $15k payables.

```figure
export default function () {
  return (
    <Plot id="waterfall" x={[0, 5]} y={[-18, 125]} xLabel="Adjustment" yLabel="$ thousands">
      <Region id="net-income" top={80} from={0.15} to={0.85} label="Net income: $80k" />
      <Region id="depreciation" top={110} base={80} from={1.15} to={1.85} label="Depreciation: +$30k" />
      <Region id="receivables" top={110} base={85} from={2.15} to={2.85} label="Receivables: −$25k" />
      <Region id="inventory" top={95} base={85} from={3.15} to={3.85} label="Inventory: +$10k" />
      <Region id="payables" top={110} base={95} from={4.15} to={4.85} label="Payables: +$15k" />
      <Label at={[0.5, -10]} text="Net income" />
      <Label at={[1.5, -10]} text="Depreciation" />
      <Label at={[2.5, -10]} text="Receivables" />
      <Label at={[3.5, -10]} text="Inventory" />
      <Label at={[4.5, -10]} text="Payables" />
      <Label at={[4.5, 115]} text="Operating cash flow: $110k" />
    </Plot>
  );
}
```

