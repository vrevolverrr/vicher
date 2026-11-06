```figure
export default function () {
  return (
    <Plot x={[0, 6]} y={[0, 125]} xLabel="Cash flow step" yLabel="Amount ($k)">
      <Region from={0} to={1} top={80} label="Net income" />
      <Region from={1} to={2} base={80} top={110} label="Depreciation +30" />
      <Region from={2} to={3} base={85} top={110} label="Receivables −25" />
      <Region from={3} to={4} base={85} top={95} label="Inventory +10" />
      <Region from={4} to={5} base={95} top={110} label="Payables +15" />
      <Region from={5} to={6} top={110} label="Operating cash flow" />
    </Plot>
  );
}
```

Operating cash flow is **$110k**.

