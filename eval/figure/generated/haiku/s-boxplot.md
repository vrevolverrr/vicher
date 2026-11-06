```figure
const groups = [
  { name: 'A', min: 12, q1: 16, med: 19, q3: 23.5, max: 25, out: [40] },
  { name: 'B', min: 8, q1: 10.5, med: 14.5, q3: 15.5, max: 18, out: [] },
  { name: 'C', min: 20, q1: 22, med: 25, q3: 28, max: 31, out: [] },
];

export default function () {
  return (
    <Figure
      title="Box plots of groups A, B and C"
      steps={[0]}
      caption={() => 'Box spans Q1 to Q3. Line in box is the median. Whiskers reach the furthest value inside 1.5 IQR. Dots are outliers.'}
      render={() => (
        <Plot x={[0.4, 3.6]} y={[0, 44]} yLabel="Value" equal={false}>
          {groups.map((g, i) => {
            const x = i + 1;
            const w = 0.25;
            const cap = 0.12;
            return (
              <>
                <Shape pts={[[x - w, g.q1], [x + w, g.q1], [x + w, g.q3], [x - w, g.q3]]} closed group={g.name} />
                <Segment from={[x - w, g.med]} to={[x + w, g.med]} group={g.name} />
                <Segment from={[x, g.q3]} to={[x, g.max]} group={g.name} />
                <Segment from={[x, g.min]} to={[x, g.q1]} group={g.name} />
                <Segment from={[x - cap, g.max]} to={[x + cap, g.max]} group={g.name} />
                <Segment from={[x - cap, g.min]} to={[x + cap, g.min]} group={g.name} />
                <Label at={[x, 2]} text={`**${g.name}**`} />
                {g.out.map(v => <Points pts={[[x, v]]} group={g.name} />)}
              </>
            );
          })}
        </Plot>
      )}
    />
  );
}
```

| Group | Min | Q1 | Median | Q3 | Max | Outliers |
|---|---|---|---|---|---|---|
| A | 12 | 16 | 19 | 23.5 | 25 | 40 |
| B | 8 | 10.5 | 14.5 | 15.5 | 18 | none |
| C | 20 | 22 | 25 | 28 | 31 | none |

A's 40 is an outlier. Upper fence = 23.5 + 1.5 × 7.5 = 34.75, so A's upper whisker stops at 25.

Not checked: the figure uses the median-of-halves quartile method. Excel `QUARTILE.INC` and R's default use interpolation, which gives A Q1 = 16.5 and Q3 = 22.75. The outlier and the group order stay the same.