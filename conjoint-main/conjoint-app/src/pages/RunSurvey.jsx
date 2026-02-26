import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TOTAL_TASKS = 8;

function RunSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [responses, setResponses] = useState([]);
  const [taskNumber, setTaskNumber] = useState(1);
  const [completed, setCompleted] = useState(false);


useEffect(() => {
  const fetchSurvey = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/conjoint-surveys/${id}`
      );
      setSurvey(res.data);
      generateTask(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchSurvey();
}, [id]);

  const generateRandomProfile = (attributes) => {
    const profile = {};

    attributes.forEach(attr => {
      const randomLevel =
        attr.levels[Math.floor(Math.random() * attr.levels.length)];
      profile[attr.name] = randomLevel.value;
    });

    return profile;
  };

  const generateTask = (surveyData) => {
    const optionA = generateRandomProfile(surveyData.attributes);
    const optionB = generateRandomProfile(surveyData.attributes);

    setCurrentTask({
      optionA,
      optionB
    });
  };

  const handleChoice = (choice) => {
    const newResponse = {
      task: taskNumber,
      chosen: choice,
      optionA: currentTask.optionA,
      optionB: currentTask.optionB
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (taskNumber >= TOTAL_TASKS) {
      saveResponses(updatedResponses);
      setCompleted(true);
      return;
    }

    setTaskNumber(prev => prev + 1);
    generateTask(survey);
  };


const saveResponses = async (finalResponses) => {
  try {
    await axios.post(
      `http://localhost:5000/api/conjoint-surveys/${id}/submit`,
      {
        responses: finalResponses
      }
    );
  } catch (err) {
    console.error(err);
    alert("Error saving responses");
  }
};

if (!survey)
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-500 text-sm">Loading survey...</p>
    </div>
  );
  if (completed) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm text-center max-w-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Survey Completed
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Thank you for participating in this study.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

  return (
  <div className="max-w-5xl mx-auto">
    {/* Header */}
    <div className="mb-10">
      <h1 className="text-2xl font-semibold text-gray-900">
        {survey.title}
      </h1>
      <p className="text-gray-500 text-sm mt-2">
        Please select the option you prefer in each task.
      </p>
    </div>

    {/* Progress */}
    <div className="mb-12">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>
          Task {taskNumber} of {TOTAL_TASKS}
        </span>
        <span>
          {Math.round((taskNumber / TOTAL_TASKS) * 100)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(taskNumber / TOTAL_TASKS) * 100}%`
          }}
        />
      </div>
    </div>

    {/* Task Cards */}
    {currentTask && (
      <div className="flex justify-center gap-10">
        {/* Option A */}
        <div className="bg-white w-96 p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Option A
          </h3>

          <div className="space-y-3">
            {Object.entries(currentTask.optionA).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-500">
                    {key}
                  </span>
                  <span className="font-medium text-gray-900">
                    {value}
                  </span>
                </div>
              )
            )}
          </div>

          <button
            onClick={() => handleChoice("A")}
            className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Choose Option A
          </button>
        </div>

        {/* Option B */}
        <div className="bg-white w-96 p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Option B
          </h3>

          <div className="space-y-3">
            {Object.entries(currentTask.optionB).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-500">
                    {key}
                  </span>
                  <span className="font-medium text-gray-900">
                    {value}
                  </span>
                </div>
              )
            )}
          </div>

          <button
            onClick={() => handleChoice("B")}
            className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Choose Option B
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default RunSurvey;
