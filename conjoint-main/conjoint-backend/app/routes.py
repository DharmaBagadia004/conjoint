import csv
import io
import json
from collections import defaultdict
from pathlib import Path

from flask import Blueprint, jsonify, request

from .extensions import db
from .models import (
    ConjointAttribute,
    ConjointChoice,
    ConjointLevel,
    ConjointRespondent,
    ConjointSurvey,
)

bp = Blueprint("api", __name__, url_prefix="/api")


def _normalize_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _persist_survey(title, attributes):
    survey = ConjointSurvey(title=title)

    for attr in attributes:
        attr_name = _normalize_text(attr.get("name"))
        raw_levels = attr.get("levels", [])
        if not attr_name:
            continue

        unique_levels = []
        seen_levels = set()

        for level in raw_levels:
            if isinstance(level, dict):
                level_value = _normalize_text(level.get("value"))
            else:
                level_value = _normalize_text(level)

            if not level_value or level_value in seen_levels:
                continue

            seen_levels.add(level_value)
            unique_levels.append(level_value)

        if len(unique_levels) < 2:
            continue

        attribute = ConjointAttribute(name=attr_name)
        survey.attributes.append(attribute)

        for level_value in unique_levels:
            attribute.levels.append(ConjointLevel(value=level_value))

    if len(survey.attributes) < 2:
        raise ValueError("At least 2 attributes with 2+ levels are required.")

    db.session.add(survey)
    db.session.commit()
    return survey


def _extract_from_profile_rows(rows):
    column_levels = {}

    for row in rows:
        if not isinstance(row, dict):
            continue

        for key, raw_value in row.items():
            attr_name = _normalize_text(key)
            level_value = _normalize_text(raw_value)

            if not attr_name or not level_value:
                continue

            if attr_name not in column_levels:
                column_levels[attr_name] = []

            if level_value not in column_levels[attr_name]:
                column_levels[attr_name].append(level_value)

    return [
        {"name": attr_name, "levels": [{"value": value} for value in levels]}
        for attr_name, levels in column_levels.items()
    ]


def _parse_csv_dataset(raw_bytes):
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as err:
        raise ValueError("CSV must be UTF-8 encoded.") from err

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV must include a header row with attribute names.")

    rows = []
    for row in reader:
        if not row:
            continue
        if any(_normalize_text(value) for value in row.values()):
            rows.append(row)

    if not rows:
        raise ValueError("CSV has no data rows.")

    return _extract_from_profile_rows(rows), None


def _parse_json_dataset(raw_bytes):
    try:
        payload = json.loads(raw_bytes.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as err:
        raise ValueError("JSON dataset is invalid.") from err

    dataset_title = None

    if isinstance(payload, dict) and isinstance(payload.get("attributes"), list):
        dataset_title = _normalize_text(payload.get("title"))
        attributes = payload["attributes"]
        return attributes, dataset_title

    if isinstance(payload, list):
        return _extract_from_profile_rows(payload), None

    raise ValueError(
        "JSON must be either an array of profile objects or an object with an attributes list."
    )


@bp.route("/conjoint-surveys", methods=["POST"])
def create_conjoint_survey():
    data = request.get_json()

    title = data.get("title")
    attributes = data.get("attributes", [])

    if not title or len(attributes) < 2:
        return jsonify({"error": "Invalid survey structure"}), 400

    try:
        survey = _persist_survey(title, attributes)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    return jsonify({
        "id": survey.id,
        "title": survey.title
    }), 201


@bp.route("/conjoint-surveys/import", methods=["POST"])
def import_conjoint_survey_dataset():
    uploaded_file = request.files.get("file")

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"error": "Dataset file is required."}), 400

    raw_bytes = uploaded_file.read()
    if not raw_bytes:
        return jsonify({"error": "Uploaded dataset is empty."}), 400

    filename = uploaded_file.filename
    extension = Path(filename).suffix.lower()
    requested_title = _normalize_text(request.form.get("title"))

    try:
        if extension == ".csv":
            attributes, dataset_title = _parse_csv_dataset(raw_bytes)
        elif extension == ".json":
            attributes, dataset_title = _parse_json_dataset(raw_bytes)
        else:
            return jsonify({"error": "Only .csv and .json files are supported."}), 400

        survey_title = requested_title or dataset_title or f"Imported {Path(filename).stem}"
        survey = _persist_survey(survey_title, attributes)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    return jsonify({
        "id": survey.id,
        "title": survey.title,
        "attribute_count": len(survey.attributes),
        "source_file": filename,
    }), 201

@bp.route("/conjoint-surveys", methods=["GET"])
def list_conjoint_surveys():
    surveys = ConjointSurvey.query.all()

    result = []

    for survey in surveys:
        result.append({
            "id": survey.id,
            "title": survey.title,
            "created_at": survey.created_at
        })

    return jsonify(result)

@bp.route("/conjoint-surveys/<int:survey_id>", methods=["GET"])
def get_conjoint_survey(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)

    return jsonify({
        "id": survey.id,
        "title": survey.title,
        "attributes": [
            {
                "id": attr.id,
                "name": attr.name,
                "levels": [
                    {"id": level.id, "value": level.value}
                    for level in attr.levels
                ]
            }
            for attr in survey.attributes
        ]
    })

