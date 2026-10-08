import ChartPager from "./ChartPager";
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
  onPreviousView,
  onNextView,
  className = ""
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
    <section className={`flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
            Attribute Levels
          </h2>
          <p className="text-xs leading-4 text-slate-500">
            Utility spread matrix across personas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Sort attribute levels"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
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
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-3">
        {!comparisonAttributes.length ? (
          <div role="status" className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">No matching levels</p>
            <p className="mt-2 text-sm text-slate-500">Try another search or choose all attributes and utilities.</p>
          </div>
        ) : null}
        <ChartPager items={comparisonAttributes} onPreviousView={onPreviousView} onNextView={onNextView}>{(attribute) => {
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
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <summary className="analysis-disclosure cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold leading-5 text-slate-900">
                      {attribute.name}
                    </h3>
                    <p className="text-xs leading-4 text-slate-500">
                      Largest utility spread: {attribute.largestSpread.toFixed(0)} points
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {attribute.levels.length} levels
                  </span>
                </div>
              </summary>

              {chartView === "chart" ? (
                <div
                  className="mt-1.5"
                  style={{ height: `${Math.max(170, attribute.levels.length * 46)}px` }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                      barCategoryGap={10}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis type="category" dataKey="level" width={100} tick={{ fill: "#475569", fontSize: 11 }} />
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
                <div className="mt-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                        <th className="px-2.5 py-1.5 pr-3 font-medium">Level</th>
                        {personas.map((persona) => (
                          <th key={persona.id} className="px-2.5 py-1.5 pr-3 font-medium">
                            {persona.name}
                          </th>
                        ))}
                        <th className="px-2.5 py-1.5 font-medium">Spread</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attribute.levels.map((level) => (
                        <tr key={level.id} className="border-b border-slate-200 last:border-b-0">
                          <td className="px-2.5 py-1.5 pr-3 font-medium text-slate-900">
                            {level.name}
                          </td>
                          {level.utilities.map((item) => {
                            const highest = item.utility === level.highestUtility;
                            return (
                              <td key={item.personaId} className="px-2.5 py-1.5 pr-3">
                                <div className={highest ? "rounded-lg bg-emerald-50 px-1.5 py-0.5" : ""}>
                                  <UtilityBadge value={item.utility} />
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-2.5 py-1.5 text-slate-600">
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
        }}</ChartPager>
      </div>
    </section>
  );
}

export default AttributeLevelsComparison;
