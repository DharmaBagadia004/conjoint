import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function SurveyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get(
          `http://localhost:5000/api/conjoint-surveys/${id}`
        );
        setSurvey(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load this survey.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

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
    </div>
  );
}

export default SurveyDetails;
