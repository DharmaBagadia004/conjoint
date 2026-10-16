import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MAX_COMPARISON_PERSONAS = 5;

const SINGLE_SECTIONS = [
  { id: "highlights", label: "Persona highlights", description: "Top attributes & preferred levels" },
  { id: "levels", label: "Level preferences", description: "One attribute at a time" },
];

const COMPARISON_SECTIONS = [
  { id: "product", label: "Product priorities", description: "Consolidated top & bottom three" },
  { id: "levels", label: "Level comparison", description: "Compare utilities across personas" },
  { id: "parallel", label: "Parallel coordinates", description: "Compare persona patterns" },
  { id: "ranks", label: "Attribute rank comparison", description: "Persona ranks for each attribute" },
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

function toDashboardPersona(id, name, description, survey, analysis) {
  return {
    id,
    sourcePersonaId: id.replace(/^persona-/, ""),
    name,
    description,
    respondents: analysis.respondents,
    tasksAnalyzed: analysis.tasks_analyzed,
    attributes: survey.attributes.map((attribute) => ({
      id: String(attribute.id),
      name: attribute.name,
      importance: Number(analysis.importance?.[attribute.name] || 0) / 100,
      levels: attribute.levels.map((level) => ({
        id: String(level.id),
        name: level.value,
        utility: Number(analysis.utilities?.[`${attribute.name}: ${level.value}`] || 0)
      }))
    }))
  };
}

async function getEstimate(surveyId, params) {
  try {
    const response = await axios.get(`${API_URL}/conjoint-surveys/${surveyId}/estimate`, { params });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 400 && error?.response?.data?.error === "No responses available for analysis") {
      return null;
    }
    throw error;
  }
}

async function loadDashboardDataset(surveySummary) {
  const [surveyResponse, personasResponse] = await Promise.all([
    axios.get(`${API_URL}/conjoint-surveys/${surveySummary.id}`),
    axios.get(`${API_URL}/conjoint-surveys/${surveySummary.id}/personas`)
  ]);

  const survey = surveyResponse.data;
  const simulatedPersonas = await Promise.all(personasResponse.data.map(async (persona) => {
    const [syntheticAnalysis, llmAnalysis] = await Promise.all([
      getEstimate(survey.id, { source: "synthetic", persona_id: persona.id }),
      getEstimate(survey.id, { source: "llm", persona_id: persona.id })
    ]);
    const analysis = llmAnalysis || syntheticAnalysis;
    if (!analysis) return null;
    return toDashboardPersona(
      `persona-${persona.id}`,
      persona.name,
      `${analysis.respondents} runs`,
      survey,
      analysis
    );
  }));
  const personas = simulatedPersonas.filter(Boolean);

  return {
    id: `survey-${survey.id}`,
    surveyId: survey.id,
    name: survey.title,
    description: `${survey.attributes.length} attributes \u00b7 ${personas.length} response group${personas.length === 1 ? "" : "s"}`,
    attributes: survey.attributes.map((attribute) => ({ id: String(attribute.id), name: attribute.name, levels: attribute.levels })),
    priceFormula: survey.price_formula,
    priceFormulaDisabledReason: survey.price_formula_disabled_reason,
    personas
  };
}

function ConjointDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedSurveyId = searchParams.get("surveyId");
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [mode, setMode] = useState("single");
  const [chartView, setChartView] = useState("chart");
  const [selectedPersonaIds, setSelectedPersonaIds] = useState(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [priceSettingsOpen, setPriceSettingsOpen] = useState(false);
  const [priceComponents, setPriceComponents] = useState([]);
  const [isSavingPriceSettings, setIsSavingPriceSettings] = useState(false);
  const [priceSettingsError, setPriceSettingsError] = useState("");
  const [priceSettingsSaved, setPriceSettingsSaved] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [utilityFilter, setUtilityFilter] = useState("all");
  const [selectionWarning, setSelectionWarning] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("highlights");
  const [isRunningPersonaTests, setIsRunningPersonaTests] = useState(false);
  const [personaTestMessage, setPersonaTestMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadDatasets = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await axios.get(`${API_URL}/conjoint-surveys`);
        const loadedDatasets = await Promise.all(response.data.map(loadDashboardDataset));
        if (!isMounted) return;
        setDatasets(loadedDatasets);
        const requestedDataset = loadedDatasets.find((dataset) => String(dataset.surveyId) === requestedSurveyId);
        const initialDataset = requestedDataset || loadedDatasets[0];
        setSelectedDatasetId(initialDataset?.id || "");
        setSelectedPersonaIds(getDefaultPersonaSelection(initialDataset, "single"));
      } catch (error) {
        console.error(error);
        if (isMounted) setLoadError("Unable to load surveys from the backend. Check that the backend server is running.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadDatasets();
    return () => { isMounted = false; };
  }, [requestedSurveyId]);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0] ?? null,
    [datasets, selectedDatasetId]
  );

  useEffect(() => {
    setPriceComponents(selectedDataset?.priceFormula?.components || []);
    setPriceSettingsError("");
    setPriceSettingsSaved(false);
    setPriceSettingsOpen(false);
  }, [selectedDataset?.id]);

  useEffect(() => {
    if (!priceSettingsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPriceSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [priceSettingsOpen]);

  const selectedPersonas = useMemo(() => {
    if (!selectedDataset) {
      return [];
    }

    const selectedIdSet = new Set(selectedPersonaIds);
    return selectedDataset.personas.filter((persona) => selectedIdSet.has(persona.id));
  }, [selectedDataset, selectedPersonaIds]);

  const activePersona = selectedPersonas[0] ?? selectedDataset?.personas?.[0];
  const attributeOptions = selectedDataset?.personas?.[0]?.attributes ?? selectedDataset?.attributes ?? [];
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

  const updatePriceComponent = (attribute, update) => {
    setPriceSettingsSaved(false);
    setPriceComponents((current) => current.map((component) =>
      component.attribute === attribute ? { ...component, ...update } : component
    ));
  };

  const savePriceSettings = async () => {
    const included = priceComponents.filter((component) => component.included);
    if (!selectedDataset || included.length === 0) {
      setPriceSettingsError("Include at least one attribute in the price calculation.");
      return;
    }

    const weightTotal = included.reduce((total, component) => total + Math.max(Number(component.weight) || 0, 0), 0);
    const normalizedComponents = priceComponents.map((component) => ({
      ...component,
      weight: component.included
        ? (weightTotal > 0 ? Math.max(Number(component.weight) || 0, 0) / weightTotal : 1 / included.length)
        : 0
    }));

    try {
      setIsSavingPriceSettings(true);
      setPriceSettingsError("");
      const response = await axios.patch(
        `${API_URL}/conjoint-surveys/${selectedDataset.surveyId}/price-config`,
        { components: normalizedComponents.map(({ attribute, weight, included: isIncluded }) => ({ attribute, weight, included: isIncluded })) }
      );
      setDatasets((current) => current.map((dataset) => dataset.id === selectedDataset.id
        ? { ...dataset, priceFormula: response.data.price_formula }
        : dataset
      ));
      setPriceComponents(response.data.price_formula?.components || []);
      setPriceSettingsSaved(true);
    } catch (error) {
      console.error(error);
      setPriceSettingsError(error?.response?.data?.error || "Unable to save price settings.");
    } finally {
      setIsSavingPriceSettings(false);
    }
  };

  const runSelectedPersonaTests = async () => {
    if (!selectedDataset || selectedPersonas.length === 0 || isRunningPersonaTests) return;

    try {
      setIsRunningPersonaTests(true);
      setPersonaTestMessage("");
      for (const persona of selectedPersonas) {
        await axios.post(
          `${API_URL}/conjoint-surveys/${selectedDataset.surveyId}/personas/${persona.sourcePersonaId}/run`,
          { num_tasks: 8 }
        );
      }

      const refreshedDataset = await loadDashboardDataset({
        id: selectedDataset.surveyId,
        title: selectedDataset.name
      });
      setDatasets((current) => current.map((dataset) =>
        dataset.id === refreshedDataset.id ? refreshedDataset : dataset
      ));
      setPersonaTestMessage(`Test completed for ${selectedPersonas.length} ${selectedPersonas.length === 1 ? "persona" : "personas"}.`);
    } catch (error) {
      console.error(error);
      setPersonaTestMessage(error?.response?.data?.error || "Unable to run the selected persona test(s).");
    } finally {
      setIsRunningPersonaTests(false);
    }
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
      selectedDatasetId={selectedDataset?.id || ""}
      onSelect={handleDatasetChange}
    />
  );

  const personaPanel = (
    <PersonaPanel
      personas={selectedDataset?.personas || []}
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
      {isLoading ? <EmptyState title="Loading surveys" message="Loading created surveys and their response analysis." /> : null}
      {!isLoading && loadError ? <EmptyState title="Unable to load dashboard" message={loadError} /> : null}
      {!isLoading && !loadError && !selectedDataset ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No surveys yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Create or import a survey to see it in this dashboard.</p>
          <button type="button" onClick={() => navigate("/create")} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create a survey</button>
        </div>
      ) : null}
      {!isLoading && !loadError && selectedDataset ? <>
      <header className="analysis-header rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Analysis dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{selectedDataset.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{selectedDataset.description}</p>
            <p className="mt-2 text-xs text-slate-400">{attributeOptions.length} attributes &middot; {attributeOptions.reduce((sum, a) => sum + a.levels.length, 0)} levels &middot; {selectedDataset.personas.length} response groups available</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {mode === "single" ? activePersona?.name : `${selectedPersonas.length} personas selected`}
              <span className="text-slate-500">/</span>
              {mode === "single" ? "Individual analysis" : "Persona comparison"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(`/personas/${selectedDataset.surveyId}`)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15">
              Create persona
            </button>
            <button type="button" onClick={runSelectedPersonaTests} disabled={!selectedPersonas.length || isRunningPersonaTests} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
              {isRunningPersonaTests ? "Running persona test(s)..." : mode === "comparison" ? "Run selected persona tests" : "Run persona test"}
            </button>
            {selectedDataset.priceFormula || selectedDataset.priceFormulaDisabledReason ? (
              <button type="button" onClick={() => setPriceSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15">
                Study settings
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {priceSettingsOpen && (selectedDataset.priceFormula || selectedDataset.priceFormulaDisabledReason) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPriceSettingsOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="price-settings-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 id="price-settings-title" className="text-lg font-semibold text-slate-900">Study settings</h2>
              <p className="mt-1 text-sm text-slate-500">Price weights for {selectedDataset.name}</p>
            </div>
            <button type="button" onClick={() => setPriceSettingsOpen(false)} aria-label="Close study settings" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Close
            </button>
          </div>
          <div className="p-5">
          {selectedDataset.priceFormula ? (
            <>
              <div className="mb-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current price model</p>
                <p className="mt-2 break-words text-sm text-slate-700">{selectedDataset.priceFormula.display_equation}</p>
              </div>
              <p className="mb-4 text-sm text-slate-600">Choose which attributes influence generated prices. Included weights are normalized to total 100% when saved.</p>
              <div className="space-y-3">
                {priceComponents.map((component) => (
                  <div key={component.attribute} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_auto_130px] sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{component.attribute}</p>
                      <p className="mt-1 text-xs text-slate-500">{component.direction === "descending" ? "Higher levels lower the generated price" : "Higher levels raise the generated price"}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={component.included} onChange={(event) => updatePriceComponent(component.attribute, { included: event.target.checked, weight: event.target.checked && Number(component.weight) === 0 ? 1 : component.weight })} />
                      Include
                    </label>
                    <label className="text-xs font-medium text-slate-600">Weight (%)
                      <input type="number" min="0" max="100" step="1" value={Math.round((Number(component.weight) || 0) * 100)} disabled={!component.included} onChange={(event) => updatePriceComponent(component.attribute, { weight: Math.max(0, Math.min(100, Number(event.target.value) || 0)) / 100 })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
                    </label>
                  </div>
                ))}
              </div>
              {priceSettingsError ? <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{priceSettingsError}</p> : null}
              {priceSettingsSaved ? <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Price settings saved.</p> : null}
              <button type="button" onClick={savePriceSettings} disabled={isSavingPriceSettings} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                {isSavingPriceSettings ? "Saving..." : "Save price settings"}
              </button>
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{selectedDataset.priceFormulaDisabledReason}</p>
          )}
          </div>
        </section>
        </div>
      ) : null}

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
          {personaTestMessage ? <p role="status" className={`rounded-lg px-3 py-2 text-sm ${personaTestMessage.startsWith("Test completed") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{personaTestMessage}</p> : null}
          {selectedDataset.personas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">No response analysis yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Run the survey to collect responses, or create a persona to run a simulated test. Analysis charts appear after responses are available.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => navigate(`/run/${selectedDataset.surveyId}`)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Run this survey</button>
                <button type="button" onClick={() => navigate(`/personas/${selectedDataset.surveyId}`)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Create a persona</button>
              </div>
            </div>
          ) : mode === "comparison" && selectedPersonas.length < 2 ? (
            <EmptyState title="Select at least two personas" message="Choose two to five personas in the sidebar to compare preferences and rankings." />
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
      </> : null}
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
