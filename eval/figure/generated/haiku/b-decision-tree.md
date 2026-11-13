**Launch.** Expected net value is **+48k** (in $ thousands: +48), versus **0** for not launching.

```mermaid
flowchart LR
    D{"Launch? EV 48 vs 0"} -->|Yes| C["Pay 50 up front"]
    D -->|No| N["Net 0"]
    C --> M{"Market: EV = 0.6×100 + 0.4×(-30) = 48"}
    M -->|"60%"| S["Success: gross 150, net +100"]
    M -->|"40%"| F["Weak: gross 20, net -30"]
```

Launch EV = 0.6 × 100 + 0.4 × (-30) = 60 - 12 = 48. Not launch EV = 0.

Not checked: I assumed $150k and $20k are gross returns and the $50k cost is paid in both outcomes. If the $150k and $20k already include the cost, the launch EV is 98 instead of 48, and the decision is the same.