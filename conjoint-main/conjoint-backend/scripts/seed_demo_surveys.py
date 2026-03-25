import json
import random
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
DB_PATH = ROOT / "instance" / "app.db"

random.seed(7)


SURVEY_DEFINITIONS = [
    {
        "dataset": PROJECT_ROOT / "demo-datasets" / "laptop_purchase_study.json",
        "personas": [
            {
                "name": "Graduate Researcher",
                "attributes": {
                    "Role": "Graduate Student",
                    "Budget sensitivity": "High",
                    "Mobility": "High",
                    "Performance need": "Moderate",
                    "Support importance": "Low"
                },
                "utilities": {
                    "price": {"$799": 4, "$1099": 1, "$1399": -3},
                    "battery life": {"10 hours": 0, "14 hours": 2, "18 hours": 4},
                    "weight": {"1.2 kg": 4, "1.5 kg": 2, "1.9 kg": -2},
                    "storage": {"256 GB": 0, "512 GB": 3, "1 TB": 2},
                    "support": {"Standard": 1, "Priority": 0, "On-site": -1}
                }
            },
            {
                "name": "Remote Team Lead",
                "attributes": {
                    "Role": "Manager",
                    "Budget sensitivity": "Medium",
                    "Mobility": "Medium",
                    "Performance need": "High",
                    "Support importance": "High"
                },
                "utilities": {
                    "price": {"$799": 1, "$1099": 2, "$1399": 0},
                    "battery life": {"10 hours": -1, "14 hours": 2, "18 hours": 4},
                    "weight": {"1.2 kg": 2, "1.5 kg": 3, "1.9 kg": 0},
                    "storage": {"256 GB": -3, "512 GB": 2, "1 TB": 4},
                    "support": {"Standard": -2, "Priority": 2, "On-site": 4}
                }
            },
            {
                "name": "Budget Startup Founder",
                "attributes": {
                    "Role": "Founder",
                    "Budget sensitivity": "Very High",
                    "Mobility": "High",
                    "Performance need": "High",
                    "Support importance": "Medium"
                },
                "utilities": {
                    "price": {"$799": 5, "$1099": 1, "$1399": -4},
                    "battery life": {"10 hours": 0, "14 hours": 3, "18 hours": 2},
                    "weight": {"1.2 kg": 3, "1.5 kg": 2, "1.9 kg": -1},
                    "storage": {"256 GB": -1, "512 GB": 4, "1 TB": 3},
                    "support": {"Standard": 1, "Priority": 2, "On-site": 0}
                }
            },
            {
                "name": "Creative Freelancer",
                "attributes": {
                    "Role": "Designer",
                    "Budget sensitivity": "Medium",
                    "Mobility": "Medium",
                    "Performance need": "Very High",
                    "Support importance": "Medium"
                },
                "utilities": {
                    "price": {"$799": 0, "$1099": 2, "$1399": 1},
                    "battery life": {"10 hours": -1, "14 hours": 1, "18 hours": 3},
                    "weight": {"1.2 kg": 1, "1.5 kg": 2, "1.9 kg": 0},
                    "storage": {"256 GB": -4, "512 GB": 2, "1 TB": 5},
                    "support": {"Standard": 0, "Priority": 2, "On-site": 1}
                }
            },
            {
                "name": "IT Admin Buyer",
                "attributes": {
                    "Role": "IT Administrator",
                    "Budget sensitivity": "Medium",
                    "Mobility": "Low",
                    "Performance need": "High",
                    "Support importance": "Very High"
                },
                "utilities": {
                    "price": {"$799": 1, "$1099": 2, "$1399": 0},
                    "battery life": {"10 hours": 0, "14 hours": 2, "18 hours": 1},
                    "weight": {"1.2 kg": 0, "1.5 kg": 1, "1.9 kg": 2},
                    "storage": {"256 GB": -3, "512 GB": 2, "1 TB": 4},
                    "support": {"Standard": -4, "Priority": 2, "On-site": 5}
                }
            }
        ]
    },
    {
        "dataset": PROJECT_ROOT / "demo-datasets" / "electric_scooter_study.json",
        "personas": [
            {
                "name": "Daily Office Commuter",
                "attributes": {
                    "Commute length": "Medium",
                    "Budget sensitivity": "Medium",
                    "Safety focus": "High",
                    "Portability need": "High",
                    "Charging patience": "Low"
                },
                "utilities": {
                    "price": {"$499": 2, "$699": 1, "$899": -2},
                    "range": {"20 km": 0, "35 km": 3, "50 km": 4},
                    "charge time": {"3 hours": 4, "5 hours": 1, "7 hours": -2},
                    "weight": {"12 kg": 4, "15 kg": 2, "18 kg": -2},
                    "safety package": {"Basic": -3, "Dual Brake": 2, "Dual Brake + Lights": 4}
                }
            },
            {
                "name": "College Campus Rider",
                "attributes": {
                    "Commute length": "Short",
                    "Budget sensitivity": "High",
                    "Safety focus": "Medium",
                    "Portability need": "High",
                    "Charging patience": "Medium"
                },
                "utilities": {
                    "price": {"$499": 5, "$699": 1, "$899": -4},
                    "range": {"20 km": 2, "35 km": 3, "50 km": 1},
                    "charge time": {"3 hours": 3, "5 hours": 1, "7 hours": -1},
                    "weight": {"12 kg": 5, "15 kg": 2, "18 kg": -3},
                    "safety package": {"Basic": 0, "Dual Brake": 2, "Dual Brake + Lights": 3}
                }
            },
            {
                "name": "Weekend Explorer",
                "attributes": {
                    "Commute length": "Long",
                    "Budget sensitivity": "Low",
                    "Safety focus": "High",
                    "Portability need": "Low",
                    "Charging patience": "High"
                },
                "utilities": {
                    "price": {"$499": 0, "$699": 2, "$899": 1},
                    "range": {"20 km": -4, "35 km": 2, "50 km": 5},
                    "charge time": {"3 hours": 2, "5 hours": 1, "7 hours": 0},
                    "weight": {"12 kg": 1, "15 kg": 2, "18 kg": 0},
                    "safety package": {"Basic": -2, "Dual Brake": 1, "Dual Brake + Lights": 5}
                }
            },
            {
                "name": "Safety First Parent",
                "attributes": {
                    "Commute length": "Medium",
                    "Budget sensitivity": "Medium",
                    "Safety focus": "Very High",
                    "Portability need": "Medium",
                    "Charging patience": "Medium"
                },
                "utilities": {
                    "price": {"$499": 1, "$699": 2, "$899": 0},
                    "range": {"20 km": 0, "35 km": 2, "50 km": 3},
                    "charge time": {"3 hours": 2, "5 hours": 1, "7 hours": -1},
                    "weight": {"12 kg": 2, "15 kg": 2, "18 kg": 0},
                    "safety package": {"Basic": -5, "Dual Brake": 2, "Dual Brake + Lights": 5}
                }
            },
            {
                "name": "Premium Tech Enthusiast",
                "attributes": {
                    "Commute length": "Medium",
                    "Budget sensitivity": "Low",
                    "Safety focus": "High",
                    "Portability need": "Medium",
                    "Charging patience": "Low"
                },
                "utilities": {
                    "price": {"$499": -1, "$699": 2, "$899": 1},
                    "range": {"20 km": -2, "35 km": 2, "50 km": 4},
                    "charge time": {"3 hours": 5, "5 hours": 1, "7 hours": -3},
                    "weight": {"12 kg": 3, "15 kg": 2, "18 kg": 0},
                    "safety package": {"Basic": -2, "Dual Brake": 2, "Dual Brake + Lights": 4}
                }
            }
        ]
    },
    {
        "dataset": PROJECT_ROOT / "demo-datasets" / "meal_kit_subscription_study.json",
        "personas": [
            {
                "name": "Busy Consultant",
                "attributes": {
                    "Schedule intensity": "High",
                    "Budget sensitivity": "Medium",
                    "Health consciousness": "High",
                    "Cooking patience": "Low",
                    "Flexibility need": "High"
                },
                "utilities": {
                    "price per serving": {"$8": 1, "$11": 2, "$14": 0},
                    "prep time": {"15 min": 5, "25 min": 2, "40 min": -3},
                    "menu variety": {"8 meals": 0, "14 meals": 2, "20 meals": 3},
                    "dietary support": {"Standard": -2, "Vegetarian": 2, "Vegetarian + High Protein": 4},
                    "delivery flexibility": {"Fixed": -4, "Skip Anytime": 2, "Pause + Skip Anytime": 5}
                }
            },
            {
                "name": "Budget Conscious Couple",
                "attributes": {
                    "Schedule intensity": "Medium",
                    "Budget sensitivity": "High",
                    "Health consciousness": "Medium",
                    "Cooking patience": "Medium",
                    "Flexibility need": "Medium"
                },
                "utilities": {
                    "price per serving": {"$8": 5, "$11": 1, "$14": -4},
                    "prep time": {"15 min": 2, "25 min": 3, "40 min": 0},
                    "menu variety": {"8 meals": 1, "14 meals": 3, "20 meals": 2},
                    "dietary support": {"Standard": 2, "Vegetarian": 1, "Vegetarian + High Protein": 0},
                    "delivery flexibility": {"Fixed": 0, "Skip Anytime": 2, "Pause + Skip Anytime": 3}
                }
            },
            {
                "name": "Fitness Focused Professional",
                "attributes": {
                    "Schedule intensity": "High",
                    "Budget sensitivity": "Low",
                    "Health consciousness": "Very High",
                    "Cooking patience": "Low",
                    "Flexibility need": "Medium"
                },
                "utilities": {
                    "price per serving": {"$8": 0, "$11": 2, "$14": 1},
                    "prep time": {"15 min": 4, "25 min": 2, "40 min": -2},
                    "menu variety": {"8 meals": 0, "14 meals": 2, "20 meals": 2},
                    "dietary support": {"Standard": -4, "Vegetarian": 2, "Vegetarian + High Protein": 5},
                    "delivery flexibility": {"Fixed": -1, "Skip Anytime": 2, "Pause + Skip Anytime": 3}
                }
            },
            {
                "name": "Curious Home Cook",
                "attributes": {
                    "Schedule intensity": "Low",
                    "Budget sensitivity": "Medium",
                    "Health consciousness": "Medium",
                    "Cooking patience": "High",
                    "Flexibility need": "Low"
                },
                "utilities": {
                    "price per serving": {"$8": 1, "$11": 2, "$14": 0},
                    "prep time": {"15 min": 0, "25 min": 2, "40 min": 3},
                    "menu variety": {"8 meals": -1, "14 meals": 2, "20 meals": 5},
                    "dietary support": {"Standard": 1, "Vegetarian": 2, "Vegetarian + High Protein": 1},
                    "delivery flexibility": {"Fixed": 2, "Skip Anytime": 1, "Pause + Skip Anytime": 0}
                }
            },
            {
                "name": "New Parent Planner",
                "attributes": {
                    "Schedule intensity": "Very High",
                    "Budget sensitivity": "Medium",
                    "Health consciousness": "High",
                    "Cooking patience": "Low",
                    "Flexibility need": "Very High"
                },
                "utilities": {
                    "price per serving": {"$8": 2, "$11": 2, "$14": -1},
                    "prep time": {"15 min": 5, "25 min": 1, "40 min": -4},
                    "menu variety": {"8 meals": 1, "14 meals": 3, "20 meals": 2},
                    "dietary support": {"Standard": -1, "Vegetarian": 2, "Vegetarian + High Protein": 4},
                    "delivery flexibility": {"Fixed": -5, "Skip Anytime": 2, "Pause + Skip Anytime": 5}
                }
            }
        ]
    },
    {
        "dataset": PROJECT_ROOT / "demo-datasets" / "travel_backpack_study.json",
        "personas": [
            {
                "name": "Weekend City Explorer",
                "attributes": {
                    "Travel style": "Short trips",
                    "Budget sensitivity": "Medium",
                    "Mobility": "High",
                    "Tech carry": "Medium",
                    "Durability focus": "Medium"
                },
                "utilities": {
                    "price": {"$79": 2, "$119": 2, "$159": -1},
                    "capacity": {"22 L": 4, "30 L": 2, "40 L": -1},
                    "weight": {"0.9 kg": 5, "1.2 kg": 2, "1.6 kg": -3},
                    "laptop sleeve": {"No": 0, "15 inch": 3, "17 inch": 1},
                    "material": {"Polyester": 0, "Recycled Nylon": 3, "Waterproof Canvas": 2}
                }
            },
            {
                "name": "Remote Worker Nomad",
                "attributes": {
                    "Travel style": "Frequent travel",
                    "Budget sensitivity": "Low",
                    "Mobility": "High",
                    "Tech carry": "High",
                    "Durability focus": "High"
                },
                "utilities": {
                    "price": {"$79": 0, "$119": 2, "$159": 1},
                    "capacity": {"22 L": -2, "30 L": 3, "40 L": 4},
                    "weight": {"0.9 kg": 3, "1.2 kg": 2, "1.6 kg": -1},
                    "laptop sleeve": {"No": -5, "15 inch": 2, "17 inch": 5},
                    "material": {"Polyester": -1, "Recycled Nylon": 2, "Waterproof Canvas": 4}
                }
            },
            {
                "name": "Budget Student Traveler",
                "attributes": {
                    "Travel style": "Occasional",
                    "Budget sensitivity": "High",
                    "Mobility": "Medium",
                    "Tech carry": "Medium",
                    "Durability focus": "Medium"
                },
                "utilities": {
                    "price": {"$79": 5, "$119": 1, "$159": -4},
                    "capacity": {"22 L": 1, "30 L": 4, "40 L": 2},
                    "weight": {"0.9 kg": 3, "1.2 kg": 2, "1.6 kg": -2},
                    "laptop sleeve": {"No": 0, "15 inch": 3, "17 inch": 1},
                    "material": {"Polyester": 2, "Recycled Nylon": 1, "Waterproof Canvas": 0}
                }
            },
            {
                "name": "Adventure Ready Hiker",
                "attributes": {
                    "Travel style": "Outdoor",
                    "Budget sensitivity": "Medium",
                    "Mobility": "Medium",
                    "Tech carry": "Low",
                    "Durability focus": "Very High"
                },
                "utilities": {
                    "price": {"$79": 1, "$119": 2, "$159": 0},
                    "capacity": {"22 L": -2, "30 L": 2, "40 L": 5},
                    "weight": {"0.9 kg": 2, "1.2 kg": 3, "1.6 kg": 0},
                    "laptop sleeve": {"No": 3, "15 inch": 1, "17 inch": -1},
                    "material": {"Polyester": -1, "Recycled Nylon": 2, "Waterproof Canvas": 5}
                }
            },
            {
                "name": "Minimalist Business Flyer",
                "attributes": {
                    "Travel style": "Business trips",
                    "Budget sensitivity": "Low",
                    "Mobility": "Very High",
                    "Tech carry": "High",
                    "Durability focus": "High"
                },
                "utilities": {
                    "price": {"$79": -1, "$119": 2, "$159": 1},
                    "capacity": {"22 L": 3, "30 L": 4, "40 L": 0},
                    "weight": {"0.9 kg": 5, "1.2 kg": 2, "1.6 kg": -3},
                    "laptop sleeve": {"No": -4, "15 inch": 4, "17 inch": 2},
                    "material": {"Polyester": 0, "Recycled Nylon": 4, "Waterproof Canvas": 2}
                }
            }
        ]
    },
    {
        "dataset": PROJECT_ROOT / "demo-datasets" / "streaming_bundle_study.json",
        "personas": [
            {
                "name": "Sports Fan Household",
                "attributes": {
                    "Household size": "4",
                    "Budget sensitivity": "Medium",
                    "Ad tolerance": "Low",
                    "Sports interest": "Very High",
                    "Travel viewing": "Medium"
                },
                "utilities": {
                    "monthly price": {"$9": 2, "$15": 2, "$21": -1},
                    "ads": {"Heavy": -4, "Light": 1, "None": 4},
                    "sports access": {"None": -5, "Highlights": 1, "Live Sports": 5},
                    "downloads": {"1 device": -1, "3 devices": 3, "Unlimited": 2},
                    "simultaneous screens": {"1": -4, "2": 2, "4": 5}
                }
            },
            {
                "name": "Budget Solo Viewer",
                "attributes": {
                    "Household size": "1",
                    "Budget sensitivity": "High",
                    "Ad tolerance": "Medium",
                    "Sports interest": "Low",
                    "Travel viewing": "Low"
                },
                "utilities": {
                    "monthly price": {"$9": 5, "$15": 1, "$21": -4},
                    "ads": {"Heavy": 0, "Light": 2, "None": 3},
                    "sports access": {"None": 2, "Highlights": 1, "Live Sports": 0},
                    "downloads": {"1 device": 3, "3 devices": 2, "Unlimited": 0},
                    "simultaneous screens": {"1": 4, "2": 2, "4": 0}
                }
            },
            {
                "name": "Frequent Traveler",
                "attributes": {
                    "Household size": "2",
                    "Budget sensitivity": "Medium",
                    "Ad tolerance": "Low",
                    "Sports interest": "Medium",
                    "Travel viewing": "Very High"
                },
                "utilities": {
                    "monthly price": {"$9": 1, "$15": 2, "$21": 0},
                    "ads": {"Heavy": -3, "Light": 1, "None": 4},
                    "sports access": {"None": 0, "Highlights": 2, "Live Sports": 2},
                    "downloads": {"1 device": -4, "3 devices": 2, "Unlimited": 5},
                    "simultaneous screens": {"1": 0, "2": 3, "4": 2}
                }
            },
            {
                "name": "Family Entertainment Planner",
                "attributes": {
                    "Household size": "5",
                    "Budget sensitivity": "Medium",
                    "Ad tolerance": "Low",
                    "Sports interest": "Medium",
                    "Travel viewing": "Medium"
                },
                "utilities": {
                    "monthly price": {"$9": 2, "$15": 2, "$21": -1},
                    "ads": {"Heavy": -4, "Light": 1, "None": 4},
                    "sports access": {"None": -1, "Highlights": 2, "Live Sports": 3},
                    "downloads": {"1 device": -3, "3 devices": 3, "Unlimited": 4},
                    "simultaneous screens": {"1": -5, "2": 1, "4": 5}
                }
            },
            {
                "name": "Premium Binge Watcher",
                "attributes": {
                    "Household size": "2",
                    "Budget sensitivity": "Low",
                    "Ad tolerance": "Very Low",
                    "Sports interest": "Low",
                    "Travel viewing": "High"
                },
                "utilities": {
                    "monthly price": {"$9": 0, "$15": 2, "$21": 1},
                    "ads": {"Heavy": -5, "Light": 0, "None": 5},
                    "sports access": {"None": 1, "Highlights": 1, "Live Sports": 0},
                    "downloads": {"1 device": -2, "3 devices": 2, "Unlimited": 4},
                    "simultaneous screens": {"1": -2, "2": 4, "4": 3}
                }
            }
        ]
    }
]


