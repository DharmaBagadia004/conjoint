import csv
import io
import json
import os
import random
import re
from collections import defaultdict
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from urllib import error, request as urllib_request

from flask import Blueprint, jsonify, request

from .extensions import db
from .models import (
    ConjointAttribute,
    ConjointChoice,
    ConjointLevel,
    ConjointPersona,
    ConjointRespondent,
    ConjointSurvey,
)

bp = Blueprint("api", __name__, url_prefix="/api")


DESCENDING_PRICE_HINTS = ("weight", "charge time", "prep time", "ads", "housingcost", "classsize")
DEFAULT_PRICE_CONFIGS = {
    "laptop purchase study": {
        "battery life": 0.30,
        "weight": 0.20,
        "storage": 0.25,
        "support": 0.25,
    },
    "electric scooter study": {
        "range": 0.35,
        "charge time": 0.20,
        "weight": 0.15,
        "safety package": 0.30,
    },
    "meal kit subscription study": {
        "prep time": 0.25,
        "menu variety": 0.20,
        "dietary support": 0.30,
        "delivery flexibility": 0.25,
    },
    "travel backpack study": {
        "capacity": 0.30,
        "weight": 0.20,
        "laptop sleeve": 0.20,
        "material": 0.30,
    },
    "streaming bundle study": {
        "ads": 0.30,
        "sports access": 0.30,
        "downloads": 0.20,
        "simultaneous screens": 0.20,
    },
    "university": {
        "Ranking": 0.22,
        "Placement": 0.18,
        "Internships": 0.08,
        "ClassSize": 0.08,
        "Research": 0.12,
        "CampusLife": 0.07,
        "Diversity": 0.07,
        "HousingCost": 0.10,
        "Scholarship": 0.08,
    },
}


def _normalize_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_key(value):
    text = _normalize_text(value)
    return text.lower() if text else None


def _is_price_attribute(name):
    normalized_name = _normalize_key(name) or ""
    return (
        "price" in normalized_name
        or "tuition" in normalized_name
        or "cost" == normalized_name
    )


def _parse_price_value(value):
    if value is None:
        return None

    text = str(value).strip()
    cleaned = re.sub(r"[^0-9.\-]", "", text)
    if not cleaned:
        return None

    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _format_price_value(value, template_levels=None):
    if value is None:
        return None

    quantized = value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    if template_levels and any("$" in str(level) for level in template_levels):
        return f"${int(quantized)}"
    return str(int(quantized))


def _find_price_attribute(attributes):
    for attr in attributes:
        if _is_price_attribute(attr.name):
            return attr
    return None


def _price_direction_for_attribute(name):
    normalized_name = _normalize_key(name) or ""
    if any(hint in normalized_name for hint in DESCENDING_PRICE_HINTS):
        return "descending"
    return "ascending"


def _extract_attribute_levels(attribute):
    return [level.value for level in attribute.levels]


def _build_default_price_weights(attributes, price_attribute_name):
    non_price_attributes = [
        attr for attr in attributes
        if _normalize_key(attr.name) != _normalize_key(price_attribute_name)
    ]
    if not non_price_attributes:
        return {}

    equal_weight = 1 / len(non_price_attributes)
    return {attr.name: equal_weight for attr in non_price_attributes}


def _normalize_component_weights(components):
    included_components = [
        component for component in components
        if component.get("included", True)
    ]
    if not included_components:
        return components

    positive_total = sum(
        max(float(component.get("weight", 0) or 0), 0.0)
        for component in included_components
    )

    if positive_total <= 0:
        default_weight = 1 / len(included_components)
        for component in included_components:
            component["weight"] = default_weight
    else:
        for component in included_components:
            component["weight"] = max(float(component.get("weight", 0) or 0), 0.0) / positive_total

    for component in components:
        if not component.get("included", True):
            component["weight"] = 0.0

    return components


def _default_price_config_for_survey(survey, attributes):
    price_attribute = _find_price_attribute(attributes)
    if not price_attribute:
        return None

    survey_key = _normalize_key(survey.title) or ""
    configured_weights = DEFAULT_PRICE_CONFIGS.get(survey_key)
    if not configured_weights:
        configured_weights = _build_default_price_weights(attributes, price_attribute.name)

    components = []
    for attr in attributes:
        if _normalize_key(attr.name) == _normalize_key(price_attribute.name):
            continue

        levels = _extract_attribute_levels(attr)
        if len(levels) < 2:
            continue

        weight = configured_weights.get(attr.name)
        if weight is None:
            continue

        components.append({
            "attribute": attr.name,
            "weight": float(weight),
            "included": True,
            "direction": _price_direction_for_attribute(attr.name),
        })

    if not components:
        return None

    return {
        "price_attribute": price_attribute.name,
        "components": _normalize_component_weights(components),
    }


