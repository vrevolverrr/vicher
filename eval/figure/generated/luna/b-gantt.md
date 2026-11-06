I’ll lay out the earliest-start schedule from day 0, then mark the longest dependency chain as critical.

The **critical path** is the longest chain of dependent activities. It sets the project’s shortest possible completion time: any delay on that chain delays the finish.

Using day 0 as the start, the earliest schedule is:

| Activity | Duration | Earliest start | Earliest finish | Float |
|---|---:|---:|---:|---:|
| A | 3d | 0 | 3 | 0d |
| B | 2d | 3 | 5 | 3d |
| C | 4d | 3 | 7 | 0d |
| D | 2d | 5 | 7 | 3d |
| E | 3d | 7 | 10 | 0d |
| F | 1d | 10 | 11 | 0d |
| G | 2d | 11 | 13 | 0d |
| H | 1d | 13 | 14 | 0d |

```figure
export default function () {
  return (
    <Figure steps={[{}]} render={() => (
      <Graph
        nodes={[
          { id: 'A', label: 'A · 3d' },
          { id: 'B', label: 'B · 2d' },
          { id: 'C', label: 'C · 4d' },
          { id: 'D', label: 'D · 2d' },
          { id: 'E', label: 'E · 3d' },
          { id: 'F', label: 'F · 1d' },
          { id: 'G', label: 'G · 2d' },
          { id: 'H', label: 'H · 1d' },
        ]}
        edges={[
          { id: 'AB', from: 'A', to: 'B', directed: true },
          { id: 'AC', from: 'A', to: 'C', directed: true },
          { id: 'BD', from: 'B', to: 'D', directed: true },
          { id: 'CE', from: 'C', to: 'E', directed: true },
          { id: 'DF', from: 'D', to: 'F', directed: true },
          { id: 'EF', from: 'E', to: 'F', directed: true },
          { id: 'FG', from: 'F', to: 'G', directed: true },
          { id: 'GH', from: 'G', to: 'H', directed: true },
        ]}
        groups={{
          A: 'Critical path', AC: 'Critical path', C: 'Critical path',
          CE: 'Critical path', E: 'Critical path', EF: 'Critical path',
          F: 'Critical path', FG: 'Critical path', G: 'Critical path',
          GH: 'Critical path', H: 'Critical path',
          B: 'Other activities', AB: 'Other activities',
          BD: 'Other activities', D: 'Other activities', DF: 'Other activities',
        }}
      />
    )} />
  );
}
```

The critical path is **A → C → E → F → G → H**, totaling **14 days**. B and D each have **3 days of float** before they would delay F.

