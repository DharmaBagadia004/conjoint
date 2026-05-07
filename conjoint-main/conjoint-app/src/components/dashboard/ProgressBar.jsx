function ProgressBar({ value, colorClass = "bg-blue-500" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default ProgressBar;
