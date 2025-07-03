import aiosqlite

DB_PATH = 'app.db'

CREATE_USERS = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT
);
'''

CREATE_MEALS = '''
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    image TEXT
);
'''

CREATE_MEAL_PLANS = '''
CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''

CREATE_MEAL_PLAN_ITEMS = '''
CREATE TABLE IF NOT EXISTS meal_plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_plan_id INTEGER NOT NULL,
    day INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    FOREIGN KEY(meal_plan_id) REFERENCES meal_plans(id),
    FOREIGN KEY(meal_id) REFERENCES meals(id)
);
'''

CREATE_PANTRY_ITEMS = '''
CREATE TABLE IF NOT EXISTS pantry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_USERS)
        await db.execute(CREATE_MEALS)
        await db.execute(CREATE_MEAL_PLANS)
        await db.execute(CREATE_MEAL_PLAN_ITEMS)
        await db.execute(CREATE_PANTRY_ITEMS)
        await db.commit() 