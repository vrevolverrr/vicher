The project takes **14 days**. The critical path is **A → C → E → F → G → H**; those tasks have zero float.

| Task | Duration | Earliest start | Earliest finish | Latest start | Latest finish | Float |
|---|---:|---:|---:|---:|---:|---:|
| A | 3d | 0 | 3 | 0 | 3 | 0 |
| B | 2d | 3 | 5 | 6 | 8 | 3 |
| C | 4d | 3 | 7 | 3 | 7 | 0 |
| D | 2d | 5 | 7 | 8 | 10 | 3 |
| E | 3d | 7 | 10 | 7 | 10 | 0 |
| F | 1d | 10 | 11 | 10 | 11 | 0 |
| G | 2d | 11 | 13 | 11 | 13 | 0 |
| H | 1d | 13 | 14 | 13 | 14 | 0 |

Days are measured from project start at day 0. F waits for both D and E, so it starts at day 10 when E finishes.

```mermaid
flowchart LR
    A["A · 3d"] --> B["B · 2d"]
    A --> C["C · 4d"]
    B --> D["D · 2d"]
    C --> E["E · 3d"]
    D --> F["F · 1d"]
    E --> F
    F --> G["G · 2d"]
    G --> H["H · 1d"]

    linkStyle 0,2,4,6,7,8 stroke:#d33,stroke-width:3px
    style A fill:#fee,stroke:#d33,stroke-width:2px
    style C fill:#fee,stroke:#d33,stroke-width:2px
    style E fill:#fee,stroke:#d33,stroke-width:2px
    style F fill:#fee,stroke:#d33,stroke-width:2px
    style G fill:#fee,stroke:#d33,stroke-width:2px
    style H fill:#fee,stroke:#d33,stroke-width:2px
```

