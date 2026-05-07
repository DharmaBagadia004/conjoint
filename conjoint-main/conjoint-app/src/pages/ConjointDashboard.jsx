import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DatasetPanel from "../components/dashboard/DatasetPanel";
import PersonaPanel from "../components/dashboard/PersonaPanel";
import ViewModeToggle from "../components/dashboard/ViewModeToggle";
import SectionSelector from "../components/dashboard/SectionSelector";
import AttributeFilter from "../components/dashboard/AttributeFilter";
import AttributeLevels from "../components/dashboard/AttributeLevels";
import AttributeLevelsComparison from "../components/dashboard/AttributeLevelsComparison";
import ComparisonSummary from "../components/dashboard/ComparisonSummary";
import EmptyState from "../components/dashboard/EmptyState";
import MetricCard from "../components/dashboard/MetricCard";
import { datasets } from "../data/conjointDashboardData";
import { buildComparisonInsights } from "../components/dashboard/dashboardUtils";

const MAX_COMPARISON_PERSONAS = 4;

const SINGLE_MODE_SECTIONS = [
  { id: "profile", label: "Persona Profile" },
  { id: "levels", label: "Attribute Levels" }
];

const COMPARISON_MODE_SECTIONS = [
  { id: "summary", label: "Comparison Summary" },
  { id: "levels", label: "Attribute Levels" }
];

function getDefaultPersonaSelection(dataset, mode) {
  if (!dataset?.personas?.length) {
    return [];
  }

  if (mode === "comparison") {
    return dataset.personas.slice(0, 2).map((persona) => persona.id);
  }

  return [dataset.personas[0].id];
}

function getDefaultActiveSection(mode) {
  return mode === "single" ? "levels" : "levels";
}

