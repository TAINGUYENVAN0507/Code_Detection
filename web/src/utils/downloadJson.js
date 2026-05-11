export function downloadJson(data, filename = "prediction_result.json") {
  const jsonString = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonString], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}