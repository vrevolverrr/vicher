A balance sheet stays in balance because **assets equal liabilities plus equity**:

$$
\text{Assets} = \text{Liabilities} + \text{Equity}
$$

Assuming the company starts with no assets, debt, or equity, borrowing $20,000 adds $20,000 cash and $20,000 debt. Buying the machine then changes $15,000 of cash into equipment, leaving $5,000 cash. Total assets and debt are both $20,000.

```figure
const steps = [
  { cash: 0, machine: 0, debt: 0, text: 'Before: the company has no assets or debt.' },
  { cash: 5000, machine: 15000, debt: 20000, text: 'After: $5,000 cash and a $15,000 machine are balanced by $20,000 of debt.' }
];

export default function () {
  return <Figure steps={steps} caption={step => step.text} render={step => (
    <Table
      title="Balance sheet"
      columns={['', 'Amount']}
      rows={[
        ['Cash', step.cash],
        ['Machine', step.machine],
        ['Total assets', step.cash + step.machine],
        ['Loan payable', step.debt],
        ['Equity', 0],
        ['Liabilities + equity', step.debt]
      ]}
    />
  )} />;
}
```

