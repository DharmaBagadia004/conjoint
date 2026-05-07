import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import UtilityExportButton from "./UtilityExportButton";
import { buildComparisonModel, getPersonaColorMap } from "./dashboardUtils";

function AttributeImportanceComparison({
  personas,
  chartView,
  className = "",
  collapsed = false,
  onToggleCollapsed
}) {
  const comparisonModel = buildComparisonModel(personas);
  const colorMap = getPersonaColorMap(personas);
  const chartHeight = Math.max(340, comparisonModel.length * 72);

  const chartData = comparisonModel.map((attribute) => {
    const row = { attribute: attribute.name };
    attribute.personaImportances.forEach((item) => {
      row[item.personaName] = Number((item.importance * 100).toFixed(1));
    });
    return row;
  });

  const exportRows = [
    ["Attribute", ...personas.map((persona) => persona.name)],
    ...comparisonModel.map((attribute) => [
      attribute.name,
      ...attribute.personaImportances.map((item) =>
        Number((item.importance * 100).toFixed(1))
      )
    ])
  ];

  return (
    <section className={`flex h-full min-h-0 flex-col rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Attribute Importance
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Persona-to-persona importance comparison
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
              filename="persona-importance-comparison.csv"
              rows={exportRows}
            />
          ) : null}
        </div>
      </div>

      {!collapsed ? (
        chartView === "chart" ? (
          <div className="mt-4 min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 16, right: 20, top: 12, bottom: 4 }}
                barCategoryGap={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="attribute" width={112} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Importance"]} />
                <Legend />
                {personas.map((persona) => (
                  <Bar
                    key={persona.id}
                    dataKey={persona.name}
                    fill={colorMap[persona.id]?.fill}
                    radius={[0, 8, 8, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
                  <th className="px-4 py-3 pr-4 font-medium">Attribute</th>
                  {personas.map((persona) => (
                    <th key={persona.id} className="px-4 py-3 pr-4 font-medium">
                      {persona.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonModel.map((attribute) => (
                  <tr key={attribute.id} className="border-b border-slate-800 last:border-b-0">
                    <td className="px-4 py-3 pr-4 font-medium text-slate-100">
                      {attribute.name}
                    </td>
                    {attribute.personaImportances.map((item) => (
                      <td key={item.personaId} className="px-4 py-3 pr-4 text-slate-300">
                        {Math.round(item.importance * 100)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
}

export default AttributeImportanceComparison;
