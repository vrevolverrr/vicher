**Critical path: A → C → E → F → G → H. Project length: 14 days.**

| Activity | Duration | Predecessor | ES | EF | LS | LF | Float |
|---|---|---|---|---|---|---|---|
| A | 3 | none | 0 | 3 | 0 | 3 | 0 |
| B | 2 | A | 3 | 5 | 6 | 8 | 3 |
| C | 4 | A | 3 | 7 | 3 | 7 | 0 |
| D | 2 | B | 5 | 7 | 8 | 10 | 3 |
| E | 3 | C | 7 | 10 | 7 | 10 | 0 |
| F | 1 | D, E | 10 | 11 | 10 | 11 | 0 |
| G | 2 | F | 11 | 13 | 11 | 13 | 0 |
| H | 1 | G | 13 | 14 | 13 | 14 | 0 |

ES is the latest EF of the predecessors. LS is LF minus duration. Float is LS minus ES.

B and D share 3 days of float. Together they can slip 3 days without moving the finish.

```mermaid
flowchart LR
  A["A (3)"] ==> C["C (4)"]
  A --> B["B (2)"]
  B --> D["D (2)"]
  C ==> E["E (3)"]
  D --> F["F (1)"]
  E ==> F
  F ==> G["G (2)"]
  G ==> H["H (1)"]
```

Not checked: resource limits, lags, and working days versus calendar days. This assumes finish-to-start links only.