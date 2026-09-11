function DatasetPanel({ datasets, selectedDatasetId, onSelect }) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-950 p-2.5 shadow-sm xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
            Datasets
          </h2>
          <p className="text-xs leading-4 text-slate-400">
            Study selector
          </p>
        </div>
      </div>

      <div className="space-y-1.5 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {datasets.map((dataset) => {
          const active = dataset.id === selectedDatasetId;
          return (
            <button
              key={dataset.id}
              type="button"
              onClick={() => onSelect(dataset.id)}
              className={`w-full rounded-xl border px-2 py-1.5 text-left transition ${
                active
                  ? "border-emerald-400 bg-emerald-500/10 shadow-sm"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5 text-slate-100">
                    {dataset.name}
                  </p>
                  <p className="text-xs leading-4 text-slate-400">
                    {dataset.description}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-950">
                    Live
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
