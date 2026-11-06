The dashboard shows weakening liquidity and profitability across the three years.

```figure
export default function () {
  return (
    <Table
      title="Three-year ratio dashboard"
      columns={["Ratio", "Year 1", "Year 2", "Year 3"]}
      rows={[
        ["Current ratio", "2.00", "1.50", "1.31"],
        ["Quick ratio", "1.25", "0.83", "0.69"],
        ["Net profit margin", "10.0%", "6.9%", "3.1%"],
        ["Return on assets", "6.7%", "4.5%", "1.9%"],
        ["Return on equity", "12.0%", "8.7%", "3.9%"],
      ]}
    />
  );
}
```

Current and quick ratios use current liabilities; quick ratio excludes inventory. Profit margin is net income divided by revenue. ROA and ROE use the supplied total assets and equity for each year.

