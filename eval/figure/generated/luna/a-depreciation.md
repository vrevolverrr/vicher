Straight-line depreciation spreads the asset’s depreciable cost evenly across its useful life. Double-declining-balance (DDB) applies a fixed percentage to the asset’s **opening book value**, so depreciation is higher at first and falls each year. DDB is capped so the asset never drops below its $5,000 salvage value.

The depreciable cost is $50,000 − $5,000 = $45,000. Straight-line depreciation is:

$$
\text{Annual depreciation} = \frac{\text{Cost} - \text{Salvage value}}{\text{Useful life}}
$$

So straight-line depreciation is $45,000 ÷ 5 = **$9,000 per year**. DDB uses twice the straight-line rate: 2 ÷ 5 = **40%** of opening book value each year, with a final adjustment to reach salvage value.

| Year | Straight-line depreciation | Straight-line ending book value | DDB depreciation | DDB ending book value |
|---:|---:|---:|---:|---:|
| 1 | $9,000 | $41,000 | $20,000 | $30,000 |
| 2 | $9,000 | $32,000 | $12,000 | $18,000 |
| 3 | $9,000 | $23,000 | $7,200 | $10,800 |
| 4 | $9,000 | $14,000 | $4,320 | $6,480 |
| 5 | $9,000 | $5,000 | $1,480* | $5,000 |

```figure
export default function () {
  return (
    <Plot id="book-value" x={[0, 5]} y={[0, 50000]} xLabel="Year" yLabel="Ending book value ($)" equal={false}>
      <Shape id="straight-line" pts={[[0, 50000], [1, 41000], [2, 32000], [3, 23000], [4, 14000], [5, 5000]]} label="Straight-line" />
      <Shape id="ddb" pts={[[0, 50000], [1, 30000], [2, 18000], [3, 10800], [4, 6480], [5, 5000]]} label="Double-declining balance" />
    </Plot>
  );
}
```

Straight-line gives the same expense each year. DDB records more expense early, which can reduce early reported profit; both methods depreciate the same total $45,000. *In year 5, DDB is adjusted from $2,592 to $1,480 so book value ends at salvage value.

