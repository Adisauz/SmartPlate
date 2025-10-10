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
    weight REAL,
    breakfast_time TEXT DEFAULT '08:00',
    lunch_time TEXT DEFAULT '13:00',
    dinner_time TEXT DEFAULT '19:00',
    snack_time TEXT DEFAULT '16:00',
    dietary_preferences TEXT,
    allergies TEXT,
    cuisine_preferences TEXT
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
    meal_type TEXT DEFAULT 'Breakfast',
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

CREATE_FAVORITE_MEALS = '''
CREATE TABLE IF NOT EXISTS favorite_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(meal_id) REFERENCES meals(id)
);
'''

CREATE_GROCERY_ITEMS = '''
CREATE TABLE IF NOT EXISTS grocery_items (
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

CREATE_UTENSILS = '''
CREATE TABLE IF NOT EXISTS utensils (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''

CREATE_CHAT_MESSAGES = '''
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
        await db.execute(CREATE_FAVORITE_MEALS)
        await db.execute(CREATE_GROCERY_ITEMS)
        await db.execute(CREATE_PASSWORD_RESET_TOKENS)
        await db.execute(CREATE_UTENSILS)
        await db.execute(CREATE_CHAT_MESSAGES)
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
        
        # Migrate users table to add name, email, height, weight, and nutrition goals
        try:
            cursor = await db.execute("PRAGMA table_info(users)")
            cols = await cursor.fetchall()
            col_names = [col[1] for col in cols]
            
            if 'name' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN name TEXT")
            if 'email' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN email TEXT")
            if 'height' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN height REAL")
            if 'weight' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN weight REAL")
            if 'daily_calorie_goal' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN daily_calorie_goal INTEGER DEFAULT 2000")
            if 'daily_protein_goal' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN daily_protein_goal INTEGER DEFAULT 50")
            if 'daily_carbs_goal' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN daily_carbs_goal INTEGER DEFAULT 250")
            if 'daily_fat_goal' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN daily_fat_goal INTEGER DEFAULT 70")
            if 'breakfast_time' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN breakfast_time TEXT DEFAULT '08:00'")
            if 'lunch_time' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN lunch_time TEXT DEFAULT '13:00'")
            if 'dinner_time' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN dinner_time TEXT DEFAULT '19:00'")
            if 'snack_time' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN snack_time TEXT DEFAULT '16:00'")
            if 'dietary_preferences' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN dietary_preferences TEXT")
            if 'allergies' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN allergies TEXT")
            if 'cuisine_preferences' not in col_names:
                await db.execute("ALTER TABLE users ADD COLUMN cuisine_preferences TEXT")
        except Exception:
            pass
        
        # Migrate meals table to add new comprehensive fields
        try:
            cursor = await db.execute("PRAGMA table_info(meals)")
            cols = await cursor.fetchall()
            col_names = [col[1] for col in cols]
            
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
        
        # Migrate meal_plan_items to add meal_type
        try:
            cursor = await db.execute("PRAGMA table_info(meal_plan_items)")
            cols = await cursor.fetchall()
            col_names = [col[1] for col in cols]
            
            if 'meal_type' not in col_names:
                await db.execute("ALTER TABLE meal_plan_items ADD COLUMN meal_type TEXT DEFAULT 'Breakfast'")
        except Exception:
            pass
        
        await db.commit() 