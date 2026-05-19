import axios from "axios";
import { API_BASE_URL } from "./config";

export async function predictAll({ code, language }) {
  const response = await axios.post(`${API_BASE_URL}/predict-all`, {
    code,
    language,
  });

  return response.data;
}

export async function downloadJsonFromBackend({ code, language }) {
  const response = await axios.post(
    `${API_BASE_URL}/predict-all-json`,
    {
      code,
      language,
    },
    {
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "prediction_result.json");
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
