Group A has one outlier (40). Group B sits lowest and has the tightest middle half. Group C sits highest.

```figure
const data = {
  A: [12, 15, 17, 18, 20, 22, 25, 40],
  B: [8, 10, 11, 14, 15, 15, 16, 18],
  C: [20, 21, 23, 24, 26, 27, 29, 31],
};

const median = a => {
  const m = a.length, h = Math.floor(m / 2);
  return m % 2 ? a[h] : (a[h - 1] + a[h]) / 2;
};

const summary = xs => {
  const s = [...xs].sort((p, q) => p - q);
  const h = Math.floor(s.length / 2);
  const q1 = median(s.slice(0, h));
  const q3 = median(s.slice(s.length - h));
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
  const inside = s.filter(v => v >= lo && v <= hi);
  return {
    min: inside[0], q1, med: median(s), q3, max: inside[inside.length - 1],
    out: s.filter(v => v < lo || v > hi),
  };
};

const sums = Object.keys(data).map(name => ({ name, ...summary(data[name]) }));

export default function () {
  const w = 0.25;   // half-width of each box
  return (
    <Column gap="sm">
      <Plot id="box" x={[0.5, 3.5]} y={[0, 45]} xLabel="Group" yLabel="Value">
        {sums.map((g, k) => {
          const i = k + 1;
          return (
            <>
              <Shape pts={[[i - w, g.q1], [i + w, g.q1], [i + w, g.q3], [i - w, g.q3]]} closed group={g.name} />
              <Segment from={[i - w, g.med]} to={[i + w, g.med]} group={g.name} />
              <Segment from={[i, g.q1]} to={[i, g.min]} group={g.name} />
              <Segment from={[i, g.q3]} to={[i, g.max]} group={g.name} />
              <Segment from={[i - w / 2, g.min]} to={[i + w / 2, g.min]} group={g.name} />
              <Segment from={[i - w / 2, g.max]} to={[i + w / 2, g.max]} group={g.name} />
              <Label at={[i, 43]} text={g.name} />
              {g.out.length > 0 && <Points pts={g.out.map(v => [i, v])} label="outlier" />}
            </>
          );
        })}
      </Plot>
      <Text>The box spans Q1 to Q3, the line inside is the median, whiskers reach the furthest value within 1.5 × IQR, and dots are outliers.</Text>
    </Column>
  );
}
```

| Group | Min | Q1 | Median | Q3 | Max | Outliers |
|---|---|---|---|---|---|---|
| A | 12 | 16 | 19 | 23.5 | 25 | 40 |
| B | 8 | 10.5 | 14.5 | 15.5 | 18 | none |
| C | 20 | 22 | 25 | 28 | 31 | none |

Not checked: I did not render the figure, so the layout is unverified. Quartiles use the median-of-halves method. Excel `QUARTILE.INC` gives different values, for example Q1 = 16.5 and Q3 = 22.75 for A.