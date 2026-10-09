import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function SurveyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [priceComponents, setPriceComponents] = useState([]);
  const [prohibitedPairs, setProhibitedPairs] = useState([]);
  const [pairDraft, setPairDraft] = useState({ attribute_a: "", level_a: "", attribute_b: "", level_b: "" });
  const [designStats, setDesignStats] = useState(null);
  const [isSavingProhibitedPairs, setIsSavingProhibitedPairs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPriceConfig, setIsSavingPriceConfig] = useState(false);
  const [error, setError] = useState("");

  const normalizeComponents = (components) => {
    const included = components.filter((component) => component.included);
    if (included.length === 0) {
      return components.map((component) => ({ ...component, weight: 0 }));
    }

    const positiveTotal = included.reduce(
      (sum, component) => sum + Math.max(Number(component.weight) || 0, 0),
      0
    );

    if (positiveTotal <= 0) {
      const evenWeight = 1 / included.length;
      return components.map((component) => ({
        ...component,
        weight: component.included ? evenWeight : 0
      }));
    }

    return components.map((component) => ({
      ...component,
      weight: component.included
        ? Math.max(Number(component.weight) || 0, 0) / positiveTotal
        : 0
    }));
  };

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get(
          `http://localhost:5000/api/conjoint-surveys/${id}`
        );
        setSurvey(response.data);
        setPriceComponents(response.data.price_formula?.components || []);
        const attributes = response.data.attributes || [];
        setProhibitedPairs(response.data.prohibited_pairs || []);
        setDesignStats(response.data.design_stats || null);
        if (attributes.length >= 2) {
          setPairDraft({
            attribute_a: String(attributes[0].id),
            level_a: String(attributes[0].levels[0]?.id || ""),
            attribute_b: String(attributes[1].id),
            level_b: String(attributes[1].levels[0]?.id || "")
          });
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load this survey.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

  const addProhibitedPair = () => {
    if (!pairDraft.attribute_a || !pairDraft.level_a || !pairDraft.attribute_b || !pairDraft.level_b) return;
    setProhibitedPairs((current) => [...current, {
      attribute_a: Number(pairDraft.attribute_a),
      level_a: Number(pairDraft.level_a),
      attribute_b: Number(pairDraft.attribute_b),
      level_b: Number(pairDraft.level_b)
    }]);
  };

  const saveProhibitedPairs = async () => {
    try {
      setIsSavingProhibitedPairs(true);
      const response = await axios.patch(
        `http://localhost:5000/api/conjoint-surveys/${id}/prohibited-pairs`,
        { prohibited_pairs: prohibitedPairs.map(({ attribute_a, level_a, attribute_b, level_b }) => ({ attribute_a, level_a, attribute_b, level_b })) }
      );
      setProhibitedPairs(response.data.prohibited_pairs || []);
      setDesignStats(response.data.design_stats || null);
      setSurvey((current) => ({
        ...current,
        price_formula: response.data.price_formula,
        price_formula_disabled_reason: response.data.price_formula_disabled_reason
      }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Unable to save profile restrictions.");
    } finally {
      setIsSavingProhibitedPairs(false);
    }
  };

  const attributes = survey?.attributes || [];
  const attributeA = attributes.find((attribute) => String(attribute.id) === pairDraft.attribute_a);
  const attributeB = attributes.find((attribute) => String(attribute.id) === pairDraft.attribute_b);

  const updateWeight = (attribute, nextPercent) => {
    const nextValue = Number(nextPercent);
    const updated = priceComponents.map((component) =>
      component.attribute === attribute
        ? {
            ...component,
            included: true,
            weight: Number.isFinite(nextValue) ? nextValue / 100 : component.weight
          }
        : component
    );
    setPriceComponents(normalizeComponents(updated));
  };

  const toggleIncluded = (attribute, included) => {
    const currentIncluded = priceComponents.filter((component) => component.included);
    const fallbackWeight = currentIncluded.length > 0 ? 1 / (currentIncluded.length + 1) : 1;
    const updated = priceComponents.map((component) =>
      component.attribute === attribute
        ? {
            ...component,
            included,
            weight: included ? (component.weight > 0 ? component.weight : fallbackWeight) : 0
          }
        : component
    );
    setPriceComponents(normalizeComponents(updated));
  };

  const savePriceConfig = async () => {
    try {
      setIsSavingPriceConfig(true);
      const normalized = normalizeComponents(priceComponents);
      const response = await axios.patch(
        `http://localhost:5000/api/conjoint-surveys/${id}/price-config`,
        {
          components: normalized.map((component) => ({
            attribute: component.attribute,
            included: component.included,
            weight: component.weight
          }))
        }
      );

      setPriceComponents(response.data.price_formula?.components || []);
      setSurvey((prev) => ({
        ...prev,
        price_formula: response.data.price_formula
      }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Unable to save price settings.");
    } finally {
      setIsSavingPriceConfig(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate-500">Loading survey details...</p>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Survey Unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Survey Structure
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {survey.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This view shows the attributes configured for this survey.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(survey.attributes || []).map((attribute) => (
          <article
            key={attribute.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Attribute
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">
              {attribute.name}
            </h2>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700">Choice Design</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Prohibited level pairs</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Prevent unrealistic combinations from appearing together in one vehicle profile. Use these restrictions sparingly so the attributes can still be compared independently.
            </p>
          </div>
          <button
            onClick={saveProhibitedPairs}
            disabled={isSavingProhibitedPairs}
            className="rounded-full bg-amber-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProhibitedPairs ? "Saving..." : "Save Restrictions"}
          </button>
        </div>

        {designStats && (
          <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
            {designStats.valid_profiles_capped
              ? `At least ${designStats.valid_profiles.toLocaleString()} of ${designStats.total_profiles.toLocaleString()} possible profiles remain.`
              : `${designStats.valid_profiles.toLocaleString()} of ${designStats.total_profiles.toLocaleString()} possible profiles remain.`}
          </p>
        )}
        {survey.price_formula_disabled_reason && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900">
            {survey.price_formula_disabled_reason}
          </p>
        )}

        <div className="mt-5 grid gap-3 rounded-2xl border border-amber-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto_1fr_1fr_auto] md:items-end">
          <label className="text-xs font-medium text-slate-600">Attribute
            <select value={pairDraft.attribute_a} onChange={(event) => {
              const next = attributes.find((attribute) => String(attribute.id) === event.target.value);
              setPairDraft((current) => {
                const nextB = current.attribute_b === event.target.value
                  ? attributes.find((attribute) => String(attribute.id) !== event.target.value)
                  : attributes.find((attribute) => String(attribute.id) === current.attribute_b);
                return {
                  ...current,
                  attribute_a: event.target.value,
                  level_a: String(next?.levels[0]?.id || ""),
                  attribute_b: String(nextB?.id || ""),
                  level_b: String(nextB?.levels[0]?.id || "")
                };
              });
            }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {attributes.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Level
            <select value={pairDraft.level_a} onChange={(event) => setPairDraft((current) => ({ ...current, level_a: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {(attributeA?.levels || []).map((level) => <option key={level.id} value={level.id}>{level.value}</option>)}
            </select>
          </label>
          <span className="pb-2 text-center text-sm text-slate-500">with</span>
          <label className="text-xs font-medium text-slate-600">Attribute
            <select value={pairDraft.attribute_b} onChange={(event) => {
              const next = attributes.find((attribute) => String(attribute.id) === event.target.value);
              setPairDraft((current) => ({ ...current, attribute_b: event.target.value, level_b: String(next?.levels[0]?.id || "") }));
            }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {attributes.filter((attribute) => String(attribute.id) !== pairDraft.attribute_a).map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Level
            <select value={pairDraft.level_b} onChange={(event) => setPairDraft((current) => ({ ...current, level_b: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {(attributeB?.levels || []).map((level) => <option key={level.id} value={level.id}>{level.value}</option>)}
            </select>
          </label>
          <button onClick={addProhibitedPair} disabled={attributes.length < 2} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50">Add pair</button>
        </div>

        {prohibitedPairs.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {prohibitedPairs.map((pair, index) => {
              const leftAttribute = attributes.find((attribute) => attribute.id === Number(pair.attribute_a));
              const rightAttribute = attributes.find((attribute) => attribute.id === Number(pair.attribute_b));
              const leftLevel = leftAttribute?.levels.find((level) => level.id === Number(pair.level_a));
              const rightLevel = rightAttribute?.levels.find((level) => level.id === Number(pair.level_b));
              return (
                <li key={`${pair.attribute_a}-${pair.level_a}-${pair.attribute_b}-${pair.level_b}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
                  <span>{leftAttribute?.name}: <strong>{leftLevel?.value}</strong> + {rightAttribute?.name}: <strong>{rightLevel?.value}</strong></span>
                  <button onClick={() => setProhibitedPairs((current) => current.filter((_, pairIndex) => pairIndex !== index))} className="text-sm font-medium text-rose-700 hover:underline">Remove</button>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-4 text-sm text-slate-500">No combinations are currently restricted.</p>}
      </section>

      {survey.price_formula && (
        <section className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
            Price Equation
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            {survey.price_formula.price_attribute}
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            {survey.price_formula.equation}
          </p>
          <div className="mt-4 rounded-2xl bg-white p-4 font-mono text-sm text-slate-800">
            {survey.price_formula.display_equation}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Min Price
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {survey.price_formula.min_price}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Max Price
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {survey.price_formula.max_price}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Weighted Inputs
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {survey.price_formula.components.length}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {survey.price_formula.components.map((component) => (
              <article
                key={component.attribute}
                className="rounded-2xl bg-white p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {component.attribute}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Weight: {component.weight.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Included: {component.included ? "Yes" : "No"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Direction: {component.direction}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit Equation Inputs
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose which attributes affect price. Categorical price levels are assigned from their weighted scores. For this to reflect vehicle tiers, order Brand levels from economy to premium and price levels from low to high. Brand starts with a 50% weight when no custom weights are configured.
                </p>
              </div>

              <button
                onClick={savePriceConfig}
                disabled={isSavingPriceConfig}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPriceConfig ? "Saving..." : "Save Price Settings"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {priceComponents.map((component) => (
                <div
                  key={component.attribute}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[minmax(0,1.2fr)_120px_120px_1fr]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {component.attribute}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {component.direction === "descending" ? "Lower is better" : "Higher is better"}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={component.included}
                      onChange={(e) => toggleIncluded(component.attribute, e.target.checked)}
                    />
                    Include
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(component.weight * 100)}
                    onChange={(e) => updateWeight(component.attribute, e.target.value)}
                    disabled={!component.included}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <div className="flex items-center">
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.round(component.weight * 100)}%` }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium text-slate-700">
                      {Math.round(component.weight * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default SurveyDetails;
