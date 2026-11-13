A **Markov chain** models weather changes where tomorrow’s weather depends on today’s weather. Each matrix row gives the probabilities of moving from one weather state to the next. Starting sunny, the distribution updates by multiplying by the transition matrix:

$$
p_{t+1}=p_tP
$$

Here, $p_t$ is the row vector of sunny, cloudy, and rainy probabilities on day $t$, and $P$ is the transition matrix. The figure shows the possible transitions and the distribution from day 0 through day 5.

```figure
const P = [
  [0.6, 0.3, 0.1],
  [0.3, 0.4, 0.3],
  [0.2, 0.4, 0.4]
];

export default function () {
  const steps = [{ p: [1, 0, 0] }];
  for (let day = 1; day <= 5; day++) {
    const prev = steps[day - 1].p;
    steps.push({
      p: P[0].map((_, j) => prev.reduce((sum, value, i) => sum + value * P[i][j], 0))
    });
  }

  return (
    <Figure
      steps={steps}
      caption={(step, i) => `Day **${i}**: sunny ${step.p[0].toFixed(4)}, cloudy ${step.p[1].toFixed(4)}, rainy ${step.p[2].toFixed(4)}.`}
      render={(step, i) => (
        <Column gap="md">
          <Graph
            nodes={[
              { id: "sunny", label: "Sunny" },
              { id: "cloudy", label: "Cloudy" },
              { id: "rainy", label: "Rainy" }
            ]}
            edges={[
              { id: "ss", from: "sunny", to: "sunny", label: "0.6", directed: true },
              { id: "sc", from: "sunny", to: "cloudy", label: "0.3", directed: true },
              { id: "sr", from: "sunny", to: "rainy", label: "0.1", directed: true },
              { id: "cs", from: "cloudy", to: "sunny", label: "0.3", directed: true },
              { id: "cc", from: "cloudy", to: "cloudy", label: "0.4", directed: true },
              { id: "cr", from: "cloudy", to: "rainy", label: "0.3", directed: true },
              { id: "rs", from: "rainy", to: "sunny", label: "0.2", directed: true },
              { id: "rc", from: "rainy", to: "cloudy", label: "0.4", directed: true },
              { id: "rr", from: "rainy", to: "rainy", label: "0.4", directed: true }
            ]}
          />
          <Table
            title="Weather probabilities"
            columns={["Day", "Sunny", "Cloudy", "Rainy"]}
            rowIds={steps.slice(0, i + 1).map((_, day) => `d${day}`)}
            rows={steps.slice(0, i + 1).map((s, day) => [
              day,
              s.p[0].toFixed(4),
              s.p[1].toFixed(4),
              s.p[2].toFixed(4)
            ])}
            states={Object.fromEntries(
              steps.slice(0, i + 1).map((_, day) => [`d${day}`, day === i ? "active" : "done"])
            )}
          />
        </Column>
      )}
    />
  );
}
```

