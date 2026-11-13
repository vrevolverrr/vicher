// Rectangles in a Plot: a window over a curve, bars of one colour side by side, and bars that float.
const eps = 1;
const x0 = 1;
const L = 3;
const delta = eps / 2;
const n = 6;
const dx = 2 / n;
const flows = [['Net income', 80], ['Depreciation', 30], ['Receivables', -25], ['Inventory', 10], ['Payables', 15]];

export default function () {
  let level = 0;
  return (
    <Column gap="md">
      <Plot id="window" x={[0, 2]} y={[0, 6]} xLabel="x" yLabel="f(x)">
        <Fn id="line" f={x => 2 * x + 1} label="$f(x) = 2x + 1$" />
        <Region id="box" top={L + eps} base={L - eps} from={x0 - delta} to={x0 + delta} label="$\varepsilon$–$\delta$ box" />
        <Points id="limit" pts={[[x0, L]]} label="$(1, 3)$" />
      </Plot>
      <Plot id="sum" x={[0, 2]} xLabel="x" yLabel="y">
        <Fn id="curve" f={x => x * x} label="$y = x^2$" />
        {Array.from({ length: n }, (_, i) => <Region id={`r${i}`} top={((i + 1) * dx) ** 2} from={i * dx} to={(i + 1) * dx} />)}
      </Plot>
      <Plot id="flow" x={[0, flows.length]} xLabel="Step" yLabel="Amount ($k)">
        {flows.map(([name, change], i) => {
          const from = level;
          level += change;
          return <Region id={`f${i}`} top={Math.max(from, level)} base={Math.min(from, level)} from={i + 0.1} to={i + 0.9} label={name} />;
        })}
      </Plot>
    </Column>
  );
}
