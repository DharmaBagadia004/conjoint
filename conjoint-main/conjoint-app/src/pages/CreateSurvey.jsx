import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CreateSurvey() {
    const navigate = useNavigate();
  const [datasetFile, setDatasetFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

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
    
const saveSurvey = async () => {
  if (!validateSurvey()) return;

  try {
    const payload = {
      title: survey.title,
      attributes: survey.attributes.map(attr => ({
        name: attr.name,
        levels: attr.levels.map(level => ({
          value: level.value
        }))
      }))
    };

    await axios.post(
      "http://localhost:5000/api/conjoint-surveys",
      payload
    );

    alert("Survey saved successfully!");
    navigate("/");
  } catch (error) {
    console.error(error);
    alert("Error saving survey");
  }
};

const importDatasetAndRun = async () => {
  if (!datasetFile) {
    alert("Please select a CSV or JSON file.");
    return;
  }

  setIsImporting(true);

  try {
    const formData = new FormData();
    formData.append("file", datasetFile);

    if (survey.title.trim()) {
      formData.append("title", survey.title.trim());
    }

    const response = await axios.post(
      "http://localhost:5000/api/conjoint-surveys/import",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    alert(`Survey "${response.data.title}" imported successfully.`);
    navigate(`/run/${response.data.id}`);
  } catch (error) {
    console.error(error);
    alert(
      error?.response?.data?.error ||
      "Unable to import dataset."
    );
  } finally {
    setIsImporting(false);
  }
};

  return (
  <div className="max-w-5xl mx-auto">
    {/* Header */}
    <div className="mb-12">
      <h1 className="text-3xl font-semibold text-gray-900">
        Create Conjoint Survey
      </h1>
      <p className="text-gray-500 mt-2 text-sm">
        Define attributes and levels for your study.
      </p>
    </div>

    {/* Dataset Import */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">
        Import From Dataset
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Upload a CSV or JSON file. Columns become attributes and unique values become levels.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="file"
          accept=".csv,.json,application/json,text/csv"
          onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
          className="text-sm text-gray-700"
        />

        <button
          onClick={importDatasetAndRun}
          disabled={isImporting}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isImporting ? "Importing..." : "Import Dataset & Run Survey"}
        </button>
      </div>

      {datasetFile && (
        <p className="text-xs text-gray-500 mt-3">
          Selected file: {datasetFile.name}
        </p>
      )}
    </div>

    {/* Survey Title */}
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Survey Title
      </label>

      <input
        type="text"
        placeholder="e.g. Smartphone Preference Study"
        value={survey.title}
        onChange={(e) =>
          setSurvey({ ...survey, title: e.target.value })
        }
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    {/* Add Attribute Button */}
    <div className="mb-8">
      <button
        onClick={addAttribute}
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        + Add Attribute
      </button>
    </div>

    {/* Attributes */}
    <div className="space-y-8">
      {survey.attributes.map((attr) => (
        <div
          key={attr.id}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <input
              type="text"
              placeholder="Attribute Name (e.g. Price)"
              value={attr.name}
              onChange={(e) =>
                updateAttributeName(attr.id, e.target.value)
              }
              className="w-1/2 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={() => deleteAttribute(attr.id)}
              className="text-sm text-red-500 hover:underline"
            >
              Delete Attribute
            </button>
          </div>

          {/* Levels */}
          <div className="space-y-4">
            {attr.levels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-4"
              >
                <input
                  type="text"
                  placeholder="Level value (e.g. $500)"
                  value={level.value}
                  onChange={(e) =>
                    updateLevel(attr.id, level.id, e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={() =>
                    deleteLevel(attr.id, level.id)
                  }
                  className="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Add Level Button */}
          <div className="mt-6">
            <button
              onClick={() => addLevel(attr.id)}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + Add Level
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Save Button */}
    <div className="mt-12">
      <button
        onClick={saveSurvey}
        className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
      >
        Save Survey
      </button>
    </div>
  </div>
);
}

export default CreateSurvey;
