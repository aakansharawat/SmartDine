from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app import db
from app.models import User

from geopy.geocoders import Nominatim
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
geolocator = Nominatim(user_agent="smartdine")
@auth_bp.route('/register', methods=['POST'])
def register():
    """Handles new user/restaurant registration."""
    data = request.get_json()

    # 1. Define and Extract ALL necessary fields from the request data
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    is_restaurant = data.get('is_restaurant', False) 
    address_line = data.get('address_line')
    city = data.get('city')
    state = data.get('state')
    postal_code = data.get('postal_code')
    country = data.get('country')

    # 2. Check for missing required fields
    if not all([name, email, password, address_line, city, state, postal_code, country]):
        # This check is now safe because all variables have been assigned a value (even if it's None)
        return jsonify({'error': 'All fields are required (name, email, password, address_line, city, state, postal_code, country)'}), 400

    # 3. Format the address string
    address = f"{address_line}, {city}, {state}, {postal_code}, {country}"

    try:
        # NOTE: Geocoding is TEMPORARILY bypassed here to fix the previous timeout issue.
        # You can re-enable the geocoding code block if the network issue is resolved.
        # For now, we use fixed dummy coordinates:
        latitude_val = 40.7128  # Fixed dummy value
        longitude_val = -74.0060 # Fixed dummy value

        hashed_password = generate_password_hash(password)
        
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            is_restaurant=is_restaurant, 
            address=address,
            latitude=latitude_val, 
            longitude=longitude_val 
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User registered successfully'}), 201

    except IntegrityError:
        # Handles duplicate email constraint violation
        db.session.rollback()
        return jsonify({'error': 'Email already registered'}), 409
    
    except Exception as e:
        # Handles any other database or server error
        db.session.rollback()
        # Ensure rollback happens before returning the 500 error
        return jsonify({'error': 'Registration failed due to server error', 'details': str(e)}), 500
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):

        access_token = create_access_token(identity=user.email) 

        return jsonify(access_token=access_token, user=user.to_dict()), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_account():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404
        
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete account (Check database foreign key constraints)", "details": str(e)}), 500