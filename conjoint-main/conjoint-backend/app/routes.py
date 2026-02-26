from flask import Blueprint, request, jsonify
from .extensions import db
from .models import (
    ConjointSurvey,
    ConjointAttribute,
    ConjointLevel
)

bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/conjoint-surveys", methods=["POST"])
def create_conjoint_survey():
    data = request.get_json()

    title = data.get("title")
    attributes = data.get("attributes", [])

    if not title or len(attributes) < 2:
        return jsonify({"error": "Invalid survey structure"}), 400

    survey = ConjointSurvey(title=title)

    for attr in attributes:
        attribute = ConjointAttribute(name=attr["name"])
        survey.attributes.append(attribute)

        for level in attr["levels"]:
            level_obj = ConjointLevel(value=level["value"])
            attribute.levels.append(level_obj)

    db.session.add(survey)
    db.session.commit()

    return jsonify({
        "id": survey.id,
        "title": survey.title
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

from .models import (
    ConjointSurvey,
    ConjointRespondent,
    ConjointChoice
)

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
