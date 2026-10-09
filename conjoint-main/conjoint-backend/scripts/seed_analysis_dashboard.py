"""Seed analysis-dashboard test respondents on the uploaded car and pizza studies."""

import json
import random
import re
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from app.extensions import db
from app.models import ConjointChoice, ConjointPersona, ConjointRespondent, ConjointSurvey
from app.routes import _analysis_attributes, _generate_task_options


TEST_RESPONDENTS_PER_PERSONA = 20
TASKS_PER_RESPONDENT = 16
SEED = 20261008
PERSONA_NAMES = [
    "Value-focused buyer",
    "Quality-focused buyer",
    "Feature explorer",
    "Impact-conscious buyer",
    "Balanced buyer",
]
def find_source_survey(predicate, description):
    matches = [survey for survey in ConjointSurvey.query.order_by(ConjointSurvey.id).all() if predicate(survey)]
    if not matches:
        raise ValueError(f"No previously uploaded {description} survey was found in the database.")
    return matches[0]


def source_key(survey):
    config = survey.design_config if isinstance(survey.design_config, dict) else {}
    return (config.get("source_upload_title") or survey.title).strip().lower()


def configure_uploaded_study(survey, display_title, source_title, allowlist=None):
    config = dict(survey.design_config) if isinstance(survey.design_config, dict) else {}
    config["source_upload_title"] = config.get("source_upload_title") or source_title
    if allowlist is None:
        allowlist = [
            attribute.name
            for attribute in survey.attributes
            if attribute.name.strip().lower() not in {"rank", "ranking", "rank order", "ranking order"}
        ]
    config["included_attributes"] = allowlist
    survey.design_config = config
    survey.title = display_title
    survey.is_archived = False
    attributes = _analysis_attributes(survey.attributes, survey)
    if len(attributes) < 2:
        raise ValueError(f'Uploaded study "{source_title}" has fewer than two usable product attributes.')
    return attributes


def ordered_levels(attribute):
    levels = [level.value for level in attribute.levels]

    def numeric_value(value):
        cleaned = str(value).replace(",", "")
        match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
        return float(match.group()) if match else None

    values = [numeric_value(value) for value in levels]
    if all(value is not None for value in values) and len(set(values)) == len(values):
        return [level for _, level in sorted(zip(values, levels))]
    return levels


def persona_utilities(attributes, persona_index):
    utilities = {}
    price_targets = [0, -1, None, -1, None]

    for attribute_index, attribute in enumerate(attributes):
        levels = ordered_levels(attribute)
        if not levels:
            continue

        normalized_name = re.sub(r"[^a-z0-9]", "", attribute.name.lower())
        if "price" in normalized_name:
            target = price_targets[persona_index]
            preferred_index = len(levels) - 1 if target == -1 else (len(levels) // 2 if target is None else target)
        else:
            preferred_index = (persona_index * 2 + attribute_index) % len(levels)

        level_scores = {}
        for index, level in enumerate(levels):
            distance = abs(index - preferred_index)
            if len(levels) > 2:
                distance = min(distance, len(levels) - distance)
            level_scores[level] = 4.0 - (4.0 * distance / max(len(levels) - 1, 1))
        utilities[attribute.name] = level_scores

    return utilities


def ensure_personas(survey, attributes):
    personas = sorted(survey.personas, key=lambda persona: persona.id)[:len(PERSONA_NAMES)]
    for name in PERSONA_NAMES[len(personas):]:
        persona = ConjointPersona(
            survey_id=survey.id,
            name=name,
            attributes={"Preference style": name},
        )
        db.session.add(persona)
        db.session.flush()
        personas.append(persona)

    selected_ids = {persona.id for persona in personas}
    for stale_persona in list(survey.personas):
        if (
            stale_persona.id not in selected_ids
            and stale_persona.name in PERSONA_NAMES
            and ConjointRespondent.query.filter_by(persona_id=stale_persona.id).count() == 0
        ):
            db.session.delete(stale_persona)
    db.session.flush()

    return [
        (persona, persona_utilities(attributes, index))
        for index, persona in enumerate(personas)
    ]


def profile_utility(profile, utilities):
    return sum(utilities.get(attribute, {}).get(value, 0) for attribute, value in profile.items())


def seed_synthetic_runs(survey, attributes):
    for respondent in ConjointRespondent.query.filter_by(survey_id=survey.id, source="synthetic").all():
        db.session.delete(respondent)
    db.session.flush()
    personas = ensure_personas(survey, attributes)

    for persona_index, (persona, utilities) in enumerate(personas):
        random.seed(SEED + survey.id * 100 + persona_index)
        for _ in range(TEST_RESPONDENTS_PER_PERSONA):
            respondent = ConjointRespondent(
                survey_id=survey.id,
                source="synthetic",
                persona_id=persona.id,
            )
            db.session.add(respondent)
            db.session.flush()

            for task_number in range(1, TASKS_PER_RESPONDENT + 1):
                option_a, option_b = _generate_task_options(survey, attributes)
                score_a = profile_utility(option_a, utilities) + random.gauss(0, 0.45)
                score_b = profile_utility(option_b, utilities) + random.gauss(0, 0.45)
                chosen = random.choice(["A", "B"]) if score_a == score_b else ("A" if score_a > score_b else "B")
                db.session.add(ConjointChoice(
                    respondent_id=respondent.id,
                    task_number=task_number,
                    option_a=option_a,
                    option_b=option_b,
                    chosen_option=chosen,
                ))
    return len(personas)


def main():
    app = create_app()
    with app.app_context():
        pizza = find_source_survey(
            lambda survey: source_key(survey) == "pizza" or survey.title.strip().lower() == "pizza",
            "pizza",
        )
        car = find_source_survey(
            lambda survey: "enhanced_car_conjoint_dataset" in source_key(survey),
            "car",
        )
        studies = [
            (car, "Car Preferences", car.title, None),
            (pizza, "Pizza Preferences", pizza.title, None),
        ]

        active_ids = set()
        output = []
        for survey, display_title, source_title, allowlist in studies:
            attributes = configure_uploaded_study(survey, display_title, source_title, allowlist)
            persona_count = seed_synthetic_runs(survey, attributes)
            active_ids.add(survey.id)
            saved_config = survey.design_config if isinstance(survey.design_config, dict) else {}
            output.append({
                "id": survey.id,
                "title": survey.title,
                "source_upload": saved_config.get("source_upload_title", source_title),
                "attributes": [attribute.name for attribute in attributes],
                "personas": persona_count,
                "synthetic_respondents": persona_count * TEST_RESPONDENTS_PER_PERSONA,
                "tasks_per_respondent": TASKS_PER_RESPONDENT,
            })

        archived_count = 0
        for survey in ConjointSurvey.query.all():
            should_archive = survey.id not in active_ids
            if survey.is_archived != should_archive:
                survey.is_archived = should_archive
                archived_count += int(should_archive)

        db.session.commit()
        print(json.dumps({"active_surveys": output, "archived_surveys": archived_count}, indent=2))


if __name__ == "__main__":
    main()
