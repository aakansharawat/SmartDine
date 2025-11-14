from flask import Blueprint, request, jsonify
from app.models import User, Menu, MenuItem 
from app import db
from geopy.geocoders import Nominatim
from math import radians, cos, sin, asin, sqrt

from app.utils.graph_interface import find_shortest_path 

from app.utils.trie_interface import build_trie, search_menu_item_prefix 

search_bp = Blueprint('search', __name__)

geolocator = Nominatim(user_agent="smartdine") 

@search_bp.before_app_first_request
def preload_trie():
    try:
        item_names = db.session.query(MenuItem.name).distinct().all() 
        build_trie([m[0] for m in item_names])
        print("✅ Trie preloaded with menu item names.")
    except Exception as e:
        print("❌ Error loading Trie:", e)

@search_bp.route('/api/search_menu_prefix', methods=['GET'])
def search_by_prefix():
    prefix = request.args.get('prefix', '')
 
    results = search_menu_item_prefix(prefix) 
    return jsonify({'results': results})

@search_bp.route('/api/search_menu_item', methods=['POST'])
def search_menu_item():
    data = request.get_json()
    address = data.get('address')

    item_name = data.get('item_name') 


    if not address or not item_name: 
        return jsonify({"error": "Address and item_name are required"}), 400

    try:
        location = geolocator.geocode(address)
        if not location:
            return jsonify({"error": "Invalid address"}), 400

        user_lat = location.latitude
        user_lon = location.longitude

        menu_entries = (
            db.session.query(Menu, User)
            .join(User, User.id == Menu.restaurant_id)
            .filter(User.is_restaurant == True)
            .filter(Menu.name.ilike(f"%{item_name}%"))
            .all()
        )

        restaurants_found = {} 

        for entry, restaurant_user in menu_entries: 

            restaurant_id = entry.restaurant_id 
            
            if restaurant_id not in restaurants_found:
                if restaurant_user.latitude is not None and restaurant_user.longitude is not None:
                    distance = calculate_distance(user_lat, user_lon, restaurant_user.latitude, restaurant_user.longitude)
                    restaurants_found[restaurant_id] = {
                        "details": {
                            "restaurant_id": restaurant_user.id,
                            "restaurant_name": restaurant_user.name, 
                            "restaurant_address": restaurant_user.address, 
                            "distance_km": round(distance, 2)
                        },

                        "menu_items": {} 
                    }
            
            if restaurant_id in restaurants_found:

                dish_name = entry.name 
                if dish_name not in restaurants_found[restaurant_id]['menu_items']:
                    restaurants_found[restaurant_id]['menu_items'][dish_name] = { 
                        'total_availability': 0,
                        'prices_and_batches': []
                    }

                restaurants_found[restaurant_id]['menu_items'][dish_name]['total_availability'] += entry.availability
                restaurants_found[restaurant_id]['menu_items'][dish_name]['prices_and_batches'].append({ 
                    "price": entry.price,
                })

        results = []
        for restaurant_id, data in restaurants_found.items(): 
            items_list = [] 
            if not data['menu_items']:
                continue

            for name, item_data in data['menu_items'].items(): 
                if not item_data['prices_and_batches']: 
                    continue
                
                min_price = min(b['price'] for b in item_data['prices_and_batches'])
                
                items_list.append({
                    "item_name": name,
                    "availability": item_data['total_availability'], 
                    "price": min_price,
                })

            results.append({
                "details": data['details'],
                "menu_items": items_list 
            })

        sorted_results = sorted(results, key=lambda p: p['details']['distance_km'])

        return jsonify({"results": sorted_results}), 200

    except Exception as e:
        print("Search Error:", str(e))
        return jsonify({"error": "Something went wrong during search"}), 500


def calculate_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km

@search_bp.route('/api/find_nearest_restaurant_path', methods=['POST'])
def find_nearest_path():
    data = request.get_json()
    address = data.get('address')
    item_name = data.get('item_name') 

    if not address or not item_name: 
        return jsonify({"error": "Address and item_name are required"}), 400

    location = geolocator.geocode(address)
    if not location:
        return jsonify({"error": "Invalid address"}), 400

    user_lat = location.latitude
    user_lon = location.longitude

    inventory_data = (
        db.session.query(User.id, User.name, User.latitude, User.longitude, Menu.name, Menu.availability)
        .join(Menu, Menu.restaurant_id == User.id)
        .filter(User.is_restaurant == True)
        .filter(Menu.name.ilike(f"%{item_name}%"))
        .filter(User.latitude.isnot(None), User.longitude.isnot(None))
        .all()
    )

    if not inventory_data: 
        return jsonify({"error": "No restaurants found with this menu item"}), 404

    nodes = {
        str(restaurant.id): (restaurant.latitude, restaurant.longitude)
        for restaurant in db.session.query(User).filter(User.is_restaurant==True).all()
        if restaurant.latitude and restaurant.longitude
    }

    graph = {}

    def haversine(lat1, lon1, lat2, lon2):
        from math import radians, sin, cos, sqrt, atan2
        R = 6371
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c

    for id1, (lat1, lon1) in nodes.items():
        graph[id1] = []
        for id2, (lat2, lon2) in nodes.items():
            if id1 != id2:
                graph[id1].append((id2, haversine(lat1, lon1, lat2, lon2)))

    user_node = "USER"
    graph[user_node] = []
    for rid, (rlat, rlon) in nodes.items():
        distance = haversine(user_lat, user_lon, rlat, rlon)
        graph[user_node].append((rid, distance))

    targets = [str(entry.id) for entry in inventory_data] 
    shortest_path = None
    shortest_len = float("inf")
    final_target = None

    for target in targets:
        path = find_shortest_path(graph, user_node, target)
        if path and len(path) < shortest_len:
            shortest_path = path
            shortest_len = len(path)
            final_target = target

    if not shortest_path: 
        return jsonify({"error": "No reachable restaurant found"}), 404

    restaurant = db.session.query(User).filter_by(id=int(final_target)).first() 

    return jsonify({
        "path": shortest_path,
        "nearest_restaurant": { 
            "id": restaurant.id,
            "name": restaurant.name,
            "address": restaurant.address,
            "latitude": restaurant.latitude,
            "longitude": restaurant.longitude
    }
    })