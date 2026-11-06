**Result:** Top chord and end posts are in compression. Bottom chord, diagonals and interior verticals are in tension. The centre vertical is zero.

Assumed: pin at L0, roller at L4, span 12 m, height 3 m. Bottom joints L0 to L4 sit at x = 0, 3, 6, 9, 12 m. Top joints U1, U2, U3 sit at x = 3, 6, 9 m, y = 3 m. Loads are 10 kN down at L1, L2, L3.

**Reactions:** R_A = R_E = 15 kN up, by symmetry (total load 30 kN). H_A = 0.

**Member forces** (tension positive, compression negative):

| Member | Force (kN) | Type |
|---|---|---|
| L0–U1 (end post) | 21.2 | Compression |
| U1–U2 | 20.0 | Compression |
| U2–U3 | 20.0 | Compression |
| U3–L4 (end post) | 21.2 | Compression |
| L0–L1 | 15.0 | Tension |
| L1–L2 | 15.0 | Tension |
| L2–L3 | 15.0 | Tension |
| L3–L4 | 15.0 | Tension |
| L1–U1 (vertical) | 10.0 | Tension |
| L3–U3 (vertical) | 10.0 | Tension |
| L2–U2 (centre vertical) | 0 | Zero force |
| U1–L2 (diagonal) | 7.07 | Tension |
| U3–L2 (diagonal) | 7.07 | Tension |

The verticals are in tension because the loads hang from the bottom chord and the verticals carry them up to the top chord.

**Joint solution, left half** (right half by symmetry):
1. **L0:** ΣF_y gives end post = 15√2 = 21.2 kN compression. ΣF_x gives L0–L1 = 15 kN tension.
2. **L1:** ΣF_y gives L1–U1 = 10 kN tension. ΣF_x gives L1–L2 = 15 kN tension.
3. **U1:** ΣF_y gives U1–L2 × (1/√2) = 15 − 10, so U1–L2 = 7.07 kN tension. ΣF_x gives U1–U2 = −15 − 5 = −20 kN, so 20 kN compression.
4. **L2:** ΣF_y gives L2–U2 + 2(5) − 10 = 0, so L2–U2 = 0. ΣF_x gives L2–L3 = 15 kN tension.

**Check:** Moments about L2 of the left part: 15(6) − 10(3) = 60 kN·m. Top chord force × h = 20 × 3 = 60 kN·m. ✓

Not checked: self-weight, member sizing, and buckling of the 21.2 kN end posts and 20 kN top chord members, which are the governing compression checks. Changing the supports changes the reactions and all forces.