def _merged_price_config(survey, attributes):
    default_config = _default_price_config_for_survey(survey, attributes)
    if not default_config:
        return None

    stored_config = survey.price_config if isinstance(survey.price_config, dict) else {}
    stored_components = {
        _normalize_key(component.get("attribute")): component
        for component in stored_config.get("components", [])
        if isinstance(component, dict) and _normalize_text(component.get("attribute"))
    }

    merged_components = []
    for component in default_config["components"]:
        stored_component = stored_components.get(_normalize_key(component["attribute"]), {})
        merged_components.append({
            "attribute": component["attribute"],
            "weight": stored_component.get("weight", component["weight"]),
            "included": stored_component.get("included", component["included"]),
            "direction": stored_component.get("direction", component["direction"]),
        })

    return {
        "price_attribute": stored_config.get("price_attribute", default_config["price_attribute"]),
        "components": _normalize_component_weights(merged_components),
    }


def _build_price_formula(survey, attributes):
    price_config = _merged_price_config(survey, attributes)
    if not price_config:
        return None

    price_attribute = _find_price_attribute(attributes)
    if not price_attribute:
        return None

    price_levels = [
        _parse_price_value(level.value)
        for level in price_attribute.levels
    ]
    numeric_price_levels = [level for level in price_levels if level is not None]
    if len(numeric_price_levels) < 2:
        return None
    price_level_labels = _extract_attribute_levels(price_attribute)

    attribute_lookup = {attr.name: attr for attr in attributes}
    included_components = []
    for component in price_config["components"]:
        if not component.get("included", True):
            continue
        attribute = attribute_lookup.get(component["attribute"])
        if not attribute:
            continue
        levels = _extract_attribute_levels(attribute)
        if len(levels) < 2:
            continue
        included_components.append({
            "attribute": component["attribute"],
            "weight": float(component["weight"]),
            "included": True,
            "direction": component["direction"],
            "levels": levels,
        })

    if not included_components:
        return None

    min_price = min(numeric_price_levels)
    max_price = max(numeric_price_levels)
    equation = (
        f"{price_attribute.name} = min_price + (max_price - min_price) x "
        "weighted_feature_score, where weighted_feature_score = "
        "sum(weight x normalized_level_score) / sum(weight)"
    )

    display_terms = [
        f"{component['weight']:.2f} x {component['attribute']} ({component['direction']})"
        for component in included_components
    ]

    return {
        "price_attribute": price_attribute.name,
        "min_price": _format_price_value(min_price, price_level_labels),
        "max_price": _format_price_value(max_price, price_level_labels),
        "components": [
            {
                "attribute": component["attribute"],
                "weight": component["weight"],
                "included": True,
                "direction": component["direction"],
            }
            for component in price_config["components"]
        ],
        "equation": equation,
        "display_equation": (
            f"{price_attribute.name} = { _format_price_value(min_price, price_level_labels) } + "
            f"({ _format_price_value(max_price, price_level_labels) } - { _format_price_value(min_price, price_level_labels) }) x "
            f"[({ ' + '.join(display_terms) }) / 1.00]"
        ),
        "active_components": included_components,
        "price_level_labels": price_level_labels,
    }


def _normalized_level_score(levels, selected_level, direction):
    if len(levels) <= 1:
        return 0.0

    try:
        index = levels.index(selected_level)
    except ValueError:
        index = 0

    raw_score = index / (len(levels) - 1)
    if direction == "descending":
        raw_score = 1 - raw_score
    return raw_score


def _compute_price_from_formula(profile, formula):
    components = formula.get("active_components", [])
    numerator = 0.0
    denominator = 0.0

    for component in components:
        selected_level = profile.get(component["attribute"])
        score = _normalized_level_score(
            component["levels"],
            selected_level,
            component["direction"],
        )
        numerator += component["weight"] * score
        denominator += component["weight"]

    weighted_score = numerator / denominator if denominator else 0.0
    min_price = _parse_price_value(formula["min_price"])
    max_price = _parse_price_value(formula["max_price"])
    if min_price is None or max_price is None:
        return None

    computed_price = min_price + (max_price - min_price) * Decimal(str(weighted_score))
    return _format_price_value(computed_price, formula.get("price_level_labels"))