def load_dataset(path):
    return json.loads(path.read_text(encoding="utf-8"))


def build_profile(attribute_map):
    return {
        attribute_name: random.choice(levels)
        for attribute_name, levels in attribute_map.items()
    }


def build_task(attribute_map):
    option_a = build_profile(attribute_map)
    option_b = build_profile(attribute_map)

    attempts = 0
    while option_a == option_b and attempts < 10:
        option_b = build_profile(attribute_map)
        attempts += 1

    return option_a, option_b


def score_profile(profile, utilities):
    total = 0
    for attribute_name, level_value in profile.items():
        total += utilities.get(attribute_name, {}).get(level_value, 0)
    return total


def choose_option(option_a, option_b, utilities):
    score_a = score_profile(option_a, utilities)
    score_b = score_profile(option_b, utilities)

    if score_a == score_b:
        return random.choice(["A", "B"])
    return "A" if score_a > score_b else "B"


def delete_existing_survey(conn, title):
    survey_row = conn.execute(
        "select id from conjoint_survey where title = ?",
        (title,)
    ).fetchone()
    if survey_row is None:
        return

    survey_id = survey_row[0]
    respondent_ids = [
        row[0]
        for row in conn.execute(
            "select id from conjoint_respondent where survey_id = ?",
            (survey_id,)
        ).fetchall()
    ]

    if respondent_ids:
        placeholders = ",".join("?" for _ in respondent_ids)
        conn.execute(
            f"delete from conjoint_choice where respondent_id in ({placeholders})",
            respondent_ids
        )

    conn.execute("delete from conjoint_respondent where survey_id = ?", (survey_id,))
    conn.execute("delete from conjoint_persona where survey_id = ?", (survey_id,))

    attribute_ids = [
        row[0]
        for row in conn.execute(
            "select id from conjoint_attribute where survey_id = ?",
            (survey_id,)
        ).fetchall()
    ]
    if attribute_ids:
        placeholders = ",".join("?" for _ in attribute_ids)
        conn.execute(
            f"delete from conjoint_level where attribute_id in ({placeholders})",
            attribute_ids
        )

    conn.execute("delete from conjoint_attribute where survey_id = ?", (survey_id,))
    conn.execute("delete from conjoint_survey where id = ?", (survey_id,))


