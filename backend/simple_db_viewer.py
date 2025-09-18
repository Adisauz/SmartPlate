#!/usr/bin/env python3
"""
Simple SQLite Database Viewer for Meal Planner
View all tables and data in your app.db (no external dependencies)
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = 'app.db'

def connect_db():
    """Connect to the SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"❌ Error connecting to database: {e}")
        return None

def print_separator(title="", char="=", width=60):
    """Print a formatted separator"""
    if title:
        padding = (width - len(title) - 2) // 2
        print(f"{char * padding} {title} {char * padding}")
    else:
        print(char * width)

def display_table_data(conn, table_name):
    """Display table schema and data in a simple format"""
    print_separator(f"TABLE: {table_name.upper()}")
    
    # Get row count
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    row_count = cursor.fetchone()[0]
    print(f"📊 Total rows: {row_count}")
    
    if row_count == 0:
        print("❌ No data in this table\n")
        return
    
    # Get schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    schema = cursor.fetchall()
    
    print(f"\n🏗️  SCHEMA:")
    for col in schema:
        pk_marker = " (PRIMARY KEY)" if col[5] else ""
        null_marker = " NOT NULL" if col[3] else ""
        print(f"  • {col[1]}: {col[2]}{null_marker}{pk_marker}")
    
    # Get sample data
    print(f"\n📋 DATA (showing up to 5 rows):")
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
    rows = cursor.fetchall()
    
    if rows:
        # Get column names
        columns = [description[0] for description in cursor.description]
        
        for i, row in enumerate(rows, 1):
            print(f"\n--- Row {i} ---")
            for j, value in enumerate(row):
                col_name = columns[j]
                
                # Special formatting for different types
                if value is None:
                    display_value = "NULL"
                elif col_name == "password_hash":
                    display_value = f"{str(value)[:20]}... (bcrypt hash)"
                elif col_name == "ingredients" and value:
                    try:
                        ingredients = json.loads(value)
                        display_value = f"{ingredients} ({len(ingredients)} items)"
                    except:
                        display_value = str(value)
                elif isinstance(value, str) and len(value) > 100:
                    display_value = f"{value[:100]}..."
                else:
                    display_value = value
                
                print(f"  {col_name}: {display_value}")
    
    print("")

def show_users_summary(conn):
    """Show a summary of users"""
    print_separator("USERS SUMMARY")
    
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name FROM users")
    users = cursor.fetchall()
    
    if users:
        print(f"👥 Found {len(users)} user(s):")
        for user in users:
            print(f"  • ID: {user[0]}, Username: {user[1]}, Name: {user[2] or 'N/A'}")
    else:
        print("❌ No users found")
    print("")

def show_pantry_summary(conn):
    """Show pantry items summary by user"""
    print_separator("PANTRY SUMMARY")
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.username, COUNT(p.id) as item_count, GROUP_CONCAT(p.name, ', ') as items
        FROM users u 
        LEFT JOIN pantry_items p ON u.id = p.user_id 
        GROUP BY u.id, u.username
    """)
    pantry_data = cursor.fetchall()
    
    if pantry_data:
        for row in pantry_data:
            username, count, items = row
            print(f"👤 {username}: {count} item(s)")
            if items:
                items_list = items.split(', ')[:5]  # Show first 5 items
                items_display = ', '.join(items_list)
                if count > 5:
                    items_display += f"... (+{count-5} more)"
                print(f"    Items: {items_display}")
            print("")
    else:
        print("❌ No pantry data found")

def show_meals_summary(conn):
    """Show meals summary"""
    print_separator("MEALS SUMMARY")
    
    cursor = conn.cursor()
    cursor.execute("SELECT name, calories, prep_time, cook_time FROM meals LIMIT 10")
    meals = cursor.fetchall()
    
    if meals:
        print(f"🍽️  Found {len(meals)} meal(s) (showing up to 10):")
        for meal in meals:
            name, calories, prep_time, cook_time = meal
            total_time = (prep_time or 0) + (cook_time or 0)
            print(f"  • {name}")
            print(f"    Calories: {calories}, Time: {total_time} min (prep: {prep_time or 0}, cook: {cook_time or 0})")
    else:
        print("❌ No meals found")
    print("")

def main():
    print("🍽️  MEAL PLANNER DATABASE VIEWER")
    print(f"Database: {DB_PATH}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    # Connect to database
    conn = connect_db()
    if not conn:
        return
    
    try:
        # Get all tables
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        if not tables:
            print("❌ No tables found in the database")
            return
        
        print(f"📚 Found {len(tables)} table(s): {', '.join(tables)}")
        print("")
        
        # Show quick summaries first
        if 'users' in tables:
            show_users_summary(conn)
        
        if 'pantry_items' in tables:
            show_pantry_summary(conn)
        
        if 'meals' in tables:
            show_meals_summary(conn)
        
        # Show detailed data for each table
        print_separator("DETAILED TABLE DATA")
        for table in tables:
            display_table_data(conn, table)
        
        print_separator("DATABASE VIEWING COMPLETE")
        
    except Exception as e:
        print(f"❌ Error reading database: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    main()

