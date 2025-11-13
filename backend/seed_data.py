from app import create_app, db
from app.models import User, MenuItem, Menu, Booking 
from datetime import date, timedelta
import random
from werkzeug.security import generate_password_hash

app = create_app()

def seed_data():
    try:
        with app.app_context():
            print("--- Starting Database Seeding ---")
            
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
                    availability = random.randint(10, 100)
                    price = round(random.uniform(5, 50), 2)

                    menu_entry = Menu(
                        restaurant_id=restaurant.id, item_id=item.id, name=item.name,
                        category=item.category, description=item.description,
                        availability=availability, price=price,
                    )
                    db.session.add(menu_entry)
                    new_menu_entries_count += 1
            db.session.commit()
            
            print("✅ Database seeded successfully for SmartDine!")
            print(f"Created {len(restaurant_users)} restaurants")
            print(f"Created {len(item_objects)} menu items")
            print(f"Created {new_menu_entries_count} menu entries")

    except Exception as e:
        db.session.rollback()
        print(f"🚨 FATAL ERROR during seeding! Data rollback occurred.")
        print(f"Details: {e}")

if __name__ == '__main__':
    seed_data()