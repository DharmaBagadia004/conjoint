import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

function Results() {
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const surveyRes = await axios.get(
          `http://localhost:5000/api/conjoint-surveys/${id}`
        );
        setSurvey(surveyRes.data);

        const estimateRes = await axios.get(
          `http://localhost:5000/api/conjoint-surveys/${id}/estimate`
        );
        setAnalysis(estimateRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchResults();
  }, [id]);

  if (!survey || !analysis)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-sm">Loading analysis...</p>
      </div>
    );

  const importanceData = Object.entries(
    analysis.importance
  ).map(([key, value]) => ({
    attribute: key,
    importance: value
  }));

  const utilityData = Object.entries(
    analysis.utilities
  ).map(([key, value]) => ({
    level: key,
    utility: value
  }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-gray-900">
          Results
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {survey.title}
        </p>
      </div>

      {/* Importance Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Attribute Importance (%)
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={importanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attribute" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="importance" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Utilities Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Part-Worth Utilities
        </h2>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="level"
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utility" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Results;