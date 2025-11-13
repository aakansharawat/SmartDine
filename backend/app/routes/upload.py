from flask import Blueprint, request, jsonify
import csv
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import StringIO
from app.models import MenuItem, Menu, User 
from app import db
import io
import traceback

# CRITICAL FIX: Define the URL prefix here to match the intended API structure
upload_bp = Blueprint('upload', __name__, url_prefix='/api/menu')

@upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_menu():
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()

    if not current_user or not current_user.is_restaurant: 
        return jsonify({'error': 'Unauthorized access'}), 403

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Invalid file format. Only CSV allowed.'}), 400

        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)

        # Optimization: Clear the current restaurant's existing menu first
        Menu.query.filter_by(restaurant_id=current_user.id).delete()
        db.session.flush()

        for row in csv_input:
            new_item = Menu(
                restaurant_id=current_user.id,
                item_id=int(row.get('item_id', 0)),
                name=row.get('name'),
                category=row.get('category'),
                description=row.get('description'),
                availability=int(row.get('availability', 0)),
                price=float(row.get('price', 0)),
            )
            db.session.add(new_item)

        db.session.commit()
        return jsonify({'message': 'Menu uploaded successfully'}), 201 

    except Exception as e:
        db.session.rollback()
        print("CSV Upload Error:", str(e))
        traceback.print_exc()
        return jsonify({'error': 'Failed to process menu CSV'}), 500
