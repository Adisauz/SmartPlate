# Changelog

All notable changes to SmartPlate will be documented in this file.

## [1.1.0] - 2025-10-07

### 🎉 Major New Features

#### Kitchen Utensils Inventory System
- **Full equipment tracking** with 9 categories (Cookware, Bakeware, Knives, Utensils, Appliances, Measuring, Prep Tools, Storage, Other)
- **Quick Add feature** with 40+ pre-loaded common kitchen utensils
- **AI-aware recipe suggestions** that consider available equipment
- **Missing tool warnings** - AI alerts when recipes need tools you don't have
- **Alternative method suggestions** when key equipment is missing
- New `/utensils/` API endpoints for full CRUD operations
- Beautiful UtensilsScreen with category-based organization

#### Dietary Preferences & Personalization
- **Comprehensive dietary tracking** - diet type, allergies, cuisine preferences
- **AI integration** - recipes automatically respect dietary restrictions
- **Allergy safety** - AI NEVER includes allergens in recipes
- **Cuisine preference matching** - get more of what you like
- New dietary preferences modal in Profile screen
- Display dietary information with icons and colors

#### Enhanced Recipe Instructions
- **Detailed step-by-step instructions** with:
  - Exact temperatures (e.g., "375°F/190°C")
  - Specific cooking times (e.g., "3-4 minutes until golden")
  - Visual/sensory cues (e.g., "until edges are crispy")
  - Required utensils for each step
  - Cooking techniques (e.g., "dice finely", "fold gently")
  - 5-8 detailed steps per recipe

### ✨ Enhancements

#### AI Chef Improvements
- Now considers pantry items, dietary preferences, AND kitchen equipment
- Generates equipment-aware recipes
- Warns about missing tools before you start cooking
- Provides alternative methods for missing equipment
- More detailed and professional cooking instructions

#### Meal Planning
- **Meal type selector modal** - choose Breakfast, Lunch, Dinner, or Snacks
- **Auto-save on add to meal plan** - recipes are saved automatically
- **Better error handling** - gracefully skips missing meals instead of crashing
- Improved visual feedback with icons and colors

#### Onboarding Experience
- **Redesigned onboarding** with 8 comprehensive feature slides
- Color-coded slides with unique icons for each feature
- Progress indicator showing current position
- Dynamic button colors matching slide themes
- Better descriptions of all app capabilities

#### Home Screen
- **New "Kitchen Tools" quick action** - easy access to utensils inventory
- Teal-themed card with restaurant icon
- Reorganized quick actions for better flow

#### Profile Screen  
- **Dietary preferences section** showing diet type, allergies, and cuisines
- **Colored info cards** with relevant icons
- Better organization and visual hierarchy
- Nutrition tracking enhancements

### 🔧 Technical Improvements

#### Backend
- New `utensils` database table with user_id, name, and category
- `fetch_user_utensils()` function in ai.py
- `fetch_user_dietary_preferences()` function in ai.py
- Enhanced AI prompt with equipment awareness rules
- Updated database migrations
- New utensils.py router with full API

#### Frontend
- New UtensilsScreen.tsx with complete UI
- Updated navigation (RootStackParamList)
- HomeScreen quick actions addition
- RecipeDetailScreen meal type modal
- ProfileScreen dietary preferences UI
- TypeScript type improvements

#### API
- `POST /utensils/` - Add kitchen utensil
- `GET /utensils/` - List utensils with filters
- `GET /utensils/categories` - Get category list
- `PUT /utensils/{id}` - Update utensil
- `DELETE /utensils/{id}` - Delete utensil

### 📚 Documentation
- Completely updated README.md with all new features
- Added Kitchen Utensils section
- Added Dietary Preferences section  
- Updated API documentation
- Enhanced features in detail section
- Updated roadmap with completed items
- New CHANGELOG.md file

### 🐛 Bug Fixes
- Fixed 404 errors when meal plans reference deleted meals
- Added error handling to skip missing meals gracefully
- Fixed modal positioning and styling issues
- Improved toast notification timing

---

## [1.0.0] - 2025-10-01

### Initial Release

- AI Chef Assistant with OpenAI GPT integration
- Smart Pantry Detection with YOLO computer vision
- AI-Generated Recipe Images with Stable Diffusion XL
- Weekly Meal Planner with day and meal type organization
- Grocery List management
- Saved Meals / Recipe Database
- User Profile with nutrition goals
- JWT-based authentication
- Password reset functionality
- React Native (Expo) mobile app
- FastAPI backend
- SQLite database

---

## Future Plans

See README.md Roadmap section for upcoming features.

