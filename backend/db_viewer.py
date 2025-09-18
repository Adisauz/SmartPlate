#!/usr/bin/env python3
"""
SQLite Database Viewer for Meal Planner
View all tables, schemas, and data in your app.db
"""

import sqlite3
import json
from datetime import datetime
from tabulate import tabulate

DB_PATH = 'app.db'

def connect_db():
    """Connect to the SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def get_all_tables(conn):
    """Get list of all tables in the database"""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]
    return tables

def get_table_schema(conn, table_name):
    """Get schema information for a table"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    return cursor.fetchall()

def get_table_data(conn, table_name, limit=10):
    """Get data from a table with optional limit"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
    return cursor.fetchall()

def get_row_count(conn, table_name):
    """Get total number of rows in a table"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    return cursor.fetchone()[0]

def format_json_field(value):
    """Format JSON fields for better readability"""
    if value and isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list) and len(parsed) > 0:
                return f"[{len(parsed)} items]: {', '.join(parsed[:3])}{'...' if len(parsed) > 3 else ''}"
        except:
            pass
    return value

def display_table_info(conn, table_name):
    """Display comprehensive information about a table"""
    print(f"\n{'='*60}")
    print(f"📊 TABLE: {table_name.upper()}")
    print(f"{'='*60}")
    
    # Get row count
    row_count = get_row_count(conn, table_name)
    print(f"Total rows: {row_count}")
    
    if row_count == 0:
        print("❌ No data in this table")
        return
    
    # Get schema
    schema = get_table_schema(conn, table_name)
    print(f"\n🏗️  SCHEMA:")
    schema_headers = ["Column", "Type", "Not Null", "Default", "Primary Key"]
    schema_data = []
    for col in schema:
        schema_data.append([
            col[1],  # name
            col[2],  # type
            "Yes" if col[3] else "No",  # not null
            col[4] if col[4] else "None",  # default
            "Yes" if col[5] else "No"   # primary key
        ])
    print(tabulate(schema_data, headers=schema_headers, tablefmt="grid"))
    
    # Get data
    print(f"\n📋 DATA (showing up to 10 rows):")
    data = get_table_data(conn, table_name, 10)
    
    if data:
        # Convert to list of lists for tabulate
        headers = [description[0] for description in data[0].keys()]
        rows = []
        
        for row in data:
            formatted_row = []
            for col in row:
                # Special formatting for different column types
                if isinstance(col, str) and len(col) > 50:
                    # Truncate long strings
                    formatted_row.append(col[:47] + "...")
                elif col is None:
                    formatted_row.append("NULL")
                else:
                    # Format JSON fields
                    formatted_row.append(format_json_field(col))
            rows.append(formatted_row)
        
        print(tabulate(rows, headers=headers, tablefmt="grid"))
    
    print(f"\n")

def search_users(conn, search_term=None):
    """Search for users with optional search term"""
    cursor = conn.cursor()
    if search_term:
        cursor.execute("SELECT id, username, name FROM users WHERE username LIKE ? OR name LIKE ?", 
                      (f"%{search_term}%", f"%{search_term}%"))
        print(f"\n🔍 SEARCH RESULTS for '{search_term}':")
    else:
        cursor.execute("SELECT id, username, name FROM users")
        print(f"\n👥 ALL USERS:")
    
    users = cursor.fetchall()
    if users:
        headers = ["ID", "Username", "Name"]
        rows = [[user[0], user[1], user[2] or "N/A"] for user in users]
        print(tabulate(rows, headers=headers, tablefmt="grid"))
    else:
        print("No users found")

def main():
    print("🍽️  MEAL PLANNER DATABASE VIEWER")
    print(f"Database: {DB_PATH}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Connect to database
    conn = connect_db()
    if not conn:
        return
    
    try:
        # Get all tables
        tables = get_all_tables(conn)
        
        if not tables:
            print("\n❌ No tables found in the database")
            return
        
        print(f"\n📚 TABLES FOUND: {', '.join(tables)}")
        
        # Display each table
        for table in tables:
            display_table_info(conn, table)
        
        # Special user search functionality
        print("="*60)
        print("🔍 QUICK USER LOOKUP")
        print("="*60)
        search_users(conn)
        
        print("\n" + "="*60)
        print("✅ Database viewing complete!")
        print("="*60)
        
    except Exception as e:
        print(f"Error reading database: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    main()
