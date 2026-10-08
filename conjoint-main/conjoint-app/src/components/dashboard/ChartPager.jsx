import { useState } from "react";
import PlotNavigation from "./PlotNavigation";

export default function ChartPager({ items, children, onPreviousView, onNextView }) {
  const [selectedId, setSelectedId] = useState("");
  const index = Math.max(0, items.findIndex((item) => item.id === selectedId));
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 p-3">
        <span className="text-xs font-medium text-slate-500" aria-live="polite">Chart {index + 1} of {items.length}</span>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Choose attribute chart" value={items[index].id} onChange={(event) => setSelectedId(event.target.value)} className="max-w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>
      <PlotNavigation
        onPrevious={index > 0 ? () => setSelectedId(items[index - 1].id) : onPreviousView}
        onNext={index < items.length - 1 ? () => setSelectedId(items[index + 1].id) : onNextView}
        previousLabel={index > 0 ? `Previous chart: ${items[index - 1].name}` : "Previous view"}
        nextLabel={index < items.length - 1 ? `Next chart: ${items[index + 1].name}` : "Next view"}
      >
        {children(items[index])}
      </PlotNavigation>
    </div>
  );
}
