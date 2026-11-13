```mermaid
flowchart LR
    R["Setpoint r(t)"] -->|"+"| S((Σ))
    S -->|"e(t) = r − y"| P["P: Kp · e(t)"]
    S --> I["I: Ki ∫ e(t) dt"]
    S --> D["D: Kd · de/dt"]
    P --> U((Σ))
    I --> U
    D --> U
    U -->|"u(t)"| PL["Plant"]
    PL -->|"y(t)"| Y["Output y(t)"]
    Y -->|"−"| S
```

The error e(t) feeds the P, I and D blocks in parallel. Their sum u(t) drives the plant. The output is fed back and subtracted at the first summing junction.

Not checked: rendering in the Obsidian vault. Risk: none for the diagram itself.