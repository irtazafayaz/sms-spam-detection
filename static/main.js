document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("message");
  const checkBtn = document.getElementById("check");
  const copyBtn = document.getElementById("copy");
  const resultDiv = document.getElementById("result");
  const historyDiv = document.getElementById("history");
  const fileInput = document.getElementById("file");
  const uploadBtn = document.getElementById("upload");
  const downloadLink = document.getElementById("download-link");

  function renderResult(entry) {
    const card = document.createElement("div");
    card.className = "card shadow-sm";
    const pct = Math.round((entry.probability || 0) * 100);
    const label = entry.prediction === "spam" ? "Spam" : "Not spam";
    const headerClass =
      entry.prediction === "spam"
        ? "bg-danger text-white"
        : "bg-success text-white";
    card.innerHTML = `
      <div class="card-header ${headerClass}">
        <strong>${label}</strong>
        <small class="float-end text-white-50">${pct}%</small>
      </div>
      <div class="card-body">
        <p class="card-text mb-2">${entry.text}</p>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${entry.prediction === "spam" ? "bg-danger" : "bg-success"}" role="progressbar" style="width: ${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>`;
    resultDiv.innerHTML = "";
    resultDiv.appendChild(card);
  }

  async function fetchHistory() {
    try {
      const r = await fetch("/history");
      if (!r.ok) return;
      const data = await r.json();
      historyDiv.innerHTML = "";
      data.slice(0, 20).forEach((h) => {
        const el = document.createElement("div");
        el.className = "mb-2";
        const cls = h.prediction === "spam" ? "text-danger" : "text-success";
        el.innerHTML = `<div class="${cls}">${h.prediction.toUpperCase()} <small class="text-muted">${(h.probability * 100).toFixed(1)}%</small></div><div class="text-truncate">${h.text}</div>`;
        historyDiv.appendChild(el);
      });
    } catch (e) {
      console.warn("history load failed", e);
    }
  }

  checkBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    resultDiv.innerHTML = "";
    if (!text) {
      resultDiv.textContent = "Please enter some text.";
      return;
    }
    resultDiv.textContent = "Checking...";
    try {
      const resp = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();
      if (resp.ok) {
        renderResult(data);
        await fetchHistory();
      } else {
        resultDiv.textContent = "Error: " + (data.error || resp.statusText);
      }
    } catch (err) {
      resultDiv.textContent = "Request failed: " + err.message;
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!resultDiv.innerText) return;
    try {
      await navigator.clipboard.writeText(resultDiv.innerText);
      copyBtn.textContent = "Copied";
      setTimeout(() => (copyBtn.textContent = "Copy Result"), 1200);
    } catch (e) {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => (copyBtn.textContent = "Copy Result"), 1200);
    }
  });

  uploadBtn.addEventListener("click", async () => {
    const f = fileInput.files[0];
    if (!f) {
      alert("Please choose a CSV file to upload");
      return;
    }
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/batch_predict", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Batch prediction failed: " + (err.error || res.statusText));
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.style.display = "inline-block";
        downloadLink.download = "predictions.csv";
        downloadLink.textContent = "Download predictions.csv";
      }
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload & Predict";
    }
  });

  // initial history load
  fetchHistory();
});
