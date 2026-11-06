Straight-line depreciation spreads the asset’s depreciable cost evenly across its useful life. Double-declining-balance (DDB) records more depreciation early and less later. Both methods stop at the $5,000 salvage value.

Straight-line depreciation is the asset’s cost minus salvage value, divided by its useful life. DDB applies twice the straight-line rate to the asset’s book value at the start of each year, with a final-year adjustment so book value does not fall below salvage.

$$\text{Straight-line rate} = \frac{1}{5} = 20\%$$

$$\text{Annual straight-line depreciation} = \frac{\$50{,}000-\$5{,}000}{5} = \$9{,}000$$

$$\text{DDB rate} = 2 \times 20\% = 40\%$$

For example, DDB depreciation in year 2 is $30,000 × 40% = $12,000, since the asset’s book value at the start of that year is $30,000.

| Year | Straight-line depreciation | Straight-line ending book value | DDB depreciation | DDB ending book value |
|---:|---:|---:|---:|---:|
| 1 | $9,000 | $41,000 | $20,000 | $30,000 |
| 2 | $9,000 | $32,000 | $12,000 | $18,000 |
| 3 | $9,000 | $23,000 | $7,200 | $10,800 |
| 4 | $9,000 | $14,000 | $4,320 | $6,480 |
| 5 | $9,000 | $5,000 | $1,480 | $5,000 |

```figure
const straightLine = [9000, 9000, 9000, 9000, 9000];
const doubleDeclining = [20000, 12000, 7200, 4320, 1480];

export default function () {
  return (
    <Figure
      steps={[{ text: 'Annual depreciation by method. DDB is adjusted in year 5 to reach the $5,000 salvage value.' }]}
      caption={step => step.text}
      render={() => (
        <Plot id="depreciation" x={[0.5, 5.5]} y={[0, 22000]} xLabel="Year" yLabel="Depreciation ($)">
          {straightLine.map((amount, i) => (
            <Region key={`sl${i}`} id={`sl${i}`} top={amount} from={i + 1 - 0.2} to={i + 1 - 0.04} label="Straight-line" group="straight-line" />
          ))}
          {doubleDeclining.map((amount, i) => (
            <Region key={`ddb${i}`} id={`ddb${i}`} top={amount} from={i + 1 + 0.04} to={i + 1 + 0.2} label="Double-declining balance" group="ddb" />
          ))}
        </Plot>
      )}
    />
  );
}
```

DDB leaves more of the depreciation expense in the first years; the final year is capped so the asset ends at its salvage value.