def _parse_persona_attributes(raw_attributes):
    if isinstance(raw_attributes, dict):
        parsed = {}
        for key, value in raw_attributes.items():
            clean_key = _normalize_text(key)
            clean_value = _normalize_text(value)
            if clean_key and clean_value:
                parsed[clean_key] = clean_value
        return parsed

    if isinstance(raw_attributes, list):
        parsed = {}
        for row in raw_attributes:
            if not isinstance(row, dict):
                continue
            clean_key = _normalize_text(row.get("key"))
            clean_value = _normalize_text(row.get("value"))
            if clean_key and clean_value:
                parsed[clean_key] = clean_value
        return parsed

    return {}


def _serialize_persona(persona):
    return {
        "id": persona.id,
        "survey_id": persona.survey_id,
        "name": persona.name,
        "attributes": persona.attributes,
        "created_at": persona.created_at,
    }


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


def _generate_random_profile(attributes, exclude_names=None):
    exclude_keys = {_normalize_key(name) for name in (exclude_names or [])}
    profile = {}
    for attr in attributes:
        if _normalize_key(attr.name) in exclude_keys:
            continue
        levels = [level.value for level in attr.levels]
        if not levels:
            continue
        profile[attr.name] = random.choice(levels)
    return profile


def _generate_task_options(survey, attributes):
    formula = _build_price_formula(survey, attributes)
    price_attribute_name = formula["price_attribute"] if formula else None

    option_a = _generate_random_profile(attributes, exclude_names=[price_attribute_name] if price_attribute_name else None)
    option_b = _generate_random_profile(attributes, exclude_names=[price_attribute_name] if price_attribute_name else None)

    if formula and price_attribute_name:
        option_a[price_attribute_name] = _compute_price_from_formula(option_a, formula)
        option_b[price_attribute_name] = _compute_price_from_formula(option_b, formula)

    attempts = 0

    while option_a == option_b and attempts < 10:
        option_b = _generate_random_profile(attributes, exclude_names=[price_attribute_name] if price_attribute_name else None)
        if formula and price_attribute_name:
            option_b[price_attribute_name] = _compute_price_from_formula(option_b, formula)
        attempts += 1

    return option_a, option_b


def _extract_choice_from_llm_content(content):
    if not content:
        return None

    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            choice = _normalize_text(parsed.get("choice"))
            if choice:
                choice = choice.upper()
                if choice in {"A", "B"}:
                    return choice
    except json.JSONDecodeError:
        pass

    match = re.search(r"\b([AB])\b", content.upper())
    if match:
        return match.group(1)

    return None


def _serialize_price_formula(price_formula):
    if not price_formula:
        return None

    return {
        "price_attribute": price_formula["price_attribute"],
        "min_price": price_formula["min_price"],
        "max_price": price_formula["max_price"],
        "equation": price_formula["equation"],
        "display_equation": price_formula["display_equation"],
        "components": [
            {
                "attribute": component["attribute"],
                "weight": round(float(component["weight"]), 4),
                "included": bool(component.get("included", True)),
                "direction": component["direction"],
            }
            for component in price_formula["components"]
        ],
    }


