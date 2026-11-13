The figure tool cannot draw electrical circuits, so I describe the circuit in words.

The circuit is a single loop, with four parts in series:

1. **Battery** (voltage V), positive terminal to the switch.
2. **Switch** S, open or closed.
3. **Resistor** R.
4. **Capacitor** C, back to the battery's negative terminal.

Closing S completes the loop. The capacitor then charges through R toward V.

To see the schematic, paste this netlist into LTspice or ngspice, which draw the circuit from it:

```spice
* RC charging circuit: battery, switch, resistor, capacitor
V1 vin 0 DC 5
S1 vin n1 ctrl 0 SW
.model SW SW(Ron=0.01 Roff=1e9 Vt=0.5)
Vctrl ctrl 0 PULSE(0 1 0 1n 1n 1 2)
R1 n1 out 1k
C1 out 0 100u IC=0
.tran 10m 1
.end
```

Here V1 is the 5 V battery, S1 is the switch (closed from t = 0), R1 is 1 kΩ, and C1 is 100 µF.

Not checked: I did not run the netlist in a simulator.