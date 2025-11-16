from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_restaurant = db.Column(db.Boolean, default=False) 
    location = db.Column(db.String(100)) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    # Reservation capacity settings
    tables_count = db.Column(db.Integer, default=10)  # number of tables
    seats_per_table = db.Column(db.Integer, default=4)  # seats per table
    
    menu = db.relationship('Menu', backref='restaurant', lazy=True, cascade="all, delete-orphan") 

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'is_restaurant': self.is_restaurant, 
            'location': self.location,
            'created_at': self.created_at,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'tables_count': self.tables_count,
            'seats_per_table': self.seats_per_table
        }

class MenuItem(db.Model): 
    __tablename__ = 'menu_items' 

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100)) 
    description = db.Column(db.String(255))

    menu_entries = db.relationship('Menu', backref='item', lazy=True) 

class Menu(db.Model): 
    __tablename__ = 'menu' 

    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) 
    item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False) 

    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100)) 
    description = db.Column(db.String(255))
    availability = db.Column(db.Integer) 
    price = db.Column(db.Float)



class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    restaurant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    booking_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('user_bookings', lazy=True))
    restaurant = db.relationship('User', foreign_keys=[restaurant_id], backref=db.backref('restaurant_bookings', lazy=True))

    def __repr__(self):
        return f"<Booking {self.id} at {self.restaurant_id}>"

# --- New models for reservations and orders ---

class Reservation(db.Model):
    __tablename__ = 'reservations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    party_size = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending|confirmed|cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('reservations', lazy=True))
    restaurant = db.relationship('User', foreign_keys=[restaurant_id])


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default='placed')  # placed|confirmed|preparing|ready|completed|cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('orders', lazy=True))
    restaurant = db.relationship('User', foreign_keys=[restaurant_id])


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menu.id'), nullable=False)
    name_snapshot = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=0.0)

    order = db.relationship('Order', backref=db.backref('items', lazy=True, cascade="all, delete-orphan"))
    menu = db.relationship('Menu')