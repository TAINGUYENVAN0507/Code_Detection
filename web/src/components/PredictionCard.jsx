const taskTitles = {
  subtask_a: "Subtask A",
  subtask_b: "Subtask B",
  subtask_c: "Subtask C",
};

const taskDescriptions = {
  subtask_a: "Human vs AI",
  subtask_b: "Generator Family",
  subtask_c: "Human / Machine / Hybrid / Adversarial",
};

export default function PredictionCard({ taskName, prediction }) {
  if (!prediction) {
    return null;
  }

  if (prediction.error) {
    return (
      <div className="compact-card error-card">
        <div>
          <h3>{taskTitles[taskName] || taskName}</h3>
          <p>{prediction.error}</p>
        </div>
      </div>
    );
  }

  const confidence = (prediction.confidence * 100).toFixed(2);
  const summary = `${prediction.prediction} - ${confidence}%`;

  return (
    <div className="compact-card">
      <div className="compact-left">
        <h3>{taskTitles[taskName] || taskName}</h3>
        <p>{taskDescriptions[taskName] || ""}</p>
      </div>

      <div className="compact-result">
        {summary}
      </div>
    </div>
  );
}