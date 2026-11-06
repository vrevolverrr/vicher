Because the disease is rare, the many healthy people tested produce more false positives than the few sick people produce true positives.

Imagine testing 10,000 people:

```figure
export default function () {
  return (
    <Table
      title="10,000 people tested"
      columns={["", "Positive test", "Negative test", "Total"]}
      rows={[
        ["Have disease", 95, 5, 100],
        ["No disease", 990, 8910, 9900],
        ["Total", 1085, 8915, 10000],
      ]}
    />
  );
}
```

Of the 100 people with the disease, 95 test positive. Of the 9,900 without it, 10% test positive too, giving 990 false alarms. So only 95 of the 1,085 positive results are true positives:

$$
\frac{95}{95+990} \approx 8.8\%
$$

Thus, a positive test is about **91.2% likely to be a false alarm** in this population. This assumes the test’s sensitivity and specificity apply to the people being tested.

