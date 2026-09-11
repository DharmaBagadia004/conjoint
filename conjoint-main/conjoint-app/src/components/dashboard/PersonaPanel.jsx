import ViewModeToggle from "./ViewModeToggle";
import { getPersonaColorMap } from "./dashboardUtils";

function PersonaPanel({
  personas,
  mode,
  selectedPersonaIds,
  onModeChange,
  onTogglePersona,
  maxComparisonCount,
  warning
}) {
  const selectedSet = new Set(selectedPersonaIds);
  const colorMap = getPersonaColorMap(
    personas.filter((persona) => selectedSet.has(persona.id))
  );

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950 p-2.5 shadow-sm xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
            Personas
          </h2>
          <p className="text-xs leading-4 text-slate-400">
            Active respondent models
          </p>
        </div>
      </div>

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

      <div className="mt-2 space-y-1.5 lg:max-h-[58vh] lg:overflow-y-auto lg:pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {personas.map((persona) => {
          const selected = selectedSet.has(persona.id);
          const chip = colorMap[persona.id];

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => onTogglePersona(persona.id)}
              className={`w-full rounded-xl border px-2 py-1.5 text-left transition ${
                selected
                  ? "border-sky-400 bg-sky-500/10 text-white shadow-sm"
                  : "border-slate-800 bg-slate-900 text-slate-100 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5">
                    {persona.name}
                  </p>
                  <p className={`text-xs leading-4 ${selected ? "text-sky-100" : "text-slate-400"}`}>
                    {persona.description}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
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
        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Comparison Rules
          </p>
          <p className="mt-1 text-xs leading-4 text-slate-400">
            Select 2 to {maxComparisonCount} personas for side-by-side charts, tables, and insights.
          </p>

          {warning ? (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200">
              {warning}
            </p>
          ) : null}
        </div>
      ) : null}
      </>
    </section>
  );
}

export default PersonaPanel;
