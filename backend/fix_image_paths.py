"""
Fix image paths in database - replace backslashes with forward slashes
"""
import sqlite3

DB_PATH = "app.db"

def fix_image_paths():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all meals with image paths
    cursor.execute("SELECT id, image FROM meals WHERE image IS NOT NULL AND image != ''")
    meals = cursor.fetchall()
    
    fixed_count = 0
    for meal_id, image_path in meals:
        if image_path and '\\' in image_path:
            # Replace backslashes with forward slashes
            fixed_path = image_path.replace('\\', '/')
            cursor.execute("UPDATE meals SET image = ? WHERE id = ?", (fixed_path, meal_id))
            fixed_count += 1
            print(f"Fixed meal {meal_id}: {image_path} -> {fixed_path}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Fixed {fixed_count} image paths!")

if __name__ == "__main__":
    fix_image_paths()

