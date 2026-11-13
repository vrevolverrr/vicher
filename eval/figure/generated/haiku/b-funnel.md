| Stage | Count | From previous stage | From visitors |
|---|---|---|---|
| Visitors | 10,000 | — | 100% |
| Sign-ups | 2,400 | 24.0% | 24.0% |
| Trials | 900 | 37.5% | 9.0% |
| Customers | 300 | 33.3% | 3.0% |
| Renewals | 120 | 40.0% | 1.2% |

Largest loss: visitors to sign-ups, 7,600 lost (76%).

```mermaid
flowchart LR
  A["Visitors<br/>10,000"] -->|"24.0%"| B["Sign-ups<br/>2,400"]
  B -->|"37.5%"| C["Trials<br/>900"]
  C -->|"33.3%"| D["Customers<br/>300"]
  D -->|"40.0%"| E["Renewals<br/>120"]
```

Not checked: whether the 120 renewals come from the same 300 customers in the same period. The rates assume they do.