def _call_llm_choice(survey, persona, task_number, option_a, option_b):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Configure it before running persona simulations."
        )

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")

    system_message = (
        "You are a survey respondent simulator. "
        "Given a persona and two product options, choose exactly one option. "
        "Output valid JSON: {\"choice\":\"A\"} or {\"choice\":\"B\"}."
    )

    user_message = (
        f"Survey title: {survey.title}\n"
        f"Task number: {task_number}\n"
        f"Persona attributes: {json.dumps(persona.attributes, ensure_ascii=True)}\n"
        f"Option A: {json.dumps(option_a, ensure_ascii=True)}\n"
        f"Option B: {json.dumps(option_b, ensure_ascii=True)}\n"
        "Choose the option this persona would prefer."
    )

    payload = {
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
    }

    req = urllib_request.Request(
        f"{api_base}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as err:
        details = err.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"LLM request failed ({err.code}): {details[:200]}") from err
    except error.URLError as err:
        raise RuntimeError(f"LLM request failed: {err.reason}") from err

    content = (
        result.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    choice = _extract_choice_from_llm_content(content)

    if choice not in {"A", "B"}:
        raise RuntimeError(f"LLM returned an invalid choice: {content}")

    return choice


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
    price_formula = _build_price_formula(survey, survey.attributes)

    return jsonify({
        "id": survey.id,
        "title": survey.title,
        "price_formula": _serialize_price_formula(price_formula),
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


@bp.route("/conjoint-surveys/<int:survey_id>/task", methods=["GET"])
def generate_conjoint_task(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    option_a, option_b = _generate_task_options(survey, survey.attributes)
    return jsonify({
        "optionA": option_a,
        "optionB": option_b,
    })


@bp.route("/conjoint-surveys/<int:survey_id>/price-config", methods=["PATCH"])
def update_conjoint_price_config(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    payload = request.get_json() or {}
    components = payload.get("components")

    if not isinstance(components, list):
        return jsonify({"error": "components must be a list."}), 400

    default_config = _default_price_config_for_survey(survey, survey.attributes)
    if not default_config:
        return jsonify({"error": "This survey does not have a configurable price attribute."}), 400

    default_components = {
        _normalize_key(component["attribute"]): component
        for component in default_config["components"]
    }

    next_components = []
    for component in components:
        if not isinstance(component, dict):
            continue

        attribute_name = _normalize_text(component.get("attribute"))
        normalized_name = _normalize_key(attribute_name)
        if not normalized_name or normalized_name not in default_components:
            continue

        default_component = default_components[normalized_name]
        next_components.append({
            "attribute": default_component["attribute"],
            "weight": component.get("weight", default_component["weight"]),
            "included": bool(component.get("included", True)),
            "direction": default_component["direction"],
        })

    if not next_components:
        return jsonify({"error": "At least one valid component is required."}), 400

    next_components = _normalize_component_weights(next_components)
    if not any(component["included"] for component in next_components):
        return jsonify({"error": "At least one attribute must be included in the price equation."}), 400

    survey.price_config = {
        "price_attribute": default_config["price_attribute"],
        "components": next_components,
    }
    db.session.commit()

    return jsonify({
        "survey_id": survey.id,
        "price_formula": _serialize_price_formula(_build_price_formula(survey, survey.attributes)),
    })


@bp.route("/conjoint-surveys/<int:survey_id>", methods=["PATCH"])
def update_conjoint_survey(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    data = request.get_json() or {}

    title = _normalize_text(data.get("title"))
    if not title:
        return jsonify({"error": "Survey title is required."}), 400

    survey.title = title
    db.session.commit()

    return jsonify({
        "id": survey.id,
        "title": survey.title,
        "created_at": survey.created_at,
    })


@bp.route("/conjoint-surveys/<int:survey_id>", methods=["DELETE"])
def delete_conjoint_survey(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)

    try:
        respondents = (
            ConjointRespondent.query
            .filter(ConjointRespondent.survey_id == survey.id)
            .all()
        )
        for respondent in respondents:
            db.session.delete(respondent)

        personas = (
            ConjointPersona.query
            .filter(ConjointPersona.survey_id == survey.id)
            .all()
        )
        for persona in personas:
            db.session.delete(persona)

        attributes = (
            ConjointAttribute.query
            .filter(ConjointAttribute.survey_id == survey.id)
            .all()
        )
        for attribute in attributes:
            db.session.delete(attribute)

        db.session.delete(survey)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to delete survey."}), 500

    return jsonify({"message": "Survey deleted successfully."})


@bp.route("/conjoint-surveys/<int:survey_id>/personas", methods=["GET"])
def list_conjoint_personas(survey_id):
    ConjointSurvey.query.get_or_404(survey_id)
    personas = (
        ConjointPersona.query
        .filter(ConjointPersona.survey_id == survey_id)
        .order_by(ConjointPersona.created_at.desc())
        .all()
    )
    return jsonify([_serialize_persona(persona) for persona in personas])


@bp.route("/conjoint-surveys/<int:survey_id>/personas", methods=["POST"])
def create_conjoint_persona(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    data = request.get_json() or {}

    name = _normalize_text(data.get("name"))
    attributes = _parse_persona_attributes(data.get("attributes"))

    if not name:
        return jsonify({"error": "Persona name is required."}), 400
    if not attributes:
        return jsonify({"error": "Persona attributes are required."}), 400

    persona = ConjointPersona(
        survey_id=survey.id,
        name=name,
        attributes=attributes,
    )
    db.session.add(persona)
    db.session.commit()

    return jsonify(_serialize_persona(persona)), 201


@bp.route("/conjoint-surveys/<int:survey_id>/personas/<int:persona_id>/run", methods=["POST"])
def run_persona_simulation(survey_id, persona_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    persona = ConjointPersona.query.get_or_404(persona_id)

    if persona.survey_id != survey.id:
        return jsonify({"error": "Persona does not belong to this survey."}), 400

    payload = request.get_json() or {}
    num_tasks = payload.get("num_tasks", 8)

    try:
        num_tasks = int(num_tasks)
    except (TypeError, ValueError):
        return jsonify({"error": "num_tasks must be an integer."}), 400

    if num_tasks < 1 or num_tasks > 50:
        return jsonify({"error": "num_tasks must be between 1 and 50."}), 400

    respondent = ConjointRespondent(
        survey_id=survey.id,
        source="llm",
        persona_id=persona.id,
    )
    db.session.add(respondent)
    db.session.flush()

    try:
        for task_number in range(1, num_tasks + 1):
            option_a, option_b = _generate_task_options(survey, survey.attributes)
            chosen_option = _call_llm_choice(
                survey=survey,
                persona=persona,
                task_number=task_number,
                option_a=option_a,
                option_b=option_b,
            )

            db.session.add(
                ConjointChoice(
                    respondent_id=respondent.id,
                    task_number=task_number,
                    option_a=option_a,
                    option_b=option_b,
                    chosen_option=chosen_option,
                )
            )
    except RuntimeError as err:
        db.session.rollback()
        return jsonify({"error": str(err)}), 502

    db.session.commit()

    return jsonify({
        "message": "Persona simulation completed.",
        "respondent_id": respondent.id,
        "survey_id": survey.id,
        "persona": _serialize_persona(persona),
        "tasks": num_tasks,
    }), 201


@bp.route("/conjoint-surveys/<int:survey_id>/personas/<int:persona_id>", methods=["DELETE"])
def delete_conjoint_persona(survey_id, persona_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)
    persona = ConjointPersona.query.get_or_404(persona_id)

    if persona.survey_id != survey.id:
        return jsonify({"error": "Persona does not belong to this survey."}), 400

    try:
        for respondent in list(persona.respondents):
            db.session.delete(respondent)

        db.session.delete(persona)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Unable to delete persona."}), 500

    return jsonify({"message": "Persona deleted successfully."})


@bp.route("/conjoint-surveys/<int:survey_id>/submit", methods=["POST"])
def submit_conjoint_response(survey_id):
    data = request.get_json()
    survey = ConjointSurvey.query.get_or_404(survey_id)

    responses = data.get("responses", [])
    if not responses:
        return jsonify({"error": "No responses provided"}), 400

    respondent = ConjointRespondent(survey_id=survey.id, source="human")
    db.session.add(respondent)
    db.session.flush()

    for task in responses:
        db.session.add(
            ConjointChoice(
                respondent_id=respondent.id,
                task_number=task["task"],
                option_a=task["optionA"],
                option_b=task["optionB"],
                chosen_option=task["chosen"],
            )
        )

    db.session.commit()

    return jsonify({
        "message": "Submission stored successfully",
        "respondent_id": respondent.id
    }), 201


@bp.route("/conjoint-surveys/<int:survey_id>/estimate", methods=["GET"])
def estimate_conjoint_survey(survey_id):
    survey = ConjointSurvey.query.get_or_404(survey_id)

    source = _normalize_text(request.args.get("source", "all")) or "all"
    source = source.lower()
    if source not in {"all", "human", "llm"}:
        return jsonify({"error": "source must be one of: all, human, llm"}), 400

    persona_id = request.args.get("persona_id")
    persona_id_int = None
    if persona_id is not None and str(persona_id).strip() != "":
        try:
            persona_id_int = int(persona_id)
        except ValueError:
            return jsonify({"error": "persona_id must be an integer."}), 400

    respondent_query = (
        ConjointRespondent.query
        .filter(ConjointRespondent.survey_id == survey.id)
    )
    if source != "all":
        respondent_query = respondent_query.filter(ConjointRespondent.source == source)
    if persona_id_int is not None:
        respondent_query = respondent_query.filter(ConjointRespondent.persona_id == persona_id_int)

    choices_query = (
        ConjointChoice.query
        .join(ConjointRespondent, ConjointChoice.respondent_id == ConjointRespondent.id)
        .filter(ConjointRespondent.survey_id == survey.id)
    )
    if source != "all":
        choices_query = choices_query.filter(ConjointRespondent.source == source)
    if persona_id_int is not None:
        choices_query = choices_query.filter(ConjointRespondent.persona_id == persona_id_int)

    choices = choices_query.all()
    if not choices:
        return jsonify({"error": "No responses available for analysis"}), 400

    level_stats = defaultdict(lambda: {"wins": 0, "appearances": 0})
    task_choice_stats = defaultdict(lambda: {"A": 0, "B": 0, "total": 0})

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
        "respondents": respondent_query.count(),
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
        "filter": {
            "source": source,
            "persona_id": persona_id_int,
        },
    })
