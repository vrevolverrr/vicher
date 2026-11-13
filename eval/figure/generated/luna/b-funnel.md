Each conversion rate is the number reaching a stage divided by the number at the previous stage.

$$\text{Conversion rate}=\frac{\text{current stage}}{\text{previous stage}}\times100\%$$

```figure
const stages = [
  { id: 'visitors', name: 'Visitors', count: 10000 },
  { id: 'signups', name: 'Sign-ups', count: 2400 },
  { id: 'trials', name: 'Trials', count: 900 },
  { id: 'customers', name: 'Customers', count: 300 },
  { id: 'renewals', name: 'Renewals', count: 120 }
];

const percent = value =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

export default function () {
  return (
    <Column gap="md">
      <Row gap="sm" align="center">
        {stages.map((stage, i) => (
          <>
            <Node
              id={stage.id}
              label={stage.count.toLocaleString('en-US')}
              sub={i === 0
                ? stage.name
                : `${stage.name} · ${percent(stage.count / stages[i - 1].count * 100)}`}
            />
            {i < stages.length - 1 && (
              <Arrow from={stage.id} to={stages[i + 1].id} />
            )}
          </>
        ))}
      </Row>
      <Text>
        Overall: {percent(stages[3].count / stages[0].count * 100)} of visitors became
        customers; {percent(stages[4].count / stages[0].count * 100)} reached renewal.
      </Text>
    </Column>
  );
}
```