function ConjointDashboard() {
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id ?? "");
  const [mode, setMode] = useState("single");
  const [chartView, setChartView] = useState("chart");
  const [selectedPersonaIds, setSelectedPersonaIds] = useState(
    getDefaultPersonaSelection(datasets[0], "single")
  );
  const [selectedAttributeId, setSelectedAttributeId] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [utilityFilter, setUtilityFilter] = useState("all");
  const [selectionWarning, setSelectionWarning] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(getDefaultActiveSection("single"));
  const [isControlMenuOpen, setIsControlMenuOpen] = useState(false);
  const [isInsightsMenuOpen, setIsInsightsMenuOpen] = useState(false);
  const [isStatsMenuOpen, setIsStatsMenuOpen] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState({
    dataset: false,
    personas: false,
    filters: false,
    focus: false,
    profile: false,
    summary: false,
    levels: false,
  });

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0],
    [selectedDatasetId]
  );

  useEffect(() => {
    setSelectedPersonaIds(getDefaultPersonaSelection(selectedDataset, mode));
    setSelectedAttributeId("all");
    setSearchValue("");
    setUtilityFilter("all");
    setSelectionWarning("");
    setActiveSectionId(getDefaultActiveSection(mode));
    setIsControlMenuOpen(false);
    setIsInsightsMenuOpen(false);
    setIsStatsMenuOpen(false);
  }, [mode, selectedDataset]);

  const selectedPersonas = useMemo(() => {
    if (!selectedDataset) {
      return [];
    }

    const selectedIdSet = new Set(selectedPersonaIds);
    return selectedDataset.personas.filter((persona) => selectedIdSet.has(persona.id));
  }, [selectedDataset, selectedPersonaIds]);

  const activePersona = selectedPersonas[0] ?? selectedDataset.personas[0];
  const attributeOptions = selectedDataset.personas[0]?.attributes ?? [];
  const sectionOptions = mode === "single" ? SINGLE_MODE_SECTIONS : COMPARISON_MODE_SECTIONS;
  const comparisonInsights = mode === "comparison" ? buildComparisonInsights(selectedPersonas).insights : [];

  const handleDatasetChange = (datasetId) => {
    setSelectedDatasetId(datasetId);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
  };

  const handleTogglePersona = (personaId) => {
    setSelectionWarning("");

    if (mode === "single") {
      setSelectedPersonaIds([personaId]);
      return;
    }

    setSelectedPersonaIds((current) => {
      if (current.includes(personaId)) {
        return current.filter((id) => id !== personaId);
      }

      if (current.length >= MAX_COMPARISON_PERSONAS) {
        setSelectionWarning(`Select up to ${MAX_COMPARISON_PERSONAS} personas at a time for a clean comparison.`);
        return current;
      }

      return [...current, personaId];
    });
  };

  const isPanelCollapsed = (panelId) => Boolean(collapsedPanels[panelId]);

  const togglePanelCollapsed = (panelId) => {
    setCollapsedPanels((current) => ({
      ...current,
      [panelId]: !current[panelId],
    }));
  };

  const datasetPanel = (
    <DatasetPanel
      datasets={datasets}
      selectedDatasetId={selectedDataset.id}
      onSelect={handleDatasetChange}
      collapsed={isPanelCollapsed("dataset")}
      onToggleCollapsed={() => togglePanelCollapsed("dataset")}
    />
  );

  const personaPanel = (
    <PersonaPanel
      personas={selectedDataset.personas}
      mode={mode}
      selectedPersonaIds={selectedPersonaIds}
      onModeChange={handleModeChange}
      onTogglePersona={handleTogglePersona}
      maxComparisonCount={MAX_COMPARISON_PERSONAS}
      warning={selectionWarning}
      collapsed={isPanelCollapsed("personas")}
      onToggleCollapsed={() => togglePanelCollapsed("personas")}
    />
  );

  const mainPanel = (
    <div className="relative space-y-3 xl:flex xl:min-h-0 xl:flex-col">
      <section className="rounded-[28px] border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-lg">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Conjoint Analytics Matrix
            </p>
            <h1 className="mt-2 text-xl font-semibold xl:text-2xl">
              {selectedDataset.name}
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300 xl:text-sm">
              Dense conjoint workspace for persona tradeoffs, utility spreads, and side-by-side preference monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-1">
              {sectionOptions.map((section) => {
                const active = activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={`rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                      active
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>

            <ViewModeToggle
              label="View"
              value={chartView}
              onChange={setChartView}
              options={[
                { value: "chart", label: "Chart View" },
                { value: "table", label: "Table View" }
              ]}
            />

            <button
              type="button"
              onClick={() => setIsStatsMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              aria-expanded={isStatsMenuOpen}
              aria-label="Toggle dashboard statistics"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v-7" />
              </svg>
              Stats
            </button>

            <button
              type="button"
              onClick={() => setIsControlMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              aria-expanded={isControlMenuOpen}
              aria-label="Toggle dashboard controls"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" d="M4 7h16" />
                <path strokeLinecap="round" d="M4 12h16" />
                <path strokeLinecap="round" d="M4 17h16" />
              </svg>
              Controls
            </button>

            {mode === "comparison" ? (
              <button
                type="button"
                onClick={() => setIsInsightsMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                aria-expanded={isInsightsMenuOpen}
                aria-label="Toggle comparison insights"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" />
                </svg>
                Insights
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {isControlMenuOpen ? (
        <div className="absolute right-0 top-[88px] z-30 w-full max-w-xl space-y-3 rounded-3xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur xl:top-[92px]">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Dashboard Controls
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Filters and section visibility
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsControlMenuOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <AttributeFilter
            attributes={attributeOptions}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            selectedAttributeId={selectedAttributeId}
            onAttributeChange={setSelectedAttributeId}
            utilityFilter={utilityFilter}
            onUtilityFilterChange={setUtilityFilter}
            collapsed={isPanelCollapsed("filters")}
            onToggleCollapsed={() => togglePanelCollapsed("filters")}
          />

          <SectionSelector
            sections={sectionOptions}
            selectedSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
            selectionMode="single"
            collapsed={isPanelCollapsed("focus")}
            onToggleCollapsed={() => togglePanelCollapsed("focus")}
          />
        </div>
      ) : null}

      {isStatsMenuOpen ? (
        <div className="absolute right-0 top-[88px] z-20 w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur xl:top-[92px]">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Dashboard Stats
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Dataset, persona, and attribute snapshot
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStatsMenuOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Dataset"
              value={selectedDataset.name}
              detail={`${selectedDataset.personas.length} personas available`}
            />
            <MetricCard
              title="Mode"
              value={mode === "single" ? "Single Persona" : "Comparison"}
              detail={
                mode === "single"
                  ? "Inspect one persona deeply"
                  : "Compare 2-4 personas side by side"
              }
            />
            <MetricCard
              title="Selected Personas"
              value={`${selectedPersonas.length}`}
              detail={selectedPersonas.map((persona) => persona.name).join(", ") || "No personas selected"}
            />
            <MetricCard
              title="Attributes"
              value={`${attributeOptions.length}`}
              detail={`${attributeOptions.reduce((sum, attribute) => sum + attribute.levels.length, 0)} levels across the dataset`}
            />
          </div>
        </div>
      ) : null}

      {isInsightsMenuOpen && mode === "comparison" ? (
        <div className="absolute right-0 top-[88px] z-20 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur xl:right-[148px] xl:top-[92px]">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Comparison Insights
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Secondary rule-based notes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsInsightsMenuOpen(false)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {comparisonInsights.length > 0 ? (
              comparisonInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs leading-5 text-slate-300"
                >
                  {insight.text}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs leading-5 text-slate-400">
                No comparison insights are available yet.
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      {mode === "single" ? (
        activePersona ? (
            <div className="space-y-4 xl:flex xl:min-h-0 xl:flex-col">
              {activeSectionId === "profile" ? (
                <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Active Persona
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">
                        {activePersona.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePanelCollapsed("profile")}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50"
                    >
                      {isPanelCollapsed("profile") ? "Expand" : "Collapse"}
                    </button>
                  </div>
                  {!isPanelCollapsed("profile") ? (
                    <>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {activePersona.description}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {activePersona.attributes.map((attribute) => (
                          <div
                            key={attribute.id}
                            className="rounded-2xl bg-slate-50 p-4"
                          >
                            <p className="text-sm font-medium text-slate-800">
                              {attribute.name}
                            </p>
                            <p className="mt-2 text-xl font-semibold text-slate-900">
                              {Math.round(attribute.importance * 100)}%
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                              importance
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              ) : null}

              {activeSectionId === "levels" ? (
                <AttributeLevels
                  persona={activePersona}
                  searchValue={searchValue}
                  selectedAttributeId={selectedAttributeId}
                  utilityFilter={utilityFilter}
                  className="xl:min-h-0 xl:flex-1"
                  collapsed={isPanelCollapsed("levels")}
                  onToggleCollapsed={() => togglePanelCollapsed("levels")}
                />
              ) : null}
            </div>
        ) : (
          <EmptyState
            title="No persona selected"
            message="Choose a persona to inspect attribute importance and part-worth utilities."
          />
        )
      ) : selectedPersonas.length < 2 ? (
        <EmptyState
          title="Select at least two personas"
          message="Comparison mode needs at least two personas from the selected dataset before charts and summaries can be shown."
        />
      ) : (
        <div className="space-y-4 xl:flex xl:min-h-0 xl:flex-col">
          {activeSectionId === "summary" ? (
            <ComparisonSummary
              personas={selectedPersonas}
              collapsed={isPanelCollapsed("summary")}
              onToggleCollapsed={() => togglePanelCollapsed("summary")}
            />
          ) : null}

          {activeSectionId === "levels" ? (
            <AttributeLevelsComparison
              personas={selectedPersonas}
              chartView={chartView}
              searchValue={searchValue}
              selectedAttributeId={selectedAttributeId}
              utilityFilter={utilityFilter}
              className="xl:min-h-0 xl:flex-1"
              collapsed={isPanelCollapsed("levels")}
              onToggleCollapsed={() => togglePanelCollapsed("levels")}
            />
          ) : null}
        </div>
      )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1800px] xl:h-[calc(100vh-2.5rem)] xl:overflow-hidden">
      <DashboardLayout
        datasetPanel={datasetPanel}
        personaPanel={personaPanel}
        mainPanel={mainPanel}
      />
    </div>
  );
}

export default ConjointDashboard;
