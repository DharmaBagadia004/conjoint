import os
from flask import Flask
from sqlalchemy import inspect, text
from sqlalchemy.exc import NoSuchTableError
from .config import Config
from .extensions import db, migrate
from flask_cors import CORS
# from .routes import bp


def _ensure_conjoint_price_config_column(app):
    with app.app_context():
        inspector = inspect(db.engine)
        try:
            columns = {column["name"] for column in inspector.get_columns("conjoint_survey")}
        except NoSuchTableError:
            return
        if "price_config" in columns:
            return

        with db.engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE conjoint_survey ADD COLUMN price_config JSON")
            )
            connection.execute(
                text("UPDATE conjoint_survey SET price_config = '{}' WHERE price_config IS NULL")
            )

def create_app(config_object=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)
    CORS(app)

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from . import models
    from .routes import bp
    app.register_blueprint(bp)
    _ensure_conjoint_price_config_column(app)

    return app
