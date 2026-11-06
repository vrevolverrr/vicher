Group C has the highest median (25). Group A has the widest spread and one outlier, 40.

```figure
const data = [
  { name: 'Group A', xs: [12, 15, 17, 18, 20, 22, 25, 40] },
  { name: 'Group B', xs: [8, 10, 11, 14, 15, 15, 16, 18] },
  { name: 'Group C', xs: [20, 21, 23, 24, 26, 27, 29, 31] },
];

const median = s => {
  const n = s.length, m = n / 2;
  return n % 2 ? s[(n - 1) / 2] : (s[m - 1] + s[m]) / 2;
};

// shortcut: quartile halves assume even n (true here, n = 8), add median-excluded halves for odd n
const summary = xs => {
  const s = [...xs].sort((a, b) => a - b), h = s.length / 2;
  const q1 = median(s.slice(0, h)), q3 = median(s.slice(h));
  const lo = q1 - 1.5 * (q3 - q1), hi = q3 + 1.5 * (q3 - q1);
  const inside = s.filter(v => v >= lo && v <= hi);
  return {
    min: inside[0], q1, med: median(s), q3, max: inside[inside.length - 1],
    out: s.filter(v => v < lo || v > hi),
  };
};

export default function () {
  const rows = data.map(d => ({ name: d.name, ...summary(d.xs) }));
  return (
    <Row gap="lg" align="center">
      <Plot id="box" x={[0.4, 3.6]} y={[0, 45]} xLabel="Group" yLabel="Value">
        {rows.map((r, i) => {
          const x = i + 1, w = 0.2, g = r.name;
          return (
            <>
              <Segment from={[x, r.min]} to={[x, r.q1]} group={g} />
              <Segment from={[x, r.q3]} to={[x, r.max]} group={g} />
              <Segment from={[x - 0.1, r.min]} to={[x + 0.1, r.min]} group={g} />
              <Segment from={[x - 0.1, r.max]} to={[x + 0.1, r.max]} group={g} />
              <Shape pts={[[x - w, r.q1], [x + w, r.q1], [x + w, r.q3], [x - w, r.q3]]} closed group={g} />
              <Segment from={[x - w, r.med]} to={[x + w, r.med]} group={g} />
              {r.out.length > 0 && <Points pts={r.out.map(v => [x, v])} group={g} />}
              <Label at={[x, 2]} text={r.name} />
            </>
          );
        })}
      </Plot>
      <Table id="stats" title="Five-number summary"
        columns={['Group', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Outliers']}
        rows={rows.map(r => [r.name, r.min, r.q1, r.med, r.q3, r.max, r.out.join(', ') || 'none'])} />
    </Row>
  );
}
```

Quartiles are the medians of each half. Whiskers reach the furthest value within 1.5 × IQR of the box. Group A's upper fence is 34.75, so 40 is an outlier.

Not checked: I have no preview here, so the rendering is unverified.