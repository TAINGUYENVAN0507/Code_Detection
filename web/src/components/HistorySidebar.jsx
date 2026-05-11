export default function HistorySidebar({
  history,
  onSelectHistory,
  onNewAnalysis,
  onClearHistory,
}) {
  return (
    <aside className="history-sidebar">
      <div className="history-header">
        <h2>AI Code Detector</h2>
      </div>

      <button className="new-analysis-btn" onClick={onNewAnalysis}>
        + New Analysis
      </button>

      <div className="history-section-title">Recent</div>

      <div className="history-list">
        {history.length === 0 && (
          <p className="empty-history">No history yet</p>
        )}

        {history.map((item) => (
          <button
            key={item.id}
            className="history-item"
            onClick={() => onSelectHistory(item)}
          >
            <span className="history-title">{item.title}</span>
            <span className="history-meta">
              {item.language} · {item.createdAt}
            </span>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <button className="clear-history-btn" onClick={onClearHistory}>
          Clear history
        </button>
      )}
    </aside>
  );
}