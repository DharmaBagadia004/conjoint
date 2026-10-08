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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
            Personas
          </h2>
          <p className="text-xs leading-4 text-slate-500">
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

      <div className="mt-2 space-y-3">
        {personas.map((persona) => {
          const selected = selectedSet.has(persona.id);
          const chip = colorMap[persona.id];

          return (
            <button
              key={persona.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onTogglePersona(persona.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-sky-400 bg-sky-500/10 text-slate-900 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-col items-start gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5">
                    {persona.name}
                  </p>
                  <p className={`text-xs leading-4 ${selected ? "text-sky-700" : "text-slate-500"}`}>
                    {persona.description}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${
                    selected && chip ? chip.soft : "border-slate-200 bg-slate-100 text-slate-500"
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
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Comparison Rules
          </p>
          <p className="mt-1 text-xs leading-4 text-slate-500">
            Select 2 to {maxComparisonCount} personas for side-by-side charts, tables, and insights.
          </p>

          {warning ? (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-800">
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
