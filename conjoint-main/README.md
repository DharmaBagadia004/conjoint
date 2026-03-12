# conjoint

pip install -r requirements.txt 
flask --app wsgi db upgrade
flask --app wsgi run --debug

## Dataset Upload For Conjoint Setup

You can now upload a dataset from the **Create Survey** page using **Import Dataset & Run Survey**.

Supported file types:
- `.csv`
- `.json`

Rules:
- Columns/keys are treated as attributes.
- Unique values under each column/key become levels.
- At least 2 attributes with at least 2 levels each are required.

CSV example:
```
Price,Battery,Brand
Low,10h,Alpha
Medium,15h,Beta
High,20h,Gamma
Low,20h,Beta
```

JSON example (array of profiles):
```json
[
  { "Price": "Low", "Battery": "10h", "Brand": "Alpha" },
  { "Price": "Medium", "Battery": "15h", "Brand": "Beta" },
  { "Price": "High", "Battery": "20h", "Brand": "Gamma" }
]
```

## Persona + LLM Simulation

You can now define personas and let an LLM take the conjoint survey on behalf of each persona.

### Environment variables (backend)

- `OPENAI_API_KEY` (required for persona simulation)
- `OPENAI_MODEL` (optional, default: `gpt-4o-mini`)
- `OPENAI_API_BASE` (optional, default: `https://api.openai.com/v1`)
### Flow

1. Open a survey from Dashboard using **Run Persona**.
2. Define persona name + key/value attributes (for example, age, budget, risk preference).
3. Click **Run with LLM**.
4. Open results with filters:
   - source: all/human/llm
   - persona: specific persona (when source=llm)

### API endpoints added

- `GET /api/conjoint-surveys/<survey_id>/personas`
- `POST /api/conjoint-surveys/<survey_id>/personas`
- `POST /api/conjoint-surveys/<survey_id>/personas/<persona_id>/run`
- `GET /api/conjoint-surveys/<survey_id>/estimate?source=llm&persona_id=<id>`
