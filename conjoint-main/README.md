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
