import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const shortenLabel = (value, max = 28) => {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
};

function Results() {
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");

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
        setError(
          err?.response?.data?.error ||
            "Unable to generate analysis for this survey yet."
        );
      }
    };

    fetchResults();
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-xl text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Analysis Available
          </h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

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

  const attributeNames = (survey.attributes || []).map((attr) => attr.name);
  const activeAttribute = selectedAttribute || attributeNames[0] || "";

  const utilityData = Object.entries(analysis.utilities || {}).map(
    ([key, value]) => {
      const matchedAttribute =
        attributeNames.find((attrName) =>
          key.startsWith(`${attrName}: `)
        ) || "";

      return {
        attribute: matchedAttribute,
        level: matchedAttribute
          ? key.slice(matchedAttribute.length + 2)
          : key,
        utility: value
      };
    }
  );

  const filteredUtilityData = utilityData
    .filter((row) => row.attribute === activeAttribute)
    .sort((a, b) => b.utility - a.utility);

  const filteredLevelChoiceRateData = (analysis.level_choice_rate || [])
    .filter((row) => row.attribute === activeAttribute)
    .map((row) => ({
      level: row.level,
      choiceRate: row.choice_rate,
      shown: row.shown,
      chosen: row.chosen
    }))
    .sort((a, b) => b.choiceRate - a.choiceRate);

  const utilitiesChartHeight = Math.max(
    280,
    filteredUtilityData.length * 42
  );
  const levelRateChartHeight = Math.max(
    280,
    filteredLevelChoiceRateData.length * 42
  );

  const taskChoiceBiasData = analysis.task_choice_bias || [];
  const modelFit = analysis.model_fit || {
    hit_rate_pct: 0,
    evaluated_tasks: 0,
    ties: 0
  };

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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Respondents</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {analysis.respondents}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Tasks Analyzed</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {analysis.tasks_analyzed}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Model Hit Rate</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {modelFit.hit_rate_pct}%
          </p>
        </div>
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

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-12">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Focus Attribute
        </label>
        <select
          value={activeAttribute}
          onChange={(e) => setSelectedAttribute(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {attributeNames.map((attrName) => (
            <option key={attrName} value={attrName}>
              {attrName}
            </option>
          ))}
        </select>
      </div>

      {/* Level Choice Rate */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Level Choice Rate (%)
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {activeAttribute}: how often each level was chosen when shown.
        </p>

        <div style={{ height: `${levelRateChartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredLevelChoiceRateData}
              layout="vertical"
              margin={{ left: 16, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="level"
                width={200}
                tickFormatter={(value) => shortenLabel(value)}
              />
              <Tooltip />
              <Bar dataKey="choiceRate" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Utilities Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Part-Worth Utilities
        </h2>

        <div style={{ height: `${utilitiesChartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredUtilityData}
              layout="vertical"
              margin={{ left: 16, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="level"
                width={200}
                tickFormatter={(value) => shortenLabel(value)}
              />
              <Tooltip />
              <Bar dataKey="utility" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* A/B Choice Bias by Task */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Option Bias by Task (%)
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Checks whether respondents systematically prefer Option A or B.
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={taskChoiceBiasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="task" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="option_a_pct"
                stroke="#4f46e5"
                strokeWidth={2}
                name="Option A %"
              />
              <Line
                type="monotone"
                dataKey="option_b_pct"
                stroke="#f97316"
                strokeWidth={2}
                name="Option B %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Results;
