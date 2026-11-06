Operating cash flow is **$110k**: $80k + $30k − $25k + $10k + $15k.

```figure
export default function () {
  return (
    <Plot id="waterfall" x={[0, 7]} y={[0, 125]} xLabel="Adjustment" yLabel="Cash ($k)">
      <Region id="income" top={80} base={0} from={0.5} to={1.3} label="Net income" group="total" />
      <Region id="depreciation" top={110} base={80} from={1.5} to={2.3} label="Depreciation" group="increase" />
      <Region id="receivables" top={110} base={85} from={2.5} to={3.3} label="Receivables up" group="decrease" />
      <Region id="inventory" top={95} base={85} from={3.5} to={4.3} label="Inventory down" group="increase" />
      <Region id="payables" top={110} base={95} from={4.5} to={5.3} label="Payables up" group="increase" />
      <Region id="ocf" top={110} base={0} from={5.5} to={6.3} label="Operating cash flow" group="total" />

      <Segment from={[1.3, 80]} to={[1.5, 80]} />
      <Segment from={[2.3, 110]} to={[2.5, 110]} />
      <Segment from={[3.3, 85]} to={[3.5, 85]} />
      <Segment from={[4.3, 95]} to={[4.5, 95]} />
      <Segment from={[5.3, 110]} to={[5.5, 110]} />

      <Label at={[0.9, 84]} text="$80k" />
      <Label at={[1.7, 114]} text="+$30k" />
      <Label at={[2.65, 105]} text="−$25k" />
      <Label at={[3.65, 99]} text="+$10k" />
      <Label at={[4.65, 114]} text="+$15k" />
      <Label at={[5.75, 114]} text="$110k" />
    </Plot>
  );
}
```

