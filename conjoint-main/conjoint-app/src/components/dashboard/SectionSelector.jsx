function SectionSelector({
  sections,
  visibleSectionIds,
  onToggleSection,
  onShowAllSections,
  selectedSectionId,
  onSelectSection,
  selectionMode = "multiple",
  collapsed = false,
  onToggleCollapsed
}) {
  const isSingleSelection = selectionMode === "single";

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start justify-between gap-3 lg:flex-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Visualization Focus
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {isSingleSelection
                ? "Choose the active dashboard view"
                : "Show only the active views"}
            </p>
          </div>

          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          ) : null}
        </div>

        {!collapsed && !isSingleSelection ? (
        <button
          type="button"
          onClick={onShowAllSections}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Show All
        </button>
        ) : null}
      </div>

      {!collapsed ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {sections.map((section) => {
          const active = isSingleSelection
            ? selectedSectionId === section.id
            : visibleSectionIds.includes(section.id);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() =>
                isSingleSelection ? onSelectSection(section.id) : onToggleSection(section.id)
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      ) : null}
    </section>
  );
}

export default SectionSelector;
