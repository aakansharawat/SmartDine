from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Menu, User, MenuItem 
import csv
from io import StringIO
from datetime import datetime
from sqlalchemy.exc import IntegrityError

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu') 

@menu_bp.route('/add_item', methods=['POST']) 
@jwt_required()
def add_menu_item():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user or not user.is_restaurant:
        return jsonify({'error': 'Restaurant access required'}), 403

    data = request.get_json()
    restaurant_id = user.id

    item_name = data.get('item_name')
    category = data.get('category')
    description = data.get('description')
    availability = data.get('availability')
    price = data.get('price')

    if not all([item_name, availability, price]):
        return jsonify({'error': 'Missing required fields: item_name, availability, price'}), 400

    try:
        menu_item = MenuItem.query.filter(MenuItem.name.ilike(item_name)).first()
        
        if not menu_item:
            menu_item = MenuItem(name=item_name, category=category, description=description)
            db.session.add(menu_item)
            db.session.flush()

        new_menu_entry = Menu(
            restaurant_id=restaurant_id,
            item_id=menu_item.id,
            name=item_name,
            category=category or menu_item.category,
            description=description or menu_item.description,
            availability=int(availability),
            price=float(price)
        )
        db.session.add(new_menu_entry)
        db.session.commit()

        return jsonify({'message': f"Item '{item_name}' added to menu successfully"}), 201

    except (ValueError, TypeError):
        db.session.rollback()
        return jsonify({'error': 'Invalid data format. Price or Availability must be numbers.'}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Menu item already exists for this restaurant.'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to add item to menu', 'details': str(e)}), 500


@menu_bp.route('/upload', methods=['POST']) 
@jwt_required()
def upload_menu():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user or not user.is_restaurant: 
        return jsonify({'error': 'Restaurant access required'}), 403 

    restaurant_id = user.id 

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Invalid file format. Please upload a CSV file.'}), 400

    stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
    
    menu_item_catalog = {m.name.lower(): m for m in MenuItem.query.all()} 
    new_menu_items_to_add = {} 
    
    stream.seek(0)
    csv_for_pass1 = csv.DictReader(stream)
    rows_from_csv = list(csv_for_pass1)

    for row in rows_from_csv:
        item_name = row.get('name') 
        if not item_name:
            continue
        
        item_name_lower = item_name.lower()

        if item_name_lower not in menu_item_catalog and item_name_lower not in new_menu_items_to_add:
            new_menu_items_to_add[item_name_lower] = MenuItem( 
                name=item_name,
                category=row.get('category'),
                description=row.get('description')
            )

    if new_menu_items_to_add:
        db.session.add_all(new_menu_items_to_add.values())
        db.session.flush()
        for item in new_menu_items_to_add.values():
            menu_item_catalog[item.name.lower()] = item

    Menu.query.filter_by(restaurant_id=restaurant_id).delete() 
    errors = []
    new_menu_entries = [] 

    for i, row in enumerate(rows_from_csv):
        line_num = i + 2
        try:
            item_name = row['name'] 
            menu_item = menu_item_catalog.get(item_name.lower()) 

            if not menu_item:
                errors.append(f"Line {line_num}: Could not find or create menu item '{item_name}'.")
                continue
            
            menu_entry = Menu(
                restaurant_id=restaurant_id,
                item_id=menu_item.id,
                name=menu_item.name,
                category=row.get('category', menu_item.category),
                description=row.get('description', menu_item.description),
                availability=int(row['availability']), 
                price=float(row['price']),
            )
            new_menu_entries.append(menu_entry) 

        except KeyError as e:
            errors.append(f"Line {line_num}: Missing required column: {e}. Ensure columns 'name', 'availability', 'price' are present.")
        except (ValueError, TypeError) as e:
            errors.append(f"Line {line_num}: Invalid data format. Check numbers for availability/price. Details: {e}") 
        except Exception as e:
            errors.append(f"Line {line_num}: An unexpected error occurred: {e}")
    
    if errors:
        db.session.rollback()
        return jsonify({'error': 'Menu upload failed with errors', 'details': errors}), 400

    try:
        db.session.add_all(new_menu_entries) 
        db.session.commit()
        return jsonify({'message': f'Successfully uploaded {len(new_menu_entries)} menu items.'}), 201 
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save menu to database', 'details': str(e)}), 500