import { getUtilityTone } from "./dashboardUtils";

function UtilityBar({ value, maxAbsValue = 1 }) {
  const tone = getUtilityTone(value);
  const width = maxAbsValue ? (Math.abs(value) / maxAbsValue) * 50 : 0;

  return (
    <div className="relative h-3 w-full rounded-full bg-slate-100">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300" />
      {value >= 0 ? (
        <div
          className="absolute inset-y-0 left-1/2 rounded-r-full"
          style={{ width: `${width}%`, backgroundColor: tone.bar }}
        />
      ) : (
        <div
          className="absolute inset-y-0 right-1/2 rounded-l-full"
          style={{ width: `${width}%`, backgroundColor: tone.bar }}
        />
      )}
    </div>
  );
}

export default UtilityBar;
