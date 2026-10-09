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
- Use concrete numeric values or ranges for measurable attributes like price; choose bands that fit the vehicle market and study audience.

After creating or importing a survey, open its details to add prohibited level pairs. These prevent two levels from appearing together in the same profile (for example, a premium brand with an entry-level price). Use restrictions only for combinations that respondents would find unrealistic; the survey checks that at least two valid profiles remain. If a restriction includes a price level, task generation uses the survey's discrete price levels instead of calculating price from the weighted price equation.

When a survey has a price attribute with levels (including numeric values and price bands), the backend assigns one of those configured levels using a weighted score of the other attributes. For surveys with a Brand, Manufacturer, or Make attribute, its default price weight is 50%; the remaining weight is shared by other attributes. Order brand tiers from economy to premium and price tiers from low to high. Adjust weights in the survey details. Explicit prohibited pairs can still be used when a combination must never appear.

The analysis dashboard sample can be initialized from the backend directory with `python scripts/seed_analysis_dashboard.py`. It uses the already imported car and pizza surveys, archives other surveys without deleting their data, and creates 20 test respondents for each of five personas in each active survey. Ranking columns are excluded from product attributes. Re-running the script replaces only those studies' test respondents.

CSV example:
```
Price,Battery,Brand
$20k-$30k,10h,Alpha
$30k-$40k,15h,Beta
$40k-$50k,20h,Gamma
```

JSON example (array of profiles):
```json
[
  { "Price": "$20k-$30k", "Battery": "10h", "Brand": "Alpha" },
  { "Price": "$30k-$40k", "Battery": "15h", "Brand": "Beta" },
  { "Price": "$40k-$50k", "Battery": "20h", "Brand": "Gamma" }
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
