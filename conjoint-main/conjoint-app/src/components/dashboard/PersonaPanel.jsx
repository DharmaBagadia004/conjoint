import ViewModeToggle from "./ViewModeToggle";
import { getPersonaColorMap } from "./dashboardUtils";

function PersonaPanel({
  personas,
  mode,
  selectedPersonaIds,
  onModeChange,
  onTogglePersona,
  maxComparisonCount,
  warning,
  collapsed = false,
  onToggleCollapsed
}) {
  const selectedSet = new Set(selectedPersonaIds);
  const colorMap = getPersonaColorMap(
    personas.filter((persona) => selectedSet.has(persona.id))
  );

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Personas
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Active respondent models
          </p>
        </div>

        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        ) : null}
      </div>

      {!collapsed ? (
      <>
      <ViewModeToggle
        label="Mode"
        value={mode}
        onChange={onModeChange}
        options={[
          { value: "single", label: "Single Persona" },
          { value: "comparison", label: "Comparison" }
        ]}
      />

      <div className="mt-4 space-y-2 lg:max-h-[58vh] lg:overflow-y-auto lg:pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {personas.map((persona) => {
          const selected = selectedSet.has(persona.id);
          const chip = colorMap[persona.id];

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onTogglePersona(persona.id)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-sky-400 bg-sky-500/10 text-white shadow-sm"
                  : "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {persona.name}
                  </p>
                  <p className={`mt-1 text-[11px] leading-5 ${selected ? "text-sky-100" : "text-slate-400"}`}>
                    {persona.description}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    selected && chip ? chip.soft : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {mode === "comparison"
                    ? selected
                      ? "Selected"
                      : "Compare"
                    : selected
                      ? "Active"
                      : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {mode === "comparison" ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Comparison Rules
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Select 2 to {maxComparisonCount} personas for side-by-side charts, tables, and insights.
          </p>

          {warning ? (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {warning}
            </p>
          ) : null}
        </div>
      ) : null}
      </>
      ) : null}
    </section>
  );
}

export default PersonaPanel;
