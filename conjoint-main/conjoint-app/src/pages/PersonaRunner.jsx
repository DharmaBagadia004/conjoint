import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function PersonaRunner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [personaName, setPersonaName] = useState("");
  const [numTasks, setNumTasks] = useState(8);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [runningPersonaId, setRunningPersonaId] = useState(null);

  const [rows, setRows] = useState([
    { id: uuidv4(), key: "", value: "" }
  ]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [surveyRes, personasRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/conjoint-surveys/${id}`),
        axios.get(`http://localhost:5000/api/conjoint-surveys/${id}/personas`)
      ]);
      setSurvey(surveyRes.data);
      setPersonas(personasRes.data);
    } catch (error) {
      console.error(error);
      alert("Unable to load survey/personas.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: uuidv4(), key: "", value: "" }]);
  };

  const updateRow = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const deleteRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const buildAttributesObject = () => {
    const out = {};
    rows.forEach((row) => {
      const key = row.key.trim();
      const value = row.value.trim();
      if (key && value) {
        out[key] = value;
      }
    });
    return out;
  };

  const createPersona = async () => {
    const attributes = buildAttributesObject();

    if (!personaName.trim()) {
      alert("Persona name is required.");
      return;
    }
    if (Object.keys(attributes).length === 0) {
      alert("Add at least one persona attribute.");
      return;
    }

    try {
      setIsSavingPersona(true);
      await axios.post(
        `http://localhost:5000/api/conjoint-surveys/${id}/personas`,
        {
          name: personaName.trim(),
          attributes
        }
      );

      setPersonaName("");
      setRows([{ id: uuidv4(), key: "", value: "" }]);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || "Unable to create persona.");
    } finally {
      setIsSavingPersona(false);
    }
  };

  const runPersona = async (persona) => {
    try {
      setRunningPersonaId(persona.id);
      await axios.post(
        `http://localhost:5000/api/conjoint-surveys/${id}/personas/${persona.id}/run`,
        {
          num_tasks: Number(numTasks) || 8
        }
      );

      navigate(
        `/results/${id}?source=llm&persona_id=${persona.id}`
      );
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || "Unable to run persona.");
    } finally {
      setRunningPersonaId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-500">Loading persona workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900">
          Persona Simulation
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {survey?.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Define Persona
          </h2>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persona Name
          </label>
          <input
            type="text"
            value={personaName}
            onChange={(e) => setPersonaName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Budget-conscious student"
          />

          <label className="block text-sm font-medium text-gray-700 mb-3">
            Persona Attributes
          </label>
          <div className="space-y-3 mb-4">
            {rows.map((row) => (
              <div key={row.id} className="flex gap-3">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateRow(row.id, "key", e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Attribute (e.g. Age)"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateRow(row.id, "value", e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Value (e.g. 29)"
                />
                <button
                  onClick={() => deleteRow(row.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={addRow}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + Add Attribute
            </button>

            <button
              onClick={createPersona}
              disabled={isSavingPersona}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSavingPersona ? "Saving..." : "Save Persona"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Run Persona
            </h2>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Tasks</label>
              <input
                type="number"
                min={1}
                max={50}
                value={numTasks}
                onChange={(e) => setNumTasks(e.target.value)}
                className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {personas.length === 0 ? (
            <p className="text-sm text-gray-500">
              No personas yet. Define one to start simulation.
            </p>
          ) : (
            <div className="space-y-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {persona.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(persona.attributes || {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" | ")}
                      </p>
                    </div>

                    <button
                      onClick={() => runPersona(persona)}
                      disabled={runningPersonaId === persona.id}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      {runningPersonaId === persona.id
                        ? "Running..."
                        : "Run with LLM"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonaRunner;
