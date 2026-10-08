import { useMemo, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DatasetPanel from "../components/dashboard/DatasetPanel";
import PersonaPanel from "../components/dashboard/PersonaPanel";
import ViewModeToggle from "../components/dashboard/ViewModeToggle";
import AttributeFilter from "../components/dashboard/AttributeFilter";
import AttributeLevels from "../components/dashboard/AttributeLevels";
import AttributeLevelsComparison from "../components/dashboard/AttributeLevelsComparison";
import PreferenceInsights from "../components/dashboard/PreferenceInsights";
import PlotNavigation from "../components/dashboard/PlotNavigation";
import EmptyState from "../components/dashboard/EmptyState";
import { datasets } from "../data/conjointDashboardData";

const MAX_COMPARISON_PERSONAS = 4;

const SINGLE_SECTIONS = [
  { id: "highlights", label: "Persona highlights", description: "Top attributes & preferred levels" },
  { id: "levels", label: "Level preferences", description: "One attribute at a time" },
];

const COMPARISON_SECTIONS = [
  { id: "product", label: "Product priorities", description: "Consolidated top & bottom three" },
  { id: "levels", label: "Level comparison", description: "Compare utilities across personas" },
  { id: "parallel", label: "Parallel coordinates", description: "Compare persona patterns" },
  { id: "ranks", label: "Rank distribution", description: "First, second, third & beyond" },
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
  const [activeSectionId, setActiveSectionId] = useState("highlights");
  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0],
    [selectedDatasetId]
  );

  const selectedPersonas = useMemo(() => {
    if (!selectedDataset) {
      return [];
    }

    const selectedIdSet = new Set(selectedPersonaIds);
    return selectedDataset.personas.filter((persona) => selectedIdSet.has(persona.id));
  }, [selectedDataset, selectedPersonaIds]);

  const activePersona = selectedPersonas[0] ?? selectedDataset.personas[0];
  const attributeOptions = selectedDataset.personas[0]?.attributes ?? [];
  const sections = mode === "single" ? SINGLE_SECTIONS : COMPARISON_SECTIONS;
  const sectionIndex = sections.findIndex((section) => section.id === activeSectionId);
  const onPreviousView = sectionIndex > 0 ? () => setActiveSectionId(sections[sectionIndex - 1].id) : undefined;
  const onNextView = sectionIndex < sections.length - 1 ? () => setActiveSectionId(sections[sectionIndex + 1].id) : undefined;
  const insightPersonas = mode === "single" ? [activePersona].filter(Boolean) : selectedPersonas;
  const resetView = (dataset, nextMode) => {
    setSelectedPersonaIds(getDefaultPersonaSelection(dataset, nextMode));
    setSelectedAttributeId("all");
    setSearchValue("");
    setUtilityFilter("all");
    setSelectionWarning("");
    setActiveSectionId(nextMode === "single" ? SINGLE_SECTIONS[0].id : COMPARISON_SECTIONS[0].id);
  };

  const handleDatasetChange = (datasetId) => {
    setSelectedDatasetId(datasetId);
    resetView(datasets.find((dataset) => dataset.id === datasetId), mode);
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetView(selectedDataset, nextMode);
  };

  const handleTogglePersona = (personaId) => {
    setSelectionWarning("");

    if (mode === "single") {
      setSelectedPersonaIds([personaId]);
      return;
    }

    if (selectedPersonaIds.includes(personaId)) {
      setSelectedPersonaIds(selectedPersonaIds.filter((id) => id !== personaId));
    } else if (selectedPersonaIds.length >= MAX_COMPARISON_PERSONAS) {
      setSelectionWarning(`Select up to ${MAX_COMPARISON_PERSONAS} personas at a time for a clean comparison.`);
    } else {
      setSelectedPersonaIds([...selectedPersonaIds, personaId]);
    }
  };

  const datasetPanel = (
    <DatasetPanel
      datasets={datasets}
      selectedDatasetId={selectedDataset.id}
      onSelect={handleDatasetChange}
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
    />
  );

  const mainPanel = (
    <div className="space-y-5">
      <header className="analysis-header rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Analysis dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{selectedDataset.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{selectedDataset.description}</p>
        <p className="mt-2 text-xs text-slate-400">{attributeOptions.length} attributes &middot; {attributeOptions.reduce((sum, a) => sum + a.levels.length, 0)} levels &middot; {selectedDataset.personas.length} personas available</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {mode === "single" ? activePersona?.name : `${selectedPersonas.length} personas selected`}
          <span className="text-slate-500">/</span>
          {mode === "single" ? "Individual analysis" : "Persona comparison"}
        </div>
      </header>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_190px]">
        <nav aria-label="Analysis charts" className="flex flex-wrap gap-2 2xl:col-start-2 2xl:row-start-1 2xl:flex-col">
          {sections.map((section, index) => (
            <button key={section.id} type="button" aria-current={activeSectionId === section.id ? "page" : undefined}
              onClick={() => setActiveSectionId(section.id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${activeSectionId === section.id ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-transparent text-slate-500 hover:bg-slate-100"}`}>
              <span className="text-sm font-semibold"><span className="mr-2 text-xs opacity-60">0{index + 1}</span>{section.label}</span>
              <span className="mt-1 hidden text-xs 2xl:block">{section.description}</span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 space-y-4 2xl:col-start-1 2xl:row-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500" aria-live="polite">View {sectionIndex + 1} of {sections.length} &middot; {sections[sectionIndex].label}</p>
          </div>
          {mode === "comparison" && selectedPersonas.length < 2 ? (
            <EmptyState title="Select at least two personas" message="Choose two to four personas in the sidebar to compare preferences and rankings." />
          ) : !insightPersonas.length ? (
            <EmptyState title="No persona selected" message="Choose a persona to explore preferences." />
          ) : activeSectionId === "levels" ? (
            <>
              <AttributeFilter attributes={attributeOptions} searchValue={searchValue} onSearchChange={setSearchValue}
                selectedAttributeId={selectedAttributeId} onAttributeChange={setSelectedAttributeId}
                utilityFilter={utilityFilter} onUtilityFilterChange={setUtilityFilter} />
              {mode === "comparison" ? (
                <>
                  <ViewModeToggle value={chartView} onChange={setChartView} options={[{ value: "chart", label: "Chart view" }, { value: "table", label: "Table view" }]} />
                  <AttributeLevelsComparison key={selectedDataset.id} personas={selectedPersonas} chartView={chartView} searchValue={searchValue} selectedAttributeId={selectedAttributeId} utilityFilter={utilityFilter} onPreviousView={onPreviousView} onNextView={onNextView} />
                </>
              ) : (
                <AttributeLevels key={activePersona.id} persona={activePersona} searchValue={searchValue} selectedAttributeId={selectedAttributeId} utilityFilter={utilityFilter} onPreviousView={onPreviousView} onNextView={onNextView} />
              )}
            </>
          ) : (
            <PlotNavigation onPrevious={onPreviousView} onNext={onNextView}>
              <PreferenceInsights key={selectedDataset.id} view={activeSectionId} personas={insightPersonas} />
            </PlotNavigation>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="analysis-dashboard mx-auto max-w-[1600px]">
      <DashboardLayout
        datasetPanel={datasetPanel}
        personaPanel={personaPanel}
        mainPanel={mainPanel}
      />
    </div>
  );
}

export default ConjointDashboard;
