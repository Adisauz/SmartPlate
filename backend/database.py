import aiosqlite

DB_PATH = 'app.db'

CREATE_USERS = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    email TEXT,
    height REAL,
    weight REAL
);
'''

CREATE_MEALS = '''
CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    image TEXT,
    ingredients TEXT, -- JSON array of ingredient strings
    instructions TEXT,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    prep_time INTEGER DEFAULT 0, -- prep time in minutes
    cook_time INTEGER DEFAULT 0 -- cook time in minutes
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
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''

CREATE_PASSWORD_RESET_TOKENS = '''
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
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
        await db.execute(CREATE_PASSWORD_RESET_TOKENS)
        # Migrate legacy pantry schema that had a 'calories' column
        try:
            cursor = await db.execute("PRAGMA table_info(pantry_items)")
            cols = await cursor.fetchall()
            if any(col[1] == 'calories' for col in cols):
                await db.execute("ALTER TABLE pantry_items RENAME TO pantry_items_old")
                await db.execute('''
                CREATE TABLE pantry_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                );
                ''')
                await db.execute("INSERT INTO pantry_items (id, user_id, name) SELECT id, user_id, name FROM pantry_items_old")
                await db.execute("DROP TABLE pantry_items_old")
        except Exception:
            pass
        
        # Migrate users table to add email, height, weight
        try:
            cursor = await db.execute("PRAGMA table_info(users)")
            cols = await cursor.fetchall()
            col_names = [col[1] for col in cols]
            
            if 'email' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN email TEXT")
            if 'height' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN height REAL")
            if 'weight' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN weight REAL")
        except Exception:
            pass
        
        # Migrate meals table to add new comprehensive fields
        try:
            cursor = await db.execute("PRAGMA table_info(meals)")
            cols = await cursor.fetchall()
            col_names = [col[1] for col in cols]
            
            # Check if new columns exist, if not add them
            if 'ingredients' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN ingredients TEXT")
            if 'instructions' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN instructions TEXT")
            if 'protein' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN protein INTEGER DEFAULT 0")
            if 'carbs' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN carbs INTEGER DEFAULT 0")
            if 'fat' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN fat INTEGER DEFAULT 0")
            if 'prep_time' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN prep_time INTEGER DEFAULT 0")
            if 'cook_time' not in col_names:
                await db.execute("ALTER TABLE meals ADD COLUMN cook_time INTEGER DEFAULT 0")
        except Exception:
            pass
        await db.commit() 