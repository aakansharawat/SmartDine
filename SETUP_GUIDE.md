# MediLocate Setup Guide for Windows

This guide will help you set up and run the MediLocate project on Windows.

## Prerequisites

1. **Python 3.8+** - Download from [python.org](https://www.python.org/downloads/)
2. **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
3. **PostgreSQL** - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
4. **Git** - Download from [git-scm.com](https://git-scm.com/download/win)

## Step 1: Database Setup

1. **Install PostgreSQL**
   - Download and install PostgreSQL from the official website
   - Remember the password you set for the `postgres` user
   - Keep the default port (5432)

2. **Create Database**
   - Open pgAdmin (comes with PostgreSQL)
   - Connect to your server
   - Right-click on "Databases" → "Create" → "Database"
   - Name it `medilocate`

3. **Update Database Configuration**
   - Open `backend/config.py`
   - Update the connection string with your credentials:
   ```python
   SQLALCHEMY_DATABASE_URI = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/medilocate"
   ```

## Step 2: Backend Setup

### Option A: Using the Batch Script (Recommended)

1. **Double-click `start_backend.bat`**
   - This will automatically:
     - Navigate to the backend directory
     - Create and activate virtual environment
     - Install dependencies
     - Initialize database
     - Seed sample data
     - Start the Flask server

### Option B: Manual Setup

1. **Open Command Prompt as Administrator**
   ```cmd
   cd D:\medilocate2\backend
   ```

2. **Create Virtual Environment**
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```cmd
   pip install -r requirements.txt
   ```

4. **Initialize Database**
   ```cmd
   python init_db.py
   ```

5. **Seed Sample Data**
   ```cmd
   python seed_data.py
   ```

6. **Start Backend Server**
   ```cmd
   python run.py
   ```

The backend will run on `http://localhost:5000`

## Step 3: Frontend Setup

### Option A: Using the Batch Script (Recommended)

1. **Double-click `start_frontend.bat`**
   - This will automatically:
     - Navigate to the frontend directory
     - Install dependencies
     - Start the React development server

### Option B: Manual Setup

1. **Open a new Command Prompt**
   ```cmd
   cd D:\medilocate2\MediLocate-frontend-1
   ```

2. **Install Dependencies**
   ```cmd
   npm install
   ```

3. **Start Frontend Server**
   ```cmd
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Step 4: Testing the Application

1. **Open your browser** and go to `http://localhost:3000`

2. **Test the application:**
   - Register a new account
   - Login with your credentials
   - Search for medicines using the sample data

3. **Sample Test Data:**
   - **Pharmacies:**
     - City Center Pharmacy (email: citycenter@pharmacy.com, password: password123)
     - Downtown Medical (email: downtown@medical.com, password: password123)
     - Health Plus Pharmacy (email: healthplus@pharmacy.com, password: password123)
   
   - **Sample Addresses to test:**
     - "123 Main Street, New York, NY 10001"
     - "456 Broadway, New York, NY 10013"
     - "789 5th Avenue, New York, NY 10065"
   
   - **Sample Medicines:**
     - Paracetamol
     - Ibuprofen
     - Amoxicillin
     - Metformin
     - Atorvastatin

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Backend: Change port in `backend/run.py` (line 6)
   - Frontend: Change port in `MediLocate-frontend-1/package.json` (add "PORT": 3001)

2. **Database Connection Error**
   - Check if PostgreSQL is running
   - Verify credentials in `backend/config.py`
   - Ensure database `medilocate` exists

3. **Node.js/npm Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` folder and run `npm install` again

4. **Python Virtual Environment Issues**
   - Delete `venv` folder and recreate: `python -m venv venv`
   - Activate: `venv\Scripts\activate`

5. **CORS Errors**
   - Backend is configured for `localhost:3000`
   - If using different port, update CORS settings in `backend/app/__init__.py`

### Error Messages

- **"Module not found"**: Run `pip install -r requirements.txt` or `npm install`
- **"Database connection failed"**: Check PostgreSQL is running and credentials are correct
- **"Port already in use"**: Kill processes using ports 3000/5000 or change ports

## API Testing with Postman

1. **Import these endpoints:**

   **Register User:**
   ```
   POST http://localhost:5000/api/register
   Content-Type: application/json
   
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "is_pharmacy": false,
     "address": "123 Test Street, New York, NY 10001"
   }
   ```

   **Login:**
   ```
   POST http://localhost:5000/login
   Content-Type: application/json
   
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

   **Search Medicine:**
   ```
   POST http://localhost:5000/api/search_medicine
   Content-Type: application/json
   
   {
     "address": "123 Test Street, New York, NY 10001",
     "medicine_name": "Paracetamol"
   }
   ```

## File Structure

```
medilocate2/
├── backend/                 # Flask backend
│   ├── app/                # Application code
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   ├── run.py             # Server startup
│   ├── init_db.py         # Database initialization
│   └── seed_data.py       # Sample data
├── MediLocate-frontend-1/  # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Node.js dependencies
│   └── public/            # Static files
├── start_backend.bat      # Windows backend startup
├── start_frontend.bat     # Windows frontend startup
└── README.md              # Project documentation
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure both backend and frontend are running
4. Check browser console for JavaScript errors
5. Check backend console for Python errors

## Next Steps

Once the application is running:

1. **Explore the features:**
   - User registration and login
   - Medicine search with auto-suggestions
   - Location-based pharmacy finding
   - Distance calculations

2. **Test with different data:**
   - Try different addresses
   - Search for various medicines
   - Test pharmacy registration

3. **Customize the application:**
   - Add more medicines to the database
   - Modify the UI styling
   - Add new features

Happy coding! 🚀 