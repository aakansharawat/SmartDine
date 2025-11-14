from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Order, OrderItem, Menu, User

orders_bp = Blueprint('orders_bp', __name__, url_prefix='/api/orders')


def _validate_items(items):
    if not isinstance(items, list) or len(items) == 0:
        return 'Items must be a non-empty list'
    for it in items:
        if not isinstance(it, dict):
            return 'Each item must be an object'
        name = it.get('item_name') or it.get('name')
        qty = it.get('quantity')
        if not name or not isinstance(qty, int) or qty <= 0:
            return 'Each item must include item_name and positive integer quantity'
    return None


@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    data = request.get_json() or {}
    restaurant_id = data.get('restaurant_id')
    items = data.get('items', [])

    err = _validate_items(items)
    if err:
        return jsonify({'error': err}), 400
    if not restaurant_id:
        return jsonify({'error': 'restaurant_id is required'}), 400

    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Verify restaurant exists and is a restaurant
        rest = User.query.filter_by(id=restaurant_id, is_restaurant=True).first()
        if not rest:
            return jsonify({'error': 'Restaurant not found'}), 404

        order = Order(user_id=user.id, restaurant_id=restaurant_id, total_amount=0.0, status='placed')
        db.session.add(order)
        db.session.flush()  # get order.id

        total_cost = 0.0
        created_items = []

        for it in items:
            name = it.get('item_name') or it.get('name')
            qty_needed = it.get('quantity')

            # Locate menu rows for this restaurant and name, order by price asc
            menu_rows = (
                Menu.query
                .filter_by(restaurant_id=restaurant_id, name=name)
                .order_by(Menu.price.asc())
                .all()
            )
            total_available = sum((m.availability or 0) for m in menu_rows)
            if total_available < qty_needed:
                db.session.rollback()
                return jsonify({'error': f'Insufficient availability for {name}'}), 400

            qty_left = qty_needed
            for m in menu_rows:
                if qty_left <= 0:
                    break
                take = min(qty_left, m.availability or 0)
                if take <= 0:
                    continue
                m.availability = (m.availability or 0) - take
                oi = OrderItem(
                    order_id=order.id,
                    menu_id=m.id,
                    name_snapshot=m.name,
                    quantity=take,
                    unit_price=m.price or 0.0,
                )
                db.session.add(oi)
                created_items.append(oi)
                total_cost += take * (m.price or 0.0)
                qty_left -= take

        order.total_amount = round(total_cost, 2)
        db.session.commit()

        return jsonify({
            'id': order.id,
            'restaurant_id': order.restaurant_id,
            'total_amount': order.total_amount,
            'status': order.status,
            'items': [
                {
                    'name': oi.name_snapshot,
                    'quantity': oi.quantity,
                    'unit_price': oi.unit_price
                } for oi in created_items
            ]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to place order', 'details': str(e)}), 500


@orders_bp.route('/mine', methods=['GET'])
@jwt_required()
def list_my_orders():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'results': []}), 200
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    def order_to_dict(o: Order):
        return {
            'id': o.id,
            'restaurant_id': o.restaurant_id,
            'total_amount': o.total_amount,
            'status': o.status,
            'created_at': o.created_at.isoformat(),
            'items': [
                {
                    'name': it.name_snapshot,
                    'quantity': it.quantity,
                    'unit_price': it.unit_price,
                } for it in o.items
            ]
        }
    return jsonify({'results': [order_to_dict(o) for o in orders]}), 200


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id: int):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'error': 'Order not found'}), 404
    o = Order.query.filter_by(id=order_id, user_id=user.id).first()
    if not o:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify({
        'id': o.id,
        'restaurant_id': o.restaurant_id,
        'total_amount': o.total_amount,
        'status': o.status,
        'created_at': o.created_at.isoformat(),
        'items': [
            {
                'name': it.name_snapshot,
                'quantity': it.quantity,
                'unit_price': it.unit_price,
            } for it in o.items
        ]
    }), 200


# Restaurant management: list orders for my restaurant
@orders_bp.route('/restaurant/mine', methods=['GET'])
@jwt_required()
def orders_for_my_restaurant():
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'results': []}), 200
    orders = Order.query.filter_by(restaurant_id=me.id).order_by(Order.created_at.desc()).all()
    def order_to_dict(o: Order):
        return {
            'id': o.id,
            'user_id': o.user_id,
            'total_amount': o.total_amount,
            'status': o.status,
            'created_at': o.created_at.isoformat(),
            'items': [
                {
                    'name': it.name_snapshot,
                    'quantity': it.quantity,
                    'unit_price': it.unit_price,
                } for it in o.items
            ]
        }
    return jsonify({'results': [order_to_dict(o) for o in orders]}), 200


# Restaurant management: update order status
@orders_bp.route('/restaurant/<int:order_id>', methods=['PATCH'])
@jwt_required()
def restaurant_update_order(order_id: int):
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'error': 'Not authorized'}), 403
    o = Order.query.filter_by(id=order_id, restaurant_id=me.id).first()
    if not o:
        return jsonify({'error': 'Order not found'}), 404
    data = request.get_json() or {}
    new_status = data.get('status')
    allowed = {'confirmed', 'preparing', 'ready', 'completed', 'cancelled'}
    if new_status not in allowed:
        return jsonify({'error': 'Unsupported status'}), 400
    o.status = new_status
    db.session.commit()
    return jsonify({'message': 'Order updated'}), 200
