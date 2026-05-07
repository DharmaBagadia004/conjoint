import { useMemo, useState } from "react";
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
import UtilityBadge from "./UtilityBadge";
import UtilityExportButton from "./UtilityExportButton";
import { buildComparisonModel, getPersonaColorMap } from "./dashboardUtils";

function levelMatchesFilter(level, searchValue, utilityFilter) {
  const search = searchValue.trim().toLowerCase();
  const passesSearch = !search || level.name.toLowerCase().includes(search);

  if (!passesSearch) {
    return false;
  }

  if (utilityFilter === "positive") {
    return level.utilities.some((item) => item.utility > 0);
  }
  if (utilityFilter === "negative") {
    return level.utilities.some((item) => item.utility < 0);
  }
  if (utilityFilter === "neutral") {
    return level.utilities.some((item) => item.utility === 0);
  }

  return true;
}

function AttributeLevelsComparison({
  personas,
  chartView,
  searchValue,
  selectedAttributeId,
  utilityFilter,
  className = "",
  collapsed = false,
  onToggleCollapsed
}) {
  const [sortBy, setSortBy] = useState("attribute");
  const colorMap = getPersonaColorMap(personas);

  const comparisonAttributes = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    const attributes = buildComparisonModel(personas)
      .filter((attribute) =>
        selectedAttributeId === "all" ? true : attribute.id === selectedAttributeId
      )
      .map((attribute) => ({
        ...attribute,
        levels: attribute.levels.filter((level) => {
          const matchesAttributeSearch =
            !search || attribute.name.toLowerCase().includes(search);
          const matchesLevel = levelMatchesFilter(level, searchValue, utilityFilter);
          return matchesLevel || (matchesAttributeSearch && levelMatchesFilter(level, "", utilityFilter));
        })
      }))
      .filter((attribute) => attribute.levels.length > 0);

    if (sortBy === "largest-difference") {
      return [...attributes].sort((left, right) => right.largestSpread - left.largestSpread);
    }

    if (sortBy === "highest-utility") {
      return [...attributes].sort((left, right) => {
        const leftBest = Math.max(...left.levels.map((level) => level.highestUtility));
        const rightBest = Math.max(...right.levels.map((level) => level.highestUtility));
        return rightBest - leftBest;
      });
    }

    return [...attributes].sort((left, right) => left.name.localeCompare(right.name));
  }, [personas, searchValue, selectedAttributeId, sortBy, utilityFilter]);

  const exportRows = [
    ["Attribute", "Level", ...personas.map((persona) => persona.name), "Spread"],
    ...comparisonAttributes.flatMap((attribute) =>
      attribute.levels.map((level) => [
        attribute.name,
        level.name,
        ...level.utilities.map((item) => item.utility),
        level.spread
      ])
    )
  ];

  return (
    <section className={`flex h-full min-h-0 flex-col rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Attribute Levels
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Utility spread matrix across personas
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
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
            <>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="attribute">Sort: Attribute Name</option>
                <option value="highest-utility">Sort: Highest Utility</option>
                <option value="largest-difference">Sort: Largest Difference</option>
              </select>

              <UtilityExportButton
                label="Export CSV"
                filename="persona-level-utilities-comparison.csv"
                rows={exportRows}
                disabled={!comparisonAttributes.length}
              />
            </>
          ) : null}
        </div>
      </div>

      {!collapsed ? (
      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {comparisonAttributes.map((attribute) => {
          const chartData = attribute.levels.map((level) => {
            const row = { level: level.name };
            level.utilities.forEach((item) => {
              row[item.personaName] = item.utility;
            });
            return row;
          });

          return (
            <details
              key={attribute.id}
              open
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {attribute.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Largest utility spread: {attribute.largestSpread.toFixed(0)} points
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {attribute.levels.length} levels
                  </span>
                </div>
              </summary>

              {chartView === "chart" ? (
                <div
                  className="mt-4"
                  style={{ height: `${Math.max(230, attribute.levels.length * 64)}px` }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 16, right: 20, top: 12, bottom: 4 }}
                      barCategoryGap={18}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis type="category" dataKey="level" width={100} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                      <Tooltip />
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
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900 text-left text-slate-400">
                        <th className="px-4 py-3 pr-4 font-medium">Level</th>
                        {personas.map((persona) => (
                          <th key={persona.id} className="px-4 py-3 pr-4 font-medium">
                            {persona.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 font-medium">Spread</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attribute.levels.map((level) => (
                        <tr key={level.id} className="border-b border-slate-800 last:border-b-0">
                          <td className="px-4 py-3 pr-4 font-medium text-slate-100">
                            {level.name}
                          </td>
                          {level.utilities.map((item) => {
                            const highest = item.utility === level.highestUtility;
                            return (
                              <td key={item.personaId} className="px-4 py-3 pr-4">
                                <div className={highest ? "rounded-xl bg-emerald-50 px-2 py-1" : ""}>
                                  <UtilityBadge value={item.utility} />
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-slate-300">
                            {level.spread.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          );
        })}
      </div>
      ) : null}
    </section>
  );
}

export default AttributeLevelsComparison;
