A positive test is only strong evidence when the disease is common enough that true positives outnumber false alarms. Here, most people do not have the disease, so even a 10% false-positive rate creates many false alarms.

The **positive predictive value** is the share of positive results that come from people who have the disease:

$$
P(\text{disease}\mid +)=\frac{\text{true positives}}{\text{all positive results}}
$$

Imagine testing 10,000 people. About 100 have the disease; with 95% sensitivity, 95 test positive. The other 9,900 are healthy; with 90% specificity, 10% of them, or 990, test positive by mistake. So 990 of the 1,085 positive results are false alarms:

$$
\frac{990}{1{,}085}\approx 91.2\%
$$

That means a positive result is about **9% likely to indicate disease** and **91% likely to be a false alarm**.

```figure
const population = 10000;
const diseased = population * 0.01;
const healthy = population - diseased;
const truePositives = diseased * 0.95;
const falseNegatives = diseased - truePositives;
const falsePositives = healthy * (1 - 0.90);
const trueNegatives = healthy - falsePositives;

export default function () {
  return <Table
    title="Results among 10,000 people"
    columns={["", "Test positive", "Test negative"]}
    rows={[
      ["Disease", truePositives, falseNegatives],
      ["No disease", falsePositives, trueNegatives],
      ["Total", truePositives + falsePositives, falseNegatives + trueNegatives],
    ]}
  />;
}
```

