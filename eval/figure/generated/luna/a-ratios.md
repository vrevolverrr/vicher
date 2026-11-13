Financial ratios compare related figures, so changes in company size are easier to account for. Here are the three-year results; “Year 1–3” follows the order of your figures.

```figure
export default function () {
  return (
    <Table
      title="Three-Year Ratio Dashboard"
      columns={["Ratio", "Calculation", "Year 1", "Year 2", "Year 3"]}
      rows={[
        ["Current ratio", "Current assets ÷ current liabilities", "2.00", "1.50", "1.31"],
        ["Quick ratio", "(Current assets − inventory) ÷ current liabilities", "1.25", "0.83", "0.69"],
        ["Net profit margin", "Net income ÷ revenue", "10.00%", "6.92%", "3.13%"],
        ["Asset turnover", "Revenue ÷ total assets", "0.67×", "0.65×", "0.61×"],
        ["Return on equity", "Net income ÷ equity", "12.00%", "8.65%", "3.92%"],
      ]}
    />
  );
}
```

The ratios decline across all five measures. For example, Year 3’s quick ratio is $(380-180) \div 290 \approx 0.69$. The figures don’t include total liabilities, so a total debt-to-equity ratio can’t be calculated.

