Straight-line depreciation spreads the depreciable cost evenly across the asset’s useful life. Double-declining-balance (DDB) records more depreciation early and less later, using twice the straight-line rate on the asset’s current book value. Both methods stop at the $5,000 salvage value.

For straight-line depreciation:

$$
\text{Annual depreciation} = \frac{\text{Cost} - \text{Salvage value}}{\text{Useful life}}
$$

That gives $(\$50{,}000 - \$5{,}000) / 5 = \$9{,}000$ per year.

For DDB, the rate is twice the straight-line rate:

$$
\text{DDB rate} = \frac{2}{\text{Useful life}} = \frac{2}{5} = 40\%
$$

Each year, multiply the beginning book value by 40%. In year 5, that would take the value below salvage, so depreciation is capped at $1,480 to leave a $5,000 ending book value.

| Year | Straight-line depreciation | Straight-line ending value | DDB depreciation | DDB ending value |
|---:|---:|---:|---:|---:|
| 1 | $9,000 | $41,000 | $20,000 | $30,000 |
| 2 | $9,000 | $32,000 | $12,000 | $18,000 |
| 3 | $9,000 | $23,000 | $7,200 | $10,800 |
| 4 | $9,000 | $14,000 | $4,320 | $6,480 |
| 5 | $9,000 | $5,000 | $1,480 | $5,000 |

```figure
export default function () {
  const steps = [{}];
  return (
    <Figure steps={steps} title="Ending book value">
      <Plot id="book-value" x={[0, 5]} y={[0, 50000]} xLabel="Year" yLabel="Dollars">
        <Shape id="straight-line" pts={[[0, 50000], [1, 41000], [2, 32000], [3, 23000], [4, 14000], [5, 5000]]} label="Straight-line" />
        <Shape id="ddb" pts={[[0, 50000], [1, 30000], [2, 18000], [3, 10800], [4, 6480], [5, 5000]]} label="DDB" />
      </Plot>
    </Figure>
  );
}
```

DDB shifts depreciation toward the early years; both methods depreciate the same total $45,000 over five years.

