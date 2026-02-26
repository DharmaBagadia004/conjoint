import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);

  const loadSurveys = () => {
    const stored = JSON.parse(localStorage.getItem("surveys")) || [];
    setSurveys(stored);
  };

  useEffect(() => {
  const fetchSurveys = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/conjoint-surveys"
      );
      setSurveys(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchSurveys();
}, []);

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
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-900">
              {survey.title}
            </h2>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Created {new Date(survey.created_at).toLocaleDateString()}
          </p>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => navigate(`/run/${survey.id}`)}
              className="text-indigo-600 text-sm font-medium hover:underline"
            >
              Run Survey
            </button>

            <button
              onClick={() => navigate(`/results/${survey.id}`)}
              className="text-gray-600 text-sm font-medium hover:underline"
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
