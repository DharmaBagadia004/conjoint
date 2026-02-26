import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);

  const loadSurveys = () => {
    const stored = JSON.parse(localStorage.getItem("surveys")) || [];
    setSurveys(stored);
  };

  useEffect(() => {
    loadSurveys();

    // Reload when user comes back to tab
    window.addEventListener("focus", loadSurveys);

    return () => {
      window.removeEventListener("focus", loadSurveys);
    };
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Conjoint Dashboard</h1>

      <button onClick={() => navigate("/create")}>
        Create New Survey
      </button>

      <div style={{ marginTop: "30px" }}>
        {surveys.length === 0 && <p>No surveys yet.</p>}

        {surveys.map(survey => (
          <div
            key={survey.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px"
            }}
          >
            <h3>{survey.title}</h3>
            <p>Status: {survey.status}</p>

            <button onClick={() => navigate(`/run/${survey.id}`)}>
              Run Survey
            </button>

            <button
              onClick={() => navigate(`/results/${survey.id}`)}
              style={{ marginLeft: "10px" }}
            >
              View Results
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
