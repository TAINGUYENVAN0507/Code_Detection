export default function CodeInput({ code, setCode }) {
  return (
    <div className="section">
      <label className="label">Source code</label>

      <textarea
        className="code-input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your source code here..."
        spellCheck="false"
      />
    </div>
  );
}