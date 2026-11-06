A **balance sheet** is a snapshot of what a company owns and owes. It must balance: the company’s assets equal its liabilities plus its owners’ equity.

$$\text{Assets} = \text{Liabilities} + \text{Equity}$$

Suppose the company starts with $10,000 cash, $30,000 in other assets, $12,000 existing debt, and $28,000 equity. It borrows $20,000, then spends $15,000 of that cash on a machine.

```figure
export default function () {
  const steps = [
    {
      cash: 10000, machine: 0, other: 30000,
      oldDebt: 12000, loan: 0, equity: 28000,
      caption: 'Before borrowing: assets and liabilities plus equity both total $40,000.'
    },
    {
      cash: 30000, machine: 0, other: 30000,
      oldDebt: 12000, loan: 20000, equity: 28000,
      caption: 'After borrowing: cash and the new loan each rise by $20,000.'
    },
    {
      cash: 15000, machine: 15000, other: 30000,
      oldDebt: 12000, loan: 20000, equity: 28000,
      caption: 'After buying the machine: $15,000 shifts from cash to equipment.'
    }
  ];

  return (
    <Figure steps={steps} caption={step => step.caption} render={step => {
      const assets = step.cash + step.machine + step.other;
      const liabilities = step.oldDebt + step.loan;
      return (
        <Table
          title="Balance sheet ($)"
          columns={['Account', 'Amount']}
          rows={[
            ['Cash', step.cash],
            ['Machine', step.machine],
            ['Other assets', step.other],
            ['Total assets', assets],
            ['Existing debt', step.oldDebt],
            ['New loan', step.loan],
            ['Total liabilities', liabilities],
            ['Equity', step.equity],
            ['Liabilities + equity', liabilities + step.equity]
          ]}
        />
      );
    }} />
  );
}
```

After both transactions, assets total $60,000, matching $32,000 liabilities plus $28,000 equity.

