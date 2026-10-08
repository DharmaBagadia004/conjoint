function AttributeFilter({
  attributes,
  searchValue,
  onSearchChange,
  selectedAttributeId,
  onAttributeChange,
  utilityFilter,
  onUtilityFilterChange
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Filters
          </p>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">
            Attribute and utility controls
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-end">
        <div className="flex-1">
          <label htmlFor="analysis-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Search
          </label>
          <input
            type="text"
            id="analysis-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by attribute or level name"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        <div className="xl:w-44">
          <label htmlFor="analysis-attribute" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Attribute
          </label>
          <select
            id="analysis-attribute"
            value={selectedAttributeId}
            onChange={(event) => onAttributeChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
          >
            <option value="all">All Attributes</option>
            {attributes.map((attribute) => (
              <option key={attribute.id} value={attribute.id}>
                {attribute.name}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:w-44">
          <label htmlFor="analysis-utility" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Utility Filter
          </label>
          <select
            id="analysis-utility"
            value={utilityFilter}
            onChange={(event) => onUtilityFilterChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
          >
            <option value="all">All Utilities</option>
            <option value="positive">Positive Only</option>
            <option value="negative">Negative Only</option>
            <option value="neutral">Neutral Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default AttributeFilter;
