function ViewModeToggle({ label, value, options, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-1">
        {label ? (
          <span className="px-1.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>
        ) : null}

        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? "bg-emerald-400 text-slate-950 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViewModeToggle;
