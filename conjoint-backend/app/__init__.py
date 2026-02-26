import os
from flask import Flask
from .config import Config
from .extensions import db, migrate
# from .routes import bp

def create_app(config_object=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)

    # ensure instance folder exists (good place for sqlite db)
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    # app.register_blueprint(bp, url_prefix="/api")
    return app
