import os
from flask import Flask
from .config import Config
from .extensions import db, migrate
from flask_cors import CORS
# from .routes import bp

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

    return app