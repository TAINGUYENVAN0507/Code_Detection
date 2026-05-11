import { useEffect, useState } from "react";
import { predictAll } from "../api/predictApi";
import { downloadJson } from "../utils/downloadJson";
import CodeInput from "./CodeInput";
import HistorySidebar from "./HistorySidebar";
import LanguageSelect from "./LanguageSelect";
import PredictionCard from "./PredictionCard";

const HISTORY_KEY = "analyze_history";
const DOWNLOAD_FORMATS = [
  { value: "json", label: ".json" },
  { value: "doc", label: ".doc" },
  { value: "pdf", label: ".pdf" },
  { value: "txt", label: ".txt" },
];

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSavedHistory() {
  try {
    const savedHistory = localStorage.getItem(HISTORY_KEY);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory);

    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
}

function createHistoryTitle(code) {
  const firstLine = code
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return "Untitled analysis";
  }

  return firstLine.length > 32 ? `${firstLine.slice(0, 32)}...` : firstLine;
}

function createTimeLabel() {
  const now = new Date();

  return now.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function createReportText(result) {
  const predictions = result?.predictions || {};

  return Object.entries(predictions)
    .map(([taskName, prediction]) => {
      if (prediction.error) {
        return `${taskName}: ${prediction.error}`;
      }

      const confidence = (prediction.confidence * 100).toFixed(2);
      return `${taskName}: ${prediction.prediction} - ${confidence}%`;
    })
    .join("\n");
}

function createDocReport(result) {
  const reportText = createReportText(result).replaceAll("\n", "<br />");

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>Prediction Result</h1>
        <p>${reportText}</p>
      </body>
    </html>
  `;
}

function createPdfReport(result) {
  const reportText = createReportText(result)
    .split("\n")
    .map((line) => `(${line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)")}) Tj`)
    .join("\n0 -18 Td\n");

  const body = `BT /F1 12 Tf 40 760 Td (Prediction Result) Tj 0 -28 Td ${reportText} ET`;
  const stream = `4 0 obj\n<< /Length ${body.length} >>\nstream\n${body}\nendstream\nendobj`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj",
    stream,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export default function AnalyzePage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [downloadFormat, setDownloadFormat] = useState("json");
  const [rawJsonVisible, setRawJsonVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHistory(readSavedHistory());
  }, []);

  function saveHistory(newHistory) {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }

  function addHistoryItem(data) {
    const item = {
      id: createId(),
      title: createHistoryTitle(code),
      code,
      language,
      result: data,
      createdAt: createTimeLabel(),
    };

    const newHistory = [item, ...history].slice(0, 30);
    saveHistory(newHistory);
  }

  async function handleAnalyze() {
    if (!code.trim()) {
      setError("Please paste some code before analyzing.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setRawJsonVisible(false);

    try {
      const data = await predictAll({
        code,
        language,
      });

      setResult(data);
      addHistoryItem(data);
    } catch {
      setError("Cannot connect to backend API. Please check FastAPI server.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadSelectedFile() {
    if (!result) {
      return;
    }

    if (downloadFormat === "json") {
      downloadJson(result, "prediction_result.json");
      return;
    }

    if (downloadFormat === "doc") {
      downloadBlob(createDocReport(result), "prediction_result.doc", "application/msword");
      return;
    }

    if (downloadFormat === "pdf") {
      downloadBlob(createPdfReport(result), "prediction_result.pdf", "application/pdf");
      return;
    }

    downloadBlob(createReportText(result), "prediction_result.txt", "text/plain");
  }

  function handleSelectHistory(item) {
    setCode(item.code);
    setLanguage(item.language);
    setResult(item.result);
    setError("");
    setRawJsonVisible(false);
  }

  function handleNewAnalysis() {
    setCode("");
    setResult(null);
    setError("");
    setRawJsonVisible(false);
  }

  function handleClearHistory() {
    saveHistory([]);
  }

  return (
    <div className="app-layout">
      <HistorySidebar
        history={history}
        onSelectHistory={handleSelectHistory}
        onNewAnalysis={handleNewAnalysis}
        onClearHistory={handleClearHistory}
      />

      <div className="page">
        <header className="header">
          <div>
            <h1>AI Code Detector</h1>
          </div>
        </header>

        <main className="container">
          <section className="left-panel">
            <div className="panel">
              <LanguageSelect language={language} setLanguage={setLanguage} />

              <CodeInput code={code} setCode={setCode} />

              {error && <div className="error">{error}</div>}

              <div className="button-row">
                <button
                  className="primary-btn"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Analyze Code"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={handleNewAnalysis}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="right-panel">
            {!result && (
              <div className="empty-card">
                <h2>No prediction yet</h2>
                <p>
                  Paste your code, choose the programming language, and click
                  Analyze Code.
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="summary-card">
                  <h2>Prediction Result</h2>

                  <div className="download-row">
                    <select
                      className="download-select"
                      value={downloadFormat}
                      onChange={(event) => setDownloadFormat(event.target.value)}
                    >
                      {DOWNLOAD_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>

                    <button className="json-btn" onClick={handleDownloadSelectedFile}>
                      Download
                    </button>

                    <button
                      className="json-btn outline"
                      onClick={() => setRawJsonVisible(!rawJsonVisible)}
                    >
                      {rawJsonVisible ? "Hide JSON" : "Show JSON"}
                    </button>
                  </div>
                </div>

                <div className="prediction-grid">
                  {Object.entries(result.predictions || {}).map(
                    ([taskName, prediction]) => (
                      <PredictionCard
                        key={taskName}
                        taskName={taskName}
                        prediction={prediction}
                      />
                    )
                  )}
                </div>

                {rawJsonVisible && (
                  <div className="json-viewer">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
