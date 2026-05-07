import { getUtilityTone } from "./dashboardUtils";

function UtilityBadge({ value }) {
  const tone = getUtilityTone(value);
  const formattedValue = value > 0 ? `+${value}` : `${value}`;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
      {formattedValue}
    </span>
  );
}

export default UtilityBadge;
