from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, time
from app import db
from app.models import User, Reservation

reservations_bp = Blueprint('reservations', __name__, url_prefix='/api/reservations')


def _parse_date_time(payload):
    try:
        d = payload.get('date')  # 'YYYY-MM-DD'
        t = payload.get('time')  # 'HH:MM'
        party_size = int(payload.get('party_size', 1))
        if not d or not t or party_size <= 0:
            return None, None, None
        yyyy, mm, dd = [int(x) for x in d.split('-')]
        hh, mi = [int(x) for x in t.split(':')]
        return date(yyyy, mm, dd), time(hh, mi), party_size
    except Exception:
        return None, None, None


@reservations_bp.route('', methods=['POST'])
@jwt_required()
def create_reservation():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    restaurant_id = data.get('restaurant_id')
    d, t, party_size = _parse_date_time(data)

    if not restaurant_id or not d or not t:
        return jsonify({'error': 'restaurant_id, date (YYYY-MM-DD), time (HH:MM) and party_size are required'}), 400

    # Check restaurant exists and is a restaurant
    restaurant = User.query.filter_by(id=restaurant_id, is_restaurant=True).first()
    if not restaurant:
        return jsonify({'error': 'Restaurant not found'}), 404

    # Capacity check for this slot using restaurant capacity settings
    total_capacity = max(0, int((restaurant.tables_count or 0) * (restaurant.seats_per_table or 0)))
    existing = Reservation.query.filter_by(restaurant_id=restaurant_id, date=d, time=t, status='confirmed').all()
    booked = sum(r.party_size for r in existing)
    if total_capacity == 0 or booked + party_size > total_capacity:
        return jsonify({'error': 'No availability for selected time slot'}), 409

    res = Reservation(user_id=user.id, restaurant_id=restaurant_id, date=d, time=t, party_size=party_size, status='confirmed')
    db.session.add(res)
    db.session.commit()

    return jsonify({'message': 'Reservation confirmed', 'reservation_id': res.id}), 201


@reservations_bp.route('/mine', methods=['GET'])
@jwt_required()
def my_reservations():
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    items = Reservation.query.filter_by(user_id=user.id).order_by(Reservation.created_at.desc()).all()
    out = [
        {
            'id': r.id,
            'restaurant_id': r.restaurant_id,
            'date': r.date.isoformat(),
            'time': r.time.strftime('%H:%M'),
            'party_size': r.party_size,
            'status': r.status
        }
        for r in items
    ]
    return jsonify({'reservations': out}), 200


@reservations_bp.route('/<int:reservation_id>', methods=['PATCH'])
@jwt_required()
def update_reservation(reservation_id: int):
    current_email = get_jwt_identity()
    user = User.query.filter_by(email=current_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    r = Reservation.query.get(reservation_id)
    if not r or r.user_id != user.id:
        return jsonify({'error': 'Reservation not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status in ['cancelled']:
        r.status = 'cancelled'
        db.session.commit()
        return jsonify({'message': 'Reservation cancelled'}), 200

    return jsonify({'error': 'Unsupported update'}), 400


# Restaurant management: list reservations for my restaurant
@reservations_bp.route('/restaurant/mine', methods=['GET'])
@jwt_required()
def reservations_for_my_restaurant():
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'reservations': []}), 200

    items = Reservation.query.filter_by(restaurant_id=me.id).order_by(Reservation.created_at.desc()).all()
    out = [
        {
            'id': r.id,
            'user_id': r.user_id,
            'date': r.date.isoformat(),
            'time': r.time.strftime('%H:%M'),
            'party_size': r.party_size,
            'status': r.status
        }
        for r in items
    ]
    return jsonify({'reservations': out}), 200


# Restaurant management: update reservation status (confirm/cancel)
@reservations_bp.route('/restaurant/<int:reservation_id>', methods=['PATCH'])
@jwt_required()
def restaurant_update_reservation(reservation_id: int):
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'error': 'Not authorized'}), 403

    r = Reservation.query.get(reservation_id)
    if not r or r.restaurant_id != me.id:
        return jsonify({'error': 'Reservation not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status in ['confirmed', 'cancelled']:
        r.status = new_status
        db.session.commit()
        return jsonify({'message': 'Reservation updated'}), 200

    return jsonify({'error': 'Unsupported status'}), 400


# Capacity management for restaurants
@reservations_bp.route('/restaurant/capacity', methods=['GET'])
@jwt_required()
def get_my_capacity():
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'error': 'Not authorized'}), 403
    return jsonify({
        'tables_count': me.tables_count or 0,
        'seats_per_table': me.seats_per_table or 0,
        'per_slot_capacity': (me.tables_count or 0) * (me.seats_per_table or 0)
    }), 200


@reservations_bp.route('/restaurant/capacity', methods=['PATCH'])
@jwt_required()
def update_my_capacity():
    current_email = get_jwt_identity()
    me = User.query.filter_by(email=current_email, is_restaurant=True).first()
    if not me:
        return jsonify({'error': 'Not authorized'}), 403
    data = request.get_json() or {}
    try:
        if 'tables_count' in data:
            me.tables_count = max(0, int(data.get('tables_count')))
        if 'seats_per_table' in data:
            me.seats_per_table = max(0, int(data.get('seats_per_table')))
        db.session.commit()
        return jsonify({'message': 'Capacity updated', 'tables_count': me.tables_count, 'seats_per_table': me.seats_per_table}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update capacity', 'details': str(e)}), 500
