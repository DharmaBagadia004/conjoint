function DatasetPanel({ datasets, selectedDatasetId, onSelect }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900">
            Datasets
          </h2>
          <p className="text-xs leading-4 text-slate-500">
            Study selector
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {datasets.map((dataset) => {
          const active = dataset.id === selectedDatasetId;
          return (
            <button
              key={dataset.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(dataset.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-emerald-400 bg-emerald-500/10 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-col items-start gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5 text-slate-900">
                    {dataset.name}
                  </p>
                  <p className="text-xs leading-4 text-slate-500">
                    {dataset.description}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-emerald-400 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-950">
                    Selected
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default DatasetPanel;
