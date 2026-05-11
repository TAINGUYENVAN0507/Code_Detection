export default function ProbabilityBar({ label, value }) {
  const percent = Number(value * 100).toFixed(2);

  return (
    <div className="prob-item">
      <div className="prob-header">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>

      <div className="prob-bar-bg">
        <div
          className="prob-bar-fill"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}