@bp.route("/conjoint-surveys/<int:survey_id>/submit", methods=["POST"])
def submit_conjoint_response(survey_id):
    data = request.get_json()

    survey = ConjointSurvey.query.get_or_404(survey_id)

    responses = data.get("responses", [])

    if not responses:
        return jsonify({"error": "No responses provided"}), 400

    respondent = ConjointRespondent(survey_id=survey.id)
    db.session.add(respondent)
    db.session.flush()  # get respondent.id before commit

    for task in responses:
        choice = ConjointChoice(
            respondent_id=respondent.id,
            task_number=task["task"],
            option_a=task["optionA"],
            option_b=task["optionB"],
            chosen_option=task["chosen"]
        )
        db.session.add(choice)

    db.session.commit()

    return jsonify({
        "message": "Submission stored successfully",
        "respondent_id": respondent.id
    }), 201


@bp.route("/conjoint-surveys/<int:survey_id>/estimate", methods=["GET"])
def estimate_conjoint_survey(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)

    choices = (
        ConjointChoice.query
        .join(ConjointRespondent, ConjointChoice.respondent_id == ConjointRespondent.id)
        .filter(ConjointRespondent.survey_id == survey.id)
        .all()
    )

    if not choices:
        return jsonify({"error": "No responses available for analysis"}), 400

    # Track win-rate for each level across all shown profiles.
    level_stats = defaultdict(lambda: {"wins": 0, "appearances": 0})
    task_choice_stats = defaultdict(lambda: {"A": 0, "B": 0, "total": 0})

    # Pre-seed known levels so all survey levels are present in the output.
    for attribute in survey.attributes:
        for level in attribute.levels:
            _ = level_stats[(attribute.name, level.value)]

    for choice in choices:
        chosen_profile = choice.option_a if choice.chosen_option == "A" else choice.option_b
        task_choice_stats[choice.task_number]["total"] += 1
        if choice.chosen_option in ("A", "B"):
            task_choice_stats[choice.task_number][choice.chosen_option] += 1

        for option in (choice.option_a, choice.option_b):
            for attr_name, level_value in option.items():
                level_stats[(attr_name, level_value)]["appearances"] += 1

        for attr_name, level_value in chosen_profile.items():
            level_stats[(attr_name, level_value)]["wins"] += 1

    utilities = {}
    importance_ranges = {}

    for attribute in survey.attributes:
        attr_name = attribute.name
        attr_levels = [level.value for level in attribute.levels]

        raw_scores = []
        for level_value in attr_levels:
            stats = level_stats[(attr_name, level_value)]
            appearances = stats["appearances"]
            if appearances == 0:
                raw_scores.append(0.0)
            else:
                # Positive means selected more often than chance for this level.
                raw_scores.append((stats["wins"] / appearances) - 0.5)

        mean_score = sum(raw_scores) / len(raw_scores) if raw_scores else 0.0
        centered_scores = [score - mean_score for score in raw_scores]

        for level_value, centered_score in zip(attr_levels, centered_scores):
            utilities[f"{attr_name}: {level_value}"] = round(centered_score, 4)

        if centered_scores:
            importance_ranges[attr_name] = max(centered_scores) - min(centered_scores)
        else:
            importance_ranges[attr_name] = 0.0

    total_range = sum(importance_ranges.values())
    importance = {}
    for attr_name, attr_range in importance_ranges.items():
        if total_range == 0:
            importance[attr_name] = 0.0
        else:
            importance[attr_name] = round((attr_range / total_range) * 100, 2)

    level_choice_rate = []
    for attribute in survey.attributes:
        for level in attribute.levels:
            stats = level_stats[(attribute.name, level.value)]
            appearances = stats["appearances"]
            wins = stats["wins"]
            rate = (wins / appearances) * 100 if appearances else 0.0
            level_choice_rate.append({
                "attribute": attribute.name,
                "level": level.value,
                "shown": appearances,
                "chosen": wins,
                "choice_rate": round(rate, 2),
            })

    task_choice_bias = []
    for task_number in sorted(task_choice_stats.keys()):
        stats = task_choice_stats[task_number]
        total = stats["total"]
        task_choice_bias.append({
            "task": task_number,
            "n": total,
            "option_a_pct": round((stats["A"] / total) * 100, 2) if total else 0.0,
            "option_b_pct": round((stats["B"] / total) * 100, 2) if total else 0.0,
        })

    correct_predictions = 0
    evaluated_tasks = 0
    ties = 0
    for choice in choices:
        score_a = 0.0
        score_b = 0.0

        for attr_name, level_value in choice.option_a.items():
            score_a += utilities.get(f"{attr_name}: {level_value}", 0.0)

        for attr_name, level_value in choice.option_b.items():
            score_b += utilities.get(f"{attr_name}: {level_value}", 0.0)

        if score_a == score_b:
            ties += 1
            continue

        evaluated_tasks += 1
        predicted = "A" if score_a > score_b else "B"
        if predicted == choice.chosen_option:
            correct_predictions += 1

    hit_rate = (
        round((correct_predictions / evaluated_tasks) * 100, 2)
        if evaluated_tasks else 0.0
    )

    return jsonify({
        "survey_id": survey.id,
        "respondents": len(survey.respondents),
        "tasks_analyzed": len(choices),
        "importance": importance,
        "utilities": utilities,
        "level_choice_rate": level_choice_rate,
        "task_choice_bias": task_choice_bias,
        "model_fit": {
            "hit_rate_pct": hit_rate,
            "evaluated_tasks": evaluated_tasks,
            "ties": ties,
        },
    })
