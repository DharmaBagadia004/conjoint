import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";


function CreateSurvey() {
    const navigate = useNavigate();

  const [survey, setSurvey] = useState({
    title: "",
    attributes: []
  });

  // Add attribute
  const addAttribute = () => {
    const newAttribute = {
      id: uuidv4(),
      name: "",
      levels: []
    };

    setSurvey(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute]
    }));
  };

  // Delete attribute
  const deleteAttribute = (attrId) => {
    setSurvey(prev => ({
      ...prev,
      attributes: prev.attributes.filter(attr => attr.id !== attrId)
    }));
  };

  // Update attribute name
  const updateAttributeName = (attrId, value) => {
    setSurvey(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attrId ? { ...attr, name: value } : attr
      )
    }));
  };

  // Add level
  const addLevel = (attrId) => {
    const newLevel = {
      id: uuidv4(),
      value: ""
    };

    setSurvey(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attrId
          ? { ...attr, levels: [...attr.levels, newLevel] }
          : attr
      )
    }));
  };

  // Update level value
  const updateLevel = (attrId, levelId, value) => {
    setSurvey(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attrId
          ? {
              ...attr,
              levels: attr.levels.map(level =>
                level.id === levelId ? { ...level, value } : level
              )
            }
          : attr
      )
    }));
  };

  // Delete level
  const deleteLevel = (attrId, levelId) => {
    setSurvey(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attrId
          ? {
              ...attr,
              levels: attr.levels.filter(level => level.id !== levelId)
            }
          : attr
      )
    }));
    };
    
    const validateSurvey = () => {
  if (!survey.title.trim()) {
    alert("Survey title is required.");
    return false;
  }

  if (survey.attributes.length < 2) {
    alert("At least 2 attributes are required.");
    return false;
  }

  for (let attr of survey.attributes) {
    if (!attr.name.trim()) {
      alert("All attributes must have names.");
      return false;
    }

    if (attr.levels.length < 2) {
      alert(`Attribute "${attr.name}" must have at least 2 levels.`);
      return false;
    }

    for (let level of attr.levels) {
      if (!level.value.trim()) {
        alert(`All levels in "${attr.name}" must be filled.`);
        return false;
      }
    }
  }

  return true;
    };
    
const saveSurvey = () => {
  if (!validateSurvey()) return;

  const existing = JSON.parse(localStorage.getItem("surveys")) || [];

  const newSurvey = {
    ...survey,
    id: uuidv4(),
    status: "Draft"
  };

  localStorage.setItem(
    "surveys",
    JSON.stringify([...existing, newSurvey])
  );

alert("Survey saved successfully!");
navigate("/");

  // Optional: reset form
  setSurvey({
    title: "",
    attributes: []
  });
};


  return (
    <div style={{ padding: "40px" }}>
      <h1>Create Survey</h1>

      <input
        type="text"
        placeholder="Survey Title"
        value={survey.title}
        onChange={(e) =>
          setSurvey({ ...survey, title: e.target.value })
        }
        style={{ display: "block", marginBottom: "20px", width: "300px" }}
      />

      <button onClick={addAttribute}>Add Attribute</button>

      {survey.attributes.map(attr => (
        <div
          key={attr.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginTop: "20px"
          }}
        >
          <input
            type="text"
            placeholder="Attribute Name"
            value={attr.name}
            onChange={(e) =>
              updateAttributeName(attr.id, e.target.value)
            }
            style={{ marginBottom: "10px", width: "250px" }}
          />

          <button onClick={() => deleteAttribute(attr.id)}>
            Delete Attribute
          </button>

          <div style={{ marginTop: "10px" }}>
            {attr.levels.map(level => (
              <div key={level.id} style={{ marginBottom: "5px" }}>
                <input
                  type="text"
                  placeholder="Level Value"
                  value={level.value}
                  onChange={(e) =>
                    updateLevel(attr.id, level.id, e.target.value)
                  }
                />
                <button
                  onClick={() =>
                    deleteLevel(attr.id, level.id)
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addLevel(attr.id)}>
            Add Level
          </button>
        </div>
      ))}
<button
  onClick={saveSurvey}
  style={{ marginTop: "20px", padding: "8px 16px" }}
>
  Save Survey
</button>

      <pre style={{ marginTop: "30px" }}>
        {JSON.stringify(survey, null, 2)}
      </pre>
    </div>
  );
}

export default CreateSurvey;
