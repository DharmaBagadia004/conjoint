import { downloadCsv } from "./dashboardUtils";

function UtilityExportButton({ label, filename, rows, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => downloadCsv(filename, rows)}
      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200 shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export default UtilityExportButton;
