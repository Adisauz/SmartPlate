# Meal Planner Backend

This is the Django backend for the Meal Planner application.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development server:
```bash
python manage.py runserver
```

The server will run at http://localhost:8000

## API Endpoints

- `/api/meals/` - CRUD operations for meals
- `/api/plans/` - CRUD operations for meal plans
- `/api/ingredients/` - CRUD operations for ingredients 