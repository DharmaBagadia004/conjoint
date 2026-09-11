import { getUtilityTone } from "./dashboardUtils";

function UtilityBadge({ value }) {
  const tone = getUtilityTone(value);
  const formattedValue = value > 0 ? `+${value}` : `${value}`;

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-5 ${tone.badge}`}>
      {formattedValue}
    </span>
  );
}

export default UtilityBadge;
