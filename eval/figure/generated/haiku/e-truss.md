**Reactions:** $R_0 = R_4 = 15$ kN, both upward. Forces by symmetry, tension positive.

**Geometry:** bottom joints $B_0\ldots B_4$ at $x = 0, 3, 6, 9, 12$ m; top joints $T_0\ldots T_4$ at height 3 m. Diagonals slope down toward midspan: $T_0B_1$, $T_1B_2$, $T_3B_2$, $T_4B_3$, each at 45°.

| Member | Force (kN) | Type |
|---|---|---|
| $B_0B_1$ (bottom, end) | 0 | zero force |
| $B_1B_2$ (bottom) | 15 | Tension |
| $B_2B_3$ (bottom) | 15 | Tension |
| $B_3B_4$ (bottom, end) | 0 | zero force |
| $T_0T_1$ (top, end) | 15 | Compression |
| $T_1T_2$ (top) | 20 | Compression |
| $T_2T_3$ (top) | 20 | Compression |
| $T_3T_4$ (top, end) | 15 | Compression |
| $V_0$ (end post) | 15 | Compression |
| $V_1$ | 5 | Compression |
| $V_2$ (centre) | 0 | zero force |
| $V_3$ | 5 | Compression |
| $V_4$ (end post) | 15 | Compression |
| $T_0B_1$ | 21.2 | Tension |
| $T_1B_2$ | 7.1 | Tension |
| $T_3B_2$ | 7.1 | Tension |
| $T_4B_3$ | 21.2 | Tension |

**Joint order** (left half; right half mirrors it):

1. $B_0$: $\Sigma F_y$ gives $V_0 = -15$ kN (C). $\Sigma F_x$ gives $B_0B_1 = 0$.
2. $T_0$: $\Sigma F_y$ gives $T_0B_1 \sin 45^\circ = 15$, so $T_0B_1 = 15\sqrt{2} \approx 21.2$ kN (T). $\Sigma F_x$ gives $T_0T_1 = -15$ kN (C).
3. $B_1$: $\Sigma F_x$ gives $B_1B_2 = 15$ kN (T). $\Sigma F_y$ gives $15 + V_1 - 10 = 0$, so $V_1 = -5$ kN (C).
4. $T_1$: $\Sigma F_y$ gives $T_1B_2 = 5\sqrt{2} \approx 7.1$ kN (T). $\Sigma F_x$ gives $T_1T_2 = -20$ kN (C).
5. $B_2$: symmetry gives $V_2 = 0$ and $B_2B_3 = 15$ kN (T).

**Check:** a section cut through $T_2T_3$, $T_3B_2$ and $B_2B_3$ satisfies $\Sigma F_x$, $\Sigma F_y$ and moments about $B_2$. Total reactions (30 kN) equal the applied load.

Skipped: self-weight, member sizing, buckling. Assumes a parallel-chord Pratt truss with end posts, a pin at $B_0$ and a roller at $B_4$, and loads only on $B_1$ to $B_3$. Diagonals running the other way would change the forces.