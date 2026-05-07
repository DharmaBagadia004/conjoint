function DatasetPanel({ datasets, selectedDatasetId, onSelect, collapsed = false, onToggleCollapsed }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
            Datasets
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Study selector
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
      <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {datasets.map((dataset) => {
          const active = dataset.id === selectedDatasetId;
          return (
            <button
              key={dataset.id}
              type="button"
              onClick={() => onSelect(dataset.id)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? "border-emerald-400 bg-emerald-500/10 shadow-sm"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {dataset.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    {dataset.description}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950">
                    Live
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      ) : null}
    </section>
  );
}

export default DatasetPanel;
