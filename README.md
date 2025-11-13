# MediLocate - Pharmacy Finder

A web application to help users find the nearest pharmacy with specific medicine available in stock.

## Features

- **User Authentication**: Register and login for both regular users and pharmacies
- **Medicine Search**: Search for medicines with auto-suggestions using Trie data structure
- **Location-based Search**: Find pharmacies near your address using geocoding
- **Distance Calculation**: Calculate distances using Haversine formula
- **Path Finding**: Find optimal routes to pharmacies using Dijkstra's algorithm
- **Modern UI**: Clean, responsive interface built with Material-UI

## Tech Stack

### Backend
- **Flask**: Python web framework
- **PostgreSQL**: Database
- **SQLAlchemy**: ORM
- **Flask-JWT-Extended**: Authentication
- **Geopy**: Geocoding and distance calculations
- **PyBind11**: C++ integration for performance-critical algorithms

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **React Router**: Navigation
- **Axios**: HTTP client

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Windows 10/11 (tested on Windows)

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE medilocate;
```

2. Update the database connection in `backend/config.py`:
```python
SQLALCHEMY_DATABASE_URI = "postgresql://username:password@localhost:5432/medilocate"
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python init_db.py
```

5. Start the backend server:
```bash
python run.py
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd MediLocate-frontend-1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user/pharmacy
- `POST /login` - User login

### Search
- `GET /api/search_by_prefix?prefix=<medicine_name>` - Get medicine suggestions
- `POST /api/search_medicine` - Search for medicine in nearby pharmacies
- `POST /api/find_nearest_path` - Find optimal route to pharmacy

### Medicine Management
- `POST /upload_medicines` - Upload medicine inventory (pharmacy only)

## Usage

1. **Register/Login**: Create an account or login to access features
2. **Search for Medicine**: Enter your address and medicine name
3. **View Results**: See nearby pharmacies with medicine availability
4. **Get Directions**: View optimal routes to pharmacies

## Data Structure

### Users Table
- Regular users and pharmacies
- Location data with latitude/longitude
- Address information

### Medicines Table
- Medicine catalog with names and descriptions
- Manufacturer information

### Inventory Table
- Pharmacy-specific medicine stock
- Pricing and expiry information
- Stock levels

## Performance Features

- **Trie Data Structure**: Fast medicine name suggestions
- **Dijkstra's Algorithm**: Optimal path finding
- **Haversine Distance**: Accurate geographic calculations
- **C++ Integration**: Performance-critical algorithms

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Check if ports 3000 (frontend) and 5000 (backend) are available
3. **Dependencies**: Make sure all Python and Node.js dependencies are installed
4. **CORS Issues**: Backend is configured with CORS for localhost:3000

### Windows-Specific Notes

- Use `venv\Scripts\activate` for virtual environment
- PowerShell commands may need different syntax
- Ensure Node.js and Python are in PATH

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 