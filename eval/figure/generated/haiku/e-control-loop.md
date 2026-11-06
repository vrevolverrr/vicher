```mermaid
flowchart LR
    r["Setpoint $$r(t)$$"] -->|"+"| e(("Σ"))
    y["Output $$y(t)$$"] -->|"−"| e
    e -->|"error $$e(t)$$"| P["Proportional $$K_p\,e(t)$$"]
    e --> I["Integral $$K_i\int e\,dt$$"]
    e --> D["Derivative $$K_d\,\frac{de}{dt}$$"]
    P -->|"+"| u(("Σ"))
    I -->|"+"| u
    D -->|"+"| u
    u -->|"control $$u(t)$$"| G["Plant $$G(s)$$"]
    G --> y
```

The controller output is the sum of three terms:

$$u(t) = K_p\,e(t) + K_i \int_0^t e(\tau)\,d\tau + K_d\,\frac{de(t)}{dt}$$

- $e(t) = r(t) - y(t)$ is the error.
- $K_p$, $K_i$, $K_d$ are the gains.