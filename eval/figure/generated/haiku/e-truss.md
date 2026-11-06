**Result:** 17 members, all solvable by statics. Reactions are 15 kN up at L0 and L4. Tension (T) is in the bottom-centre chord and the diagonals. Compression (C) is in the top chord, end posts and short verticals.

**Assumed geometry:** Pin at L0, roller at L4. Nodes at x = 0, 3, 6, 9, 12 m. Bottom nodes L0 to L4 at y = 0. Top nodes U0 to U4 at y = 3 m, with end posts U0L0 and U4L4. Diagonals slope toward midspan: U0L1, U1L2, U3L2, U4L3, each 3√2 = 4.24 m at 45°.

| Member | Force (kN) | Type |
|---|---|---|
| L0L1 (bottom, end) | 0 | Zero |
| L1L2 (bottom) | 15 | T |
| L2L3 (bottom) | 15 | T |
| L3L4 (bottom, end) | 0 | Zero |
| U0U1 (top) | 15 | C |
| U1U2 (top) | 20 | C |
| U2U3 (top) | 20 | C |
| U3U4 (top) | 15 | C |
| U0L0 (end post) | 15 | C |
| U1L1 (vertical) | 5 | C |
| U2L2 (centre vertical) | 0 | Zero |
| U3L3 (vertical) | 5 | C |
| U4L4 (end post) | 15 | C |
| U0L1 (diagonal) | 21.2 | T |
| U1L2 (diagonal) | 7.1 | T |
| U3L2 (diagonal) | 7.1 | T |
| U4L3 (diagonal) | 21.2 | T |

**Checks:**
- Section at x = 6 m: moment = 15(6) − 10(3) = 60 kN·m. Top chord = 60/3 = 20 C.
- Section at x = 3 m: moment = 15(3) = 45 kN·m. Bottom chord = 45/3 = 15 T.
- Joint L2: the two diagonals give 5 kN up each, which balances the 10 kN load, so U2L2 = 0.
- Joint U0: 15 kN post push and 21.2 kN diagonal pull balance vertically, and 15 kN top-chord push balances the diagonal horizontally.
- Joint count: m + r = 17 + 3 = 20 = 2j. The truss is determinate.

I did not include self-weight or any support detail beyond pin and roller. No software check was run. If your truss has no end posts or a different diagonal layout, the table changes.