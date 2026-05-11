export default function LanguageSelect({ language, setLanguage }) {
  return (
    <div className="section">
      <label className="label">Programming language</label>

      <select
        className="select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
        <option value="javascript">JavaScript</option>
        <option value="c">C</option>
        <option value="csharp">C#</option>
        <option value="go">Go</option>
        <option value="php">PHP</option>
        <option value="ruby">Ruby</option>
        <option value="rust">Rust</option>
        <option value="unknown">Unknown</option>
      </select>
    </div>
  );
}