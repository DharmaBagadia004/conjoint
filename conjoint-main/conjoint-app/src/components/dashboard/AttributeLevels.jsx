import { useMemo, useState } from "react";
import UtilityBadge from "./UtilityBadge";
import UtilityBar from "./UtilityBar";
import UtilityExportButton from "./UtilityExportButton";

function shouldIncludeValue(value, utilityFilter) {
  if (utilityFilter === "positive") {
    return value > 0;
  }
  if (utilityFilter === "negative") {
    return value < 0;
  }
  if (utilityFilter === "neutral") {
    return value === 0;
  }
  return true;
}

function AttributeLevels({
  persona,
  searchValue,
  selectedAttributeId,
  utilityFilter,
  className = ""
}) {
  const [sortBy, setSortBy] = useState("attribute");

  const filteredAttributes = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    const baseAttributes = persona.attributes
      .filter((attribute) =>
        selectedAttributeId === "all" ? true : attribute.id === selectedAttributeId
      )
      .map((attribute) => {
        const levels = attribute.levels.filter((level) => {
          const matchesSearch =
            !search ||
            attribute.name.toLowerCase().includes(search) ||
            level.name.toLowerCase().includes(search);

          return matchesSearch && shouldIncludeValue(level.utility, utilityFilter);
        });

        return {
          ...attribute,
          levels,
          maxUtility: Math.max(...attribute.levels.map((level) => level.utility)),
          maxAbsUtility: Math.max(...attribute.levels.map((level) => Math.abs(level.utility)))
        };
      })
      .filter((attribute) => attribute.levels.length > 0);

    if (sortBy === "highest-utility") {
      return [...baseAttributes].sort((left, right) => right.maxUtility - left.maxUtility);
    }

    return [...baseAttributes].sort((left, right) => left.name.localeCompare(right.name));
  }, [persona.attributes, searchValue, selectedAttributeId, sortBy, utilityFilter]);

  const exportRows = [
    ["Persona", persona.name],
    ["Attribute", "Level", "Utility"],
    ...filteredAttributes.flatMap((attribute) =>
      attribute.levels.map((level) => [attribute.name, level.name, level.utility])
    )
  ];

  return (
    <section className={`flex h-full min-h-0 flex-col rounded-2xl border border-slate-700 bg-slate-950 p-2.5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
            Attribute Levels
          </h2>
          <p className="text-xs leading-4 text-slate-400">
            Part-worth utility matrix
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          >
            <option value="attribute">Sort: Attribute Name</option>
            <option value="highest-utility">Sort: Highest Utility</option>
          </select>

          <UtilityExportButton
            label="Export CSV"
            filename={`${persona.id}-attribute-levels.csv`}
            rows={exportRows}
            disabled={!filteredAttributes.length}
          />
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {filteredAttributes.map((attribute) => (
          <details
            key={attribute.id}
            open
            className="rounded-xl border border-slate-800 bg-slate-900 p-2"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold leading-5 text-slate-100">
                    {attribute.name}
                  </h3>
                  <p className="text-xs leading-4 text-slate-400">
                    Importance: {Math.round(attribute.importance * 100)}%
                  </p>
                </div>
                <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {attribute.levels.length} levels
                </span>
              </div>
            </summary>

            <div className="mt-1.5 space-y-1">
              {attribute.levels.map((level) => (
                <div
                  key={level.id}
                  className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 lg:grid-cols-[minmax(0,130px)_60px_minmax(0,1fr)] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-medium leading-5 text-slate-200">
                      {level.name}
                    </p>
                  </div>
                  <UtilityBadge value={level.utility} />
                  <UtilityBar value={level.utility} maxAbsValue={attribute.maxAbsUtility} />
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default AttributeLevels;
