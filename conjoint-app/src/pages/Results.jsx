import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Results() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const surveys = JSON.parse(localStorage.getItem("surveys")) || [];
    const foundSurvey = surveys.find(s => s.id === id);
    setSurvey(foundSurvey);

    const storedResponses =
      JSON.parse(localStorage.getItem("responses")) || [];

    const filtered = storedResponses.filter(
      r => r.surveyId === id
    );

    setResponses(filtered);
  }, [id]);
    const transformForEstimation = () => {
  if (!survey || responses.length === 0) return null;

  const attributes = survey.attributes;
  const allTasks = [];

  responses.forEach((resp, respondentIndex) => {
    resp.responses.forEach(task => {
      ["A", "B"].forEach(option => {
        const row = {
          respondent: respondentIndex,
          task: task.task,
          alternative: option,
          chosen: task.chosen === option ? 1 : 0
        };

        attributes.forEach(attr => {
          attr.levels.forEach(level => {
            const key = `${attr.name}_${level.value}`;
            row[key] =
              task[`option${option}`][attr.name] === level.value
                ? 1
                : 0;
          });
        });

        allTasks.push(row);
      });
    });
  });

  return allTasks;
};


  if (!survey) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Results: {survey.title}</h1>

      <h3>Total Respondents: {responses.length}</h3>

      <div style={{ marginTop: "20px" }}>
        {responses.map((entry, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <p><strong>Respondent {index + 1}</strong></p>
            <p>Tasks Completed: {entry.responses.length}</p>
          </div>
        ))}
          </div>
          <button
  onClick={() => {
    const data = transformForEstimation();
    console.log("TRANSFORMED DATA:", data);
    alert("Check console");
  }}
>
  Preview Estimation Data
</button>


    </div>
  );
}

export default Results;
