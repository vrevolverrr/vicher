A conversion rate is the share of people at one stage who reach the next:

$$\text{Conversion rate}=\frac{\text{next stage count}}{\text{current stage count}}\times100\%$$

For example, $2{,}400 \div 10{,}000 = 24\%$ of visitors signed up. Overall, $120$ of $10{,}000$ visitors renewed, a $1.2\%$ conversion.

```figure
export default function () {
  return (
    <Figure
      steps={[{ visitors: 10000, signups: 2400, trials: 900, customers: 300, renewals: 120 }]}
      render={() => (
        <Graph
          title="Sales funnel"
          nodes={[
            { id: "visitors", label: "10,000", sub: "Visitors" },
            { id: "signups", label: "2,400", sub: "Sign-ups" },
            { id: "trials", label: "900", sub: "Trials" },
            { id: "customers", label: "300", sub: "Customers" },
            { id: "renewals", label: "120", sub: "Renewals" }
          ]}
          edges={[
            { id: "e1", from: "visitors", to: "signups", label: "24%" },
            { id: "e2", from: "signups", to: "trials", label: "37.5%" },
            { id: "e3", from: "trials", to: "customers", label: "33.3%" },
            { id: "e4", from: "customers", to: "renewals", label: "40%" }
          ]}
        />
      )}
    />
  );
}
```

