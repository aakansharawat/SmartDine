import os

class Config:
    # Use pg8000 (pure Python) driver for PostgreSQL to avoid native binary issues on Windows
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+pg8000://smartdine_user:Kanurawat12@localhost:5432/smartdine_db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")