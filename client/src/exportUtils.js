// Stops spreadsheet programs from running a name like "=1+1" as a formula
const safeCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const fileSlug = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "drive";

export const downloadCsv = (filename, headers, rows) => {
  const lines = [headers, ...rows].map((row) => row.map(safeCell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

// Opens a clean printable page. In the print dialog, choose "Save as PDF".
export const printTable = (title, subtitle, headers, rows) => {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to export as PDF.");
    return;
  }
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #3b2a20; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #6b5547; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #fff7ed; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
};