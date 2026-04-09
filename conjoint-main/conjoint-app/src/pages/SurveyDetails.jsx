import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function SurveyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [priceComponents, setPriceComponents] = useState([]);
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
      } catch (err) {
        console.error(err);
        setError("Unable to load this survey.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

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
                  Choose which attributes to include. Included weights auto-adjust to total 100%.
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
