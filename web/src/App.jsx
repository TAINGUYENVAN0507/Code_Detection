import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AnalyzePage from "./components/AnalyzePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnalyzePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
