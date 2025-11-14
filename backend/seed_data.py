from app import create_app, db
from app.models import User, MenuItem, Menu, Booking, Reservation, Order, OrderItem
from datetime import date, timedelta
import random
from werkzeug.security import generate_password_hash

app = create_app()

def seed_data():
    try:
        with app.app_context():
            print("--- Starting Database Seeding ---")
            # Clear in dependency order (children first)
            db.session.query(OrderItem).delete()
            db.session.query(Order).delete()
            db.session.query(Reservation).delete()
            db.session.query(Booking).delete()
            db.session.query(Menu).delete() 
            db.session.query(MenuItem).delete() 
            db.session.query(User).delete()
            db.session.commit()
            print("Existing data cleared.")

            restaurants = [
                {
                    'name': 'The Gourmet Bistro',
                    'email': 'gourmet@bistro.com',
                    'password': 'password123',
                    'address': '700 Food Blvd, New York, NY 10001',
                    'latitude': 40.7580,
                    'longitude': -73.9855,
                    'is_restaurant': True 
                },
                {
                    'name': 'Dehradun Spice Hut',
                    'email': 'spicehut.ddn@food.com',
                    'password': 'password123',
                    'address': 'Rajpur Road, Dehradun, Uttarakhand, 248001, India',
                    'latitude': 30.3400,
                    'longitude': 78.0400,
                    'is_restaurant': True
                },
                {
                    'name': 'California Sushi Roll',
                    'email': 'sushi@cali.com',
                    'password': 'password123',
                    'address': '123 Ocean View, Los Angeles, CA 90001',
                    'latitude': 34.0522,
                    'longitude': -118.2437,
                    'is_restaurant': True
                },
                {
                    'name': 'Mumbai Street Food Corner',
                    'email': 'mumbai.street@food.in',
                    'password': 'password123',
                    'address': 'Bandra West, Mumbai, Maharashtra, India',
                    'latitude': 19.0500,
                    'longitude': 72.8800,
                    'is_restaurant': True
                }
            ]

            restaurant_users = []
            for data in restaurants:
                hashed_password = generate_password_hash(data['password'])
                restaurant = User(
                    name=data['name'], email=data['email'], password=hashed_password,
                    address=data['address'], latitude=data['latitude'], longitude=data['longitude'],
                    is_restaurant=data['is_restaurant']
                )
                db.session.add(restaurant)
                restaurant_users.append(restaurant)

            # Customers
            customers_raw = [
                {'name': 'Diner Customer', 'email': 'customer@test.com', 'password': 'password123',
                 'address': 'Clement Town, Dehradun, Uttarakhand, India', 'latitude': 30.3165, 'longitude': 78.0322},
                {'name': 'The Spicy Grill', 'email': 'spicygrill@test.com', 'password': 'password123',
                 'address': 'Connaught Place, New Delhi, India', 'latitude': 28.6315, 'longitude': 77.2167},
                {'name': 'The extra Spicy', 'email': 'spicygrill12@test.com', 'password': 'password123',
                 'address': 'Andheri West, Mumbai, India', 'latitude': 19.1360, 'longitude': 72.8295},
            ]
            customer_users = []
            for c in customers_raw:
                customer = User(
                    name=c['name'], email=c['email'], password=generate_password_hash(c['password']),
                    address=c['address'], latitude=c['latitude'], longitude=c['longitude'], is_restaurant=False
                )
                db.session.add(customer)
                customer_users.append(customer)

            menu_items = [
                {'name': 'Spicy Chicken Wings', 'category': 'Appetizer', 'description': 'Crispy wings tossed in a fiery sauce'},
                {'name': 'Margherita Pizza', 'category': 'Main Course', 'description': 'Classic pizza with fresh mozzarella and basil'},
                {'name': 'Minestrone Soup', 'category': 'Soup', 'description': 'Hearty vegetable soup'},
                {'name': 'Chocolate Lava Cake', 'category': 'Dessert', 'description': 'Warm cake with a molten chocolate center'},
                {'name': 'Paneer Tikka Masala', 'category': 'Indian', 'description': 'Cottage cheese in a rich tomato and cream sauce'},
                {'name': 'Grilled Salmon Fillet', 'category': 'Main Course', 'description': 'Salmon fillet served with roasted vegetables'},
                {'name': 'Vegan Tofu Stir Fry', 'category': 'Vegan', 'description': 'Tofu and seasonal veggies stir-fried in soy sauce'},
                {'name': 'Caesar Salad', 'category': 'Salad', 'description': 'Romaine lettuce, croutons, parmesan, and Caesar dressing'},
                {'name': 'Vegetable Samosa', 'category': 'Appetizer', 'description': 'Fried pastry filled with spiced potatoes and peas'},
                {'name': 'Cold Coffee', 'category': 'Beverage', 'description': 'Blended coffee drink with milk and ice cream'}
            ]

            item_objects = []
            for item_data in menu_items:
                item = MenuItem(**item_data)
                db.session.add(item)
                item_objects.append(item)

            db.session.flush()

            new_menu_entries_count = 0
            for restaurant in restaurant_users:
                for item in item_objects:
                    availability = random.randint(20, 150)
                    price = round(random.uniform(5, 50), 2)

                    menu_entry = Menu(
                        restaurant_id=restaurant.id, item_id=item.id, name=item.name,
                        category=item.category, description=item.description,
                        availability=availability, price=price,
                    )
                    db.session.add(menu_entry)
                    new_menu_entries_count += 1
            db.session.commit()

            # Create some reservations (confirmed)
            db.session.flush()
            today = date.today()
            reservations_created = 0
            for cust in customer_users:
                for r in random.sample(restaurant_users, k=min(2, len(restaurant_users))):
                    res = Reservation(
                        user_id=cust.id,
                        restaurant_id=r.id,
                        date=today + timedelta(days=random.randint(0, 5)),
                        time=(
                            # pick an hour slot between 12:00 and 21:00
                            (lambda h: __import__('datetime').time(h, 0))(random.randint(12, 21))
                        ),
                        party_size=random.randint(2, 6),
                        status='confirmed'
                    )
                    db.session.add(res)
                    reservations_created += 1

            # Create some orders with items and totals
            db.session.flush()
            orders_created = 0
            order_items_created = 0
            for cust in customer_users:
                for r in random.sample(restaurant_users, k=min(2, len(restaurant_users))):
                    order = Order(user_id=cust.id, restaurant_id=r.id, total_amount=0.0, status='placed')
                    db.session.add(order)
                    db.session.flush()

                    # pick 2-3 items from this restaurant's menu
                    menu_rows = Menu.query.filter_by(restaurant_id=r.id).all()
                    picks = random.sample(menu_rows, k=min(len(menu_rows), random.randint(2, 3)))
                    total = 0.0
                    for m in picks:
                        qty = random.randint(1, 3)
                        oi = OrderItem(order_id=order.id, menu_id=m.id, name_snapshot=m.name, quantity=qty, unit_price=m.price or 0.0)
                        db.session.add(oi)
                        order_items_created += 1
                        total += qty * (m.price or 0.0)
                        # optional: reduce availability to reflect orders
                        if m.availability is not None:
                            m.availability = max(0, (m.availability or 0) - qty)
                    order.total_amount = round(total, 2)
                    orders_created += 1

            db.session.commit()
            
            print("✅ Database seeded successfully for SmartDine!")
            print(f"Created {len(restaurant_users)} restaurants")
            print(f"Created {len(item_objects)} menu items")
            print(f"Created {new_menu_entries_count} menu entries")
            print(f"Created {reservations_created} reservations")
            print(f"Created {orders_created} orders and {order_items_created} order items")

    except Exception as e:
        db.session.rollback()
        print(f"🚨 FATAL ERROR during seeding! Data rollback occurred.")
        print(f"Details: {e}")

if __name__ == '__main__':
    seed_data()