def create_survey(conn, spec):
    dataset = load_dataset(spec["dataset"])
    delete_existing_survey(conn, dataset["title"])

    cursor = conn.execute(
        "insert into conjoint_survey (title) values (?)",
        (dataset["title"],)
    )
    survey_id = cursor.lastrowid

    attribute_map = {}
    for attribute_spec in dataset["attributes"]:
        attr_cursor = conn.execute(
            "insert into conjoint_attribute (name, survey_id) values (?, ?)",
            (attribute_spec["name"], survey_id)
        )
        attribute_id = attr_cursor.lastrowid

        levels = []
        for level_spec in attribute_spec["levels"]:
            level_value = level_spec["value"]
            conn.execute(
                "insert into conjoint_level (value, attribute_id) values (?, ?)",
                (level_value, attribute_id)
            )
            levels.append(level_value)

        attribute_map[attribute_spec["name"]] = levels

    for persona_spec in spec["personas"]:
        conn.execute(
            "insert into conjoint_persona (survey_id, name, attributes) values (?, ?, ?)",
            (
                survey_id,
                persona_spec["name"],
                json.dumps(persona_spec["attributes"])
            )
        )

    for persona_spec in spec["personas"]:
        respondent_cursor = conn.execute(
            "insert into conjoint_respondent (survey_id, source) values (?, ?)",
            (survey_id, "human")
        )
        respondent_id = respondent_cursor.lastrowid

        for task_number in range(1, 9):
            option_a, option_b = build_task(attribute_map)
            chosen_option = choose_option(
                option_a,
                option_b,
                persona_spec["utilities"]
            )

            conn.execute(
                """
                insert into conjoint_choice
                    (respondent_id, task_number, option_a, option_b, chosen_option)
                values (?, ?, ?, ?, ?)
                """,
                (
                    respondent_id,
                    task_number,
                    json.dumps(option_a),
                    json.dumps(option_b),
                    chosen_option
                )
            )

    return {
        "title": dataset["title"],
        "survey_id": survey_id,
        "personas": len(spec["personas"]),
        "respondents": len(spec["personas"])
    }


def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        created = []
        for spec in SURVEY_DEFINITIONS:
            created.append(create_survey(conn, spec))
        conn.commit()
        print(json.dumps(created, indent=2))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
