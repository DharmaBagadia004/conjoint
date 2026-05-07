function ViewModeToggle({ label, value, options, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-1 shadow-sm">
      <div className="flex flex-wrap items-center gap-1">
        {label ? (
          <span className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </span>
        ) : null}

        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-emerald-400 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800"
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
