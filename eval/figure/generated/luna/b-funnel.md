```figure
export default function () {
  return (
    <Column gap="md">
      <Table
        title="Sales funnel"
        columns={["Stage", "People", "Conversion from previous stage"]}
        rows={[
          ["Visitors", "10,000", "—"],
          ["Sign-ups", "2,400", "24%"],
          ["Trials", "900", "37.5%"],
          ["Customers", "300", "33.3%"],
          ["Renewals", "120", "40%"],
        ]}
      />
      <Text>Overall: **3%** of visitors become customers; **1.2%** become renewals.</Text>
    </Column>
  );
}
```

