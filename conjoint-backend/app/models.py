from .extensions import db

class Company(db.Model):
    __tablename__ = "company"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable = False)
    surveys = db.relationship("Survey", back_populates="company", cascade="all, delete-orphan")

class SurveyUser(db.Model):
    __tablename__ = "survey_user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    submissions = db.relationship("SurveySubmission", back_populates="user", cascade="all, delete-orphan")

    # convenience: view assigned surveys via submissions
    surveys = db.relationship("Survey", secondary="survey_submission", viewonly=True)


class Survey(db.Model):
    __tablename__ = "survey"
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    id = db.Column(db.Integer, primary_key=True)
    company = db.relationship("Company", back_populates="surveys")
    submissions = db.relationship("SurveySubmission", back_populates="survey", cascade="all, delete-orphan")


class SurveySubmission(db.Model):
    """
    One row per (user, survey) assignment.
    Holds the user's submission for that survey.
    """
    __tablename__ = "survey_submission"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("survey_user.id"), nullable=False)
    survey_id = db.Column(db.Integer, db.ForeignKey("survey.id"), nullable=False)

    # submission payload:
    # If your SQLite has JSON1, you can still store JSON as TEXT safely.
    answers_json = db.Column(db.Text, nullable=True)  # e.g. '{"q1": 3, "q2": ["a","b"]}'
    submitted_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="assigned")  # assigned|submitted|reviewed

    user = db.relationship("SurveyUser", back_populates="submissions")
    survey = db.relationship("Survey", back_populates="submissions")

    __table_args__ = (
        db.UniqueConstraint("user_id", "survey_id", name="uq_user_survey_once"),
        db.Index("ix_submission_user_id", "user_id"),
        db.Index("ix_submission_survey_id", "survey_id"),
    ) 
