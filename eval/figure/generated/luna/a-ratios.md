A ratio dashboard compares related financial statement values over time. Each ratio divides one measure by another. The current ratio, for example, is current assets divided by current liabilities: in Year 1, $400 / 200 = 2.00$.

| Ratio | Calculation | Year 1 | Year 2 | Year 3 |
|---|---|---:|---:|---:|
| Current ratio | Current assets ÷ current liabilities | 2.00 | 1.50 | 1.31 |
| Quick ratio | (Current assets − inventory) ÷ current liabilities | 1.25 | 0.83 | 0.69 |
| Net profit margin | Net income ÷ revenue | 10.00% | 6.92% | 3.13% |
| Return on assets | Net income ÷ total assets | 6.67% | 4.50% | 1.90% |
| Return on equity | Net income ÷ equity | 12.00% | 8.65% | 3.92% |

```figure
function interpolate(x, values) {
  const i = Math.max(0, Math.min(1, Math.floor(x) - 1));
  const t = x - (i + 1);
  return values[i] + t * (values[i + 1] - values[i]);
}

export default function () {
  return (
    <Figure steps={[{}]} title="Three-year ratio trends" render={() => (
      <Row gap="lg">
        <Plot id="liquidity" x={[1, 3]} y={[0, 2.1]} xLabel="Year" yLabel="Ratio (times)">
          <Fn id="current" f={x => interpolate(x, [2, 1.5, 1.31])} from={1} to={3} label="Current ratio" />
          <Fn id="quick" f={x => interpolate(x, [1.25, 0.83, 0.69])} from={1} to={3} label="Quick ratio" />
        </Plot>
        <Plot id="profitability" x={[1, 3]} y={[0, 12]} xLabel="Year" yLabel="Percent">
          <Fn id="margin" f={x => interpolate(x, [10, 6.92, 3.13])} from={1} to={3} label="Net profit margin" />
          <Fn id="roa" f={x => interpolate(x, [6.67, 4.5, 1.9])} from={1} to={3} label="Return on assets" />
          <Fn id="roe" f={x => interpolate(x, [12, 8.65, 3.92])} from={1} to={3} label="Return on equity" />
        </Plot>
      </Row>
    )} />
  );
}
```

All five ratios declined across the three years. The quick ratio fell below 1 in Year 2, meaning quick assets were less than current liabilities.

