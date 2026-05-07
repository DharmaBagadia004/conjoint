import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ProgressBar from "./ProgressBar";
import UtilityExportButton from "./UtilityExportButton";

function AttributeImportance({
  persona,
  chartView,
  className = "",
  collapsed = false,
  onToggleCollapsed
}) {
  const data = persona.attributes.map((attribute) => ({
    attribute: attribute.name,
    importance: Number((attribute.importance * 100).toFixed(1))
  }));

  const exportRows = [
    ["Persona", persona.name],
    ["Attribute", "Importance %"],
    ...data.map((row) => [row.attribute, row.importance])
  ];

  return (
    <section className={`flex h-full min-h-0 flex-col rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Attribute Importance
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Importance profile for {persona.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          ) : null}
          {!collapsed ? (
            <UtilityExportButton
              label="Export CSV"
              filename={`${persona.id}-attribute-importance.csv`}
              rows={exportRows}
            />
          ) : null}
        </div>
      </div>

      {!collapsed ? (
        chartView === "chart" ? (
          <div className="mt-4 min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="attribute" width={100} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Importance"]} />
                <Bar dataKey="importance" fill="#34d399" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {data.map((row) => (
              <div key={row.attribute} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-200">
                    {row.attribute}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">
                    {row.importance}%
                  </span>
                </div>
                <ProgressBar value={row.importance} colorClass="bg-emerald-400" />
              </div>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}

export default AttributeImportance;
