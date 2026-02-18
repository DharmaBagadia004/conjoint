import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
    const stored = JSON.parse(localStorage.getItem("surveys")) || [];
    const found = stored.find(s => s.id === id);
    setSurvey(found);

    if (found) {
      generateTask(found);
    }
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

  const saveResponses = (finalResponses) => {
    const existing =
      JSON.parse(localStorage.getItem("responses")) || [];

    const newEntry = {
      surveyId: id,
      timestamp: new Date(),
      responses: finalResponses
    };

    localStorage.setItem(
      "responses",
      JSON.stringify([...existing, newEntry])
    );
  };

  if (!survey) return <p>Loading...</p>;

  if (completed) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Survey Completed</h2>
        <p>Thank you for participating.</p>
        <button onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>{survey.title}</h1>
      <h3>
        Task {taskNumber} of {TOTAL_TASKS}
      </h3>

      {currentTask && (
        <div style={{ display: "flex", gap: "40px", marginTop: "30px" }}>
          <div>
            <h3>Option A</h3>
            {Object.entries(currentTask.optionA).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))}
            <button onClick={() => handleChoice("A")}>
              Choose A
            </button>
          </div>

          <div>
            <h3>Option B</h3>
            {Object.entries(currentTask.optionB).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))}
            <button onClick={() => handleChoice("B")}>
              Choose B
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunSurvey;
