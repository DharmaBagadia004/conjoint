function MetricCard({ title, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-100">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export default MetricCard;
