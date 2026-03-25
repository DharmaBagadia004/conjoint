import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [deletingSurveyId, setDeletingSurveyId] = useState(null);

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/conjoint-surveys"
      );
      setSurveys(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
  fetchSurveys();
}, [fetchSurveys]);

  const deleteSurvey = async (survey) => {
    const confirmed = window.confirm(
      `Delete survey "${survey.title}"?`
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSurveyId(survey.id);
      await axios.delete(
        `http://localhost:5000/api/conjoint-surveys/${survey.id}`
      );
      await fetchSurveys();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Unable to delete survey.");
    } finally {
      setDeletingSurveyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
  {/* Header */}
  <div className="flex justify-between items-center mb-12">
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">
        Surveys
      </h1>
      <p className="text-gray-500 mt-2 text-sm">
        Create, manage and analyze conjoint studies
      </p>
    </div>

    <button
      onClick={() => navigate("/create")}
      className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
    >
      + Create Survey
    </button>
  </div>

  {/* Empty State */}
  {surveys.length === 0 ? (
    <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
      <h2 className="text-lg font-medium text-gray-900">
        No surveys yet
      </h2>
      <p className="text-gray-500 mt-2 text-sm">
        Start by creating your first conjoint study.
      </p>

      <button
        onClick={() => navigate("/create")}
        className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Create First Survey
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-8">
      {surveys.map((survey) => (
        <div
          key={survey.id}
          onClick={() => navigate(`/surveys/${survey.id}`)}
          className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteSurvey(survey);
            }}
            disabled={deletingSurveyId === survey.id}
            className="absolute right-4 top-4 z-10 rounded-full border border-transparent bg-white/90 p-2 text-slate-400 shadow-sm opacity-0 ring-1 ring-slate-200 backdrop-blur transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-60"
            aria-label={`Delete survey ${survey.title}`}
            title="Delete survey"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
            </svg>
          </button>

          <div className="pr-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {survey.title}
            </h2>
          </div>

          <p className="text-sm text-slate-500 mt-3">
            Created {new Date(survey.created_at).toLocaleDateString()}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/run/${survey.id}`);
              }}
              className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700 text-sm font-medium transition hover:bg-indigo-100"
            >
              Run Survey
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/personas/${survey.id}`);
              }}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 text-sm font-medium transition hover:bg-emerald-100"
            >
              Run Persona
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/results/${survey.id}`);
              }}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 text-sm font-medium transition hover:bg-slate-200"
            >
              View Results
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
  );
}

export default Dashboard;
