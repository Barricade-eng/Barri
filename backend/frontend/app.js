// CHANGE this after you deploy the backend on Render:
const API_BASE = "https://REPLACE_WITH_YOUR_RENDER_URL";

const PRO_KEY = "barricade_pro";
const proStatus = document.getElementById("proStatus");

function isPro() {
  return localStorage.getItem(PRO_KEY) === "true";
}

function renderPro() {
  proStatus.textContent = isPro()
    ? "✅ Pro unlocked on this device."
    : "🔒 Pro locked. Pay once to unlock export.";
}

renderPro();

// Call Sheet preview
document.getElementById("csPreviewBtn").addEventListener("click", () => {
  const t = document.getElementById("csTitle").value.trim() || "-";
  const d = document.getElementById("csDate").value || "-";
  const l = document.getElementById("csLoc").value.trim() || "-";
  const p = document.getElementById("csPeople").value.trim() || "-";

  document.getElementById("csOut").textContent =
`CALL SHEET
Project: ${t}
Date: ${d}
Location: ${l}

People:
${p}
`;
});

// Invoice preview
document.getElementById("invPreviewBtn").addEventListener("click", () => {
  const from = document.getElementById("invFrom").value.trim() || "-";
  const to = document.getElementById("invTo").value.trim() || "-";
  const raw = document.getElementById("invItems").value.trim();

  const lines = raw ? raw.split("\n") : [];
  let total = 0;

  const parsed = lines.map(line => {
    const parts = line.split("-");
    const name = (parts[0] || "").trim();
    const price = Number((parts[1] || "").trim());
    if (!Number.isNaN(price)) total += price;
    return `${name} — ${Number.isNaN(price) ? "?" : price}`;
  });

  document.getElementById("invOut").textContent =
`INVOICE
From: ${from}
To: ${to}

Items:
${parsed.length ? parsed.join("\n") : "-"}

TOTAL: ${total}
`;
});

async function startCheckout() {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: "pro_export" })
  });
  const data = await res.json();
  if (!data.url) throw new Error("No checkout URL");
  window.location.href = data.url;
}

function doExport() {
  window.print(); // user can "Save as PDF"
}

async function exportPro() {
  if (isPro()) return doExport();
  await startCheckout();
}

document.getElementById("csExportBtn").addEventListener("click", exportPro);
document.getElementById("invExportBtn").addEventListener("click", exportPro);

// Handle Stripe return
(async function verifyAfterReturn() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const success = params.get("success");

  if (success === "1" && sessionId) {
    const res = await fetch(`${API_BASE}/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();

    if (data.paid) {
      localStorage.setItem(PRO_KEY, "true");
      renderPro();
      alert("Barricade Pro unlocked ✅");

      // Clean the URL
      params.delete("success");
      params.delete("session_id");
      const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }
})();
