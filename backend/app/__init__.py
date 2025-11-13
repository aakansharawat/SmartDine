from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from flask_jwt_extended import JWTManager
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)
    jwt = JWTManager(app)

    # Blueprints
    from app.routes.auth import auth_bp
    from app.routes.upload import upload_bp
    from app.routes.search import search_bp
    from app.routes.menu_routes import menu_bp 

    app.register_blueprint(auth_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(menu_bp) 

    return app