<div align="center">

# 🍽️ SmartPlate — AI-Powered Meal Planning Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SmartPlate** is an intelligent meal planning ecosystem that combines cutting-edge AI, computer vision, and modern mobile development to revolutionize how you plan, cook, and enjoy your meals.

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

SmartPlate is a comprehensive meal planning solution built for the modern kitchen. With AI-powered recipe generation, smart pantry management using computer vision, and personalized nutrition tracking, SmartPlate makes meal planning effortless and enjoyable.

### Why SmartPlate?

- 🤖 **AI-First**: Leverages OpenAI's GPT models for intelligent recipe recommendations
- 📸 **Computer Vision**: YOLO-powered food detection from photos
- 🎨 **Beautiful Images**: AI-generated recipe images using Stable Diffusion XL
- 📱 **Mobile-First**: Native mobile experience with Expo & React Native
- 🔒 **Secure**: JWT-based authentication with password reset functionality
- ⚡ **Fast**: Asynchronous backend with SQLite for optimal performance

---

## ✨ Features

### 🍳 AI Chef Assistant
- **Natural Language Interface**: Chat with your personal AI chef for recipe ideas, cooking tips, and meal suggestions
- **Context-Aware Recommendations**: Get recipes based on your pantry items, dietary preferences, and nutritional goals
- **Recipe Generation**: Automatically generates complete recipes with ingredients, instructions, timing, and nutritional information
- **AI-Generated Images**: Beautiful, appetizing recipe images created with Stable Diffusion XL

### 🥗 Smart Pantry Management
- **Photo Detection**: Snap a photo of your groceries and let YOLO automatically identify items
- **Manual Entry**: Add items manually with search and categorization
- **Inventory Tracking**: Keep track of what you have in stock
- **Recipe Suggestions**: Get AI recommendations based on available ingredients
- **Smart Grocery Lists**: Automatically generate shopping lists from meal plans

### 📅 Intelligent Meal Planning
- **Weekly Planner**: Plan meals by day and meal type (breakfast, lunch, dinner, snacks)
- **Drag & Drop Interface**: Easily organize your weekly meal schedule
- **Nutritional Balance**: Track calories, protein, carbs, and fats across your meal plan
- **Meal Type Organization**: Separate planning for breakfast, lunch, dinner, and snacks
- **One-Click Add**: Add AI-generated recipes directly to your meal plan

### 🥘 Recipe Management
- **Comprehensive Recipe Database**: Save and organize all your favorite recipes
- **Detailed Recipe Cards**: Includes ingredients, instructions, prep/cook time, servings, and nutrition
- **Recipe Rating System**: Rate recipes and share cooking tips with the community
- **Search & Filter**: Find recipes by name, ingredients, or dietary requirements
- **Image Gallery**: Beautiful recipe images for visual inspiration

### 🛒 Grocery List
- **Auto-Generation**: Create shopping lists from meal plans automatically
- **Manual Management**: Add, edit, and remove items as needed
- **Smart Organization**: Items organized by category for efficient shopping
- **Cross-Device Sync**: Access your lists from anywhere

### 👤 User Profile & Personalization
- **Profile Management**: Set your name, email, height, weight, and dietary preferences
- **Nutritional Goals**: Define daily targets for calories, protein, carbs, and fats
- **Meal Time Preferences**: Set preferred times for breakfast, lunch, dinner, and snacks
- **Dietary Restrictions**: Specify dietary preferences (vegetarian, vegan, keto, etc.) and allergies
- **Cuisine Preferences**: Favorite cuisines for personalized recommendations
- **Progress Tracking**: Monitor daily nutritional intake against goals

### 🔐 Authentication & Security
- **JWT-Based Auth**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for password security
- **Password Reset**: Secure token-based password recovery system
- **Protected Routes**: API endpoints secured with bearer token authentication
- **Session Management**: Auto-token refresh and persistence

### 🎨 Modern UI/UX
- **Beautiful Design**: Clean, modern interface with smooth animations
- **Dark Mode Ready**: Eye-friendly interface for any lighting condition
- **Responsive Layout**: Optimized for phones and tablets
- **Gesture Controls**: Intuitive swipe and tap interactions
- **Loading States**: Smooth skeleton loaders and progress indicators
- **Toast Notifications**: Non-intrusive feedback for all actions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native 0.81 with Expo SDK 54
- **Language**: TypeScript 5.9
- **Navigation**: React Navigation 7 (Stack & Bottom Tabs)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: React Hooks & Context API
- **HTTP Client**: Axios
- **UI Components**: Expo Vector Icons, Expo Linear Gradient, Expo Blur
- **Image Handling**: Expo Image Picker, Expo Camera
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite with aiosqlite for async operations
- **Authentication**: python-jose (JWT), passlib (bcrypt)
- **AI/ML**:
  - **OpenAI GPT**: Recipe generation and chat interface
  - **Ultralytics YOLO**: Food item detection from images
  - **Stable Diffusion XL**: AI image generation via Hugging Face
  - **PyTesseract**: OCR for text detection (optional)
- **Image Processing**: Pillow, pillow-heif
- **Server**: Uvicorn (ASGI)
- **CORS**: Configured for mobile access

### Infrastructure
- **Environment**: python-dotenv for configuration
- **API Documentation**: Auto-generated with FastAPI (Swagger/ReDoc)
- **File Storage**: Local filesystem with static file serving
- **Async I/O**: Full async/await pattern throughout

---

## 📁 Project Structure

```
mealplanner/
├── backend/                      # FastAPI Backend
│   ├── main.py                   # Application entry point & route mounting
│   ├── database.py               # Database initialization & connection
│   ├── models.py                 # Pydantic models & schemas
│   ├── auth.py                   # Authentication & JWT management
│   ├── meals.py                  # Recipe CRUD operations
│   ├── plans.py                  # Meal planning endpoints
│   ├── pantry.py                 # Pantry inventory management
│   ├── grocery.py                # Grocery list endpoints
│   ├── ai.py                     # AI chat & recipe generation
│   ├── yolo_detection.py         # Computer vision food detection
│   ├── image_upload.py           # Image upload handling
│   ├── user_profile.py           # User profile management
│   ├── requirements.txt          # Python dependencies
│   ├── run_server.py             # Development server launcher
│   ├── app.db                    # SQLite database
│   ├── uploaded_images/          # Static image storage
│   └── venv/                     # Python virtual environment
│
├── frontend/                     # React Native App
│   ├── src/
│   │   ├── App.tsx               # Root component
│   │   ├── screens/              # Screen components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── AIChefScreen.tsx
│   │   │   ├── PantryScreen.tsx
│   │   │   ├── MealPlannerScreen.tsx
│   │   │   ├── GroceryListScreen.tsx
│   │   │   ├── SavedMealsScreen.tsx
│   │   │   ├── RecipeDetailScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── ResetPasswordScreen.tsx
│   │   ├── components/           # Reusable components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── RecipeRating.tsx
│   │   │   ├── SubscriptionModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── navigation/           # Navigation config
│   │   │   └── AppNavigator.tsx
│   │   ├── utils/                # Utilities
│   │   │   ├── api.ts            # API client & interceptors
│   │   │   └── notifications.ts   # Push notifications
│   │   └── types/                # TypeScript definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── app.json                  # Expo configuration
│
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **Python** 3.10 or higher
- **Expo CLI**: `npm install -g @expo/cli`
- **API Keys**:
  - OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
  - Hugging Face token ([Get one here](https://huggingface.co/settings/tokens))

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd mealplanner/backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**:
   
   **Windows (Command Prompt)**:
   ```cmd
   set OPENAI_API_KEY=your_openai_api_key_here
   set HF_TOKEN=your_hugging_face_token_here
   ```
   
   **Windows (PowerShell)**:
   ```powershell
   $env:OPENAI_API_KEY="your_openai_api_key_here"
   $env:HF_TOKEN="your_hugging_face_token_here"
   ```
   
   **macOS/Linux**:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   export HF_TOKEN=your_hugging_face_token_here
   ```

5. **Start the backend server**:
   ```bash
   python run_server.py
   ```

   The server will automatically detect your local IP address and display it. Note this IP (e.g., `http://192.168.1.x:8000`) for the frontend configuration.

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   # or
   yarn install
   ```

3. **Configure API endpoint**:
   
   Open `frontend/src/utils/api.ts` and update the `API_BASE` with your backend IP:
   
   ```typescript
   const API_BASE = 'http://192.168.1.x:8000'; // Replace with your IP
   ```

4. **Start the Expo development server**:
   ```bash
   npx expo start
   ```

5. **Run on your device**:
   - **Physical Device**: Download **Expo Go** from App Store/Play Store, then scan the QR code
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env or environment)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | Yes | `sk-...` |
| `HF_TOKEN` | Hugging Face token for Stable Diffusion | Yes | `hf_...` |
| `SECRET_KEY` | JWT secret key (default: supersecretkey) | No | `your-secret-key` |
| `DB_PATH` | Database file path (default: ./app.db) | No | `./app.db` |

#### Frontend

Configure in `frontend/src/utils/api.ts`:

```typescript
const API_BASE = 'http://192.168.1.x:8000'; // Your backend URL
```

### Database Schema

The SQLite database includes the following tables:
- `users` - User accounts and profiles
- `meals` - Recipe database
- `meal_plans` - Weekly meal plans
- `meal_plan_items` - Individual meals in plans
- `pantry_items` - User pantry inventory
- `grocery_items` - Shopping lists
- `password_reset_tokens` - Password recovery tokens

---

## 📚 API Documentation

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "username": "johndoe",
  "name": "John Doe"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "username": "johndoe"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "new_password": "newpassword123"
}
```

### Recipes (Meals)

#### Create Recipe
```http
POST /meals/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Chicken Alfredo",
  "ingredients": ["chicken", "pasta", "cream", "parmesan"],
  "instructions": "1. Cook pasta...",
  "nutrients": {
    "calories": 650,
    "protein": 35,
    "carbs": 60,
    "fat": 28
  },
  "prep_time": 15,
  "cook_time": 20,
  "image": "http://example.com/image.jpg"
}
```

#### List All Recipes
```http
GET /meals/
Authorization: Bearer {token}
```

#### Get Recipe by ID
```http
GET /meals/{meal_id}
Authorization: Bearer {token}
```

#### Delete Recipe
```http
DELETE /meals/{meal_id}
Authorization: Bearer {token}
```

### AI Chef

#### Ask AI
```http
POST /ask-ai/
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Give me a healthy dinner recipe with chicken"
}

Response:
{
  "answer": "Here's a delicious recipe...",
  "recipes": [...]  // Optional: generated recipes
}
```

### Pantry Management

#### Add Pantry Item
```http
POST /pantry/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Chicken Breast"
}
```

#### List Pantry Items
```http
GET /pantry/?search=chicken
Authorization: Bearer {token}
```

#### Update Pantry Item
```http
PUT /pantry/{item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Item Name"
}
```

#### Delete Pantry Item
```http
DELETE /pantry/{item_id}
Authorization: Bearer {token}
```

### Food Detection

#### Detect Food Items
```http
POST /detect/
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary image file)

Response:
{
  "detected_items": ["apple", "banana", "orange"]
}
```

### Meal Planning

#### Create Meal Plan
```http
POST /plans/
Authorization: Bearer {token}
Content-Type: application/json

{
  "start_date": "2025-10-07",
  "items": [
    {
      "day": 0,
      "meal_id": 1,
      "meal_type": "Breakfast"
    }
  ]
}
```

#### List Meal Plans
```http
GET /plans/
Authorization: Bearer {token}
```

#### Get Meal Plan
```http
GET /plans/{plan_id}
Authorization: Bearer {token}
```

#### Add Meal to Plan
```http
POST /plans/{plan_id}/add-meal
Authorization: Bearer {token}
Content-Type: application/json

{
  "day": 0,
  "meal_id": 5,
  "meal_type": "Dinner"
}
```

#### Remove Meal from Plan
```http
DELETE /plans/{plan_id}/meals/{meal_id}?day=0&meal_type=Dinner
Authorization: Bearer {token}
```

### User Profile

#### Get Profile
```http
GET /profile/
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /profile/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "height": 180,
  "weight": 75,
  "daily_calorie_goal": 2000,
  "daily_protein_goal": 150,
  "dietary_preferences": "vegetarian",
  "allergies": "nuts, shellfish",
  "cuisine_preferences": "Italian, Mexican"
}
```

#### Get Today's Nutrition
```http
GET /profile/nutrition/today
Authorization: Bearer {token}

Response:
{
  "calories": 1850,
  "protein": 145,
  "carbs": 180,
  "fat": 65
}
```

### Interactive API Documentation

Access the auto-generated API documentation:
- **Swagger UI**: `http://your-ip:8000/docs`
- **ReDoc**: `http://your-ip:8000/redoc`

---

## 🧑‍💻 Development

### Backend Development

#### Running with Auto-Reload
```bash
cd backend
python run_server.py
# or directly with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Database Viewer
```bash
python db_viewer.py
# or
python simple_db_viewer.py
```

#### Testing Endpoints
```bash
# Test health check
curl http://localhost:8000/

# Test with auth
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/meals/
```

### Frontend Development

#### Start Development Server
```bash
cd frontend
npx expo start
```

#### Clear Cache
```bash
npx expo start --clear
```

#### Type Checking
```bash
npx tsc --noEmit
```

#### Platform-Specific Builds
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

## 📱 Features In Detail

### AI-Powered Recipe Generation

SmartPlate uses OpenAI's GPT models to generate personalized recipes:
- Analyzes your pantry inventory
- Considers dietary preferences and restrictions
- Calculates nutritional information
- Generates step-by-step instructions
- Creates beautiful recipe images with Stable Diffusion XL

### Computer Vision Food Detection

YOLO (You Only Look Once) integration provides:
- Real-time food item detection from photos
- 200+ recognized food items
- Multi-item detection in single images
- Automatic pantry updates from photos
- OCR support for packaged food labels (with Tesseract)

### Smart Meal Planning

The meal planner helps you:
- Plan meals for the entire week
- Balance nutrition across days
- Avoid meal repetition
- Generate shopping lists automatically
- Track adherence to dietary goals

### Nutritional Tracking

Monitor your health with:
- Daily calorie tracking
- Macronutrient breakdown (protein, carbs, fats)
- Progress toward nutritional goals
- Historical data and trends
- Meal-by-meal analysis

---

## 🩹 Troubleshooting

### Backend Issues

#### Server won't start
```bash
# Check if port 8000 is in use
# Windows
netstat -ano | findstr :8000
# macOS/Linux
lsof -i :8000

# Kill the process or use a different port
uvicorn main:app --port 8001
```

#### API keys not working
- Verify keys are set correctly in environment
- Check for leading/trailing spaces
- Ensure keys haven't expired
- Verify OpenAI account has credits

#### Database errors
```bash
# Reset database
rm app.db
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

### Frontend Issues

#### App can't reach backend
1. **Check network**: Ensure phone and computer are on the same Wi-Fi
2. **Verify IP**: Use `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to confirm IP
3. **Update API_BASE**: Set correct IP in `frontend/src/utils/api.ts`
4. **Firewall**: Check if firewall is blocking port 8000
5. **Use tunnel**: Try `npx expo start --tunnel` if LAN doesn't work

#### CORS errors
- Backend CORS is configured for `*` by default
- If issues persist, check backend logs
- Verify token is being sent in Authorization header

#### Image picker not working
- Grant camera permissions in Expo Go
- Check that device has camera access
- Try restarting Expo Go app

#### Expo won't start
```bash
# Clear cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps

# Reset metro bundler
npx expo start --reset-cache
```

### Common Errors

#### "Invalid token" or 401 errors
- Token may have expired (12 hour lifetime)
- Log out and log back in
- Clear AsyncStorage if persisting

#### "Module not found" errors
```bash
# Frontend
cd frontend
npm install --legacy-peer-deps

# Backend
cd backend
pip install -r requirements.txt
```

#### YOLO model download issues
- Model downloads automatically on first use
- Check internet connection
- Manually download from [Ultralytics](https://github.com/ultralytics/assets/releases)
- Place `yolov8n.pt` in backend directory

---

## 🚀 Deployment

### Backend Deployment

#### Production Server
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export OPENAI_API_KEY=your_key
export HF_TOKEN=your_token
export SECRET_KEY=your_secure_secret_key

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Docker Deployment
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Cloud Platforms
- **Railway**: Connect GitHub repo, set environment variables
- **Render**: Use web service with Python environment
- **AWS EC2**: Deploy with nginx reverse proxy
- **Google Cloud Run**: Containerized deployment
- **Heroku**: Use Procfile with gunicorn

### Frontend Deployment

#### Build for Production
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Both
eas build --platform all
```

#### Expo Application Services (EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build: `eas build --platform all`
5. Submit: `eas submit --platform all`

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Social Features**: Share recipes with friends, community recipe sharing
- [ ] **Advanced Analytics**: Detailed nutrition reports and trends
- [ ] **Meal Prep Mode**: Batch cooking and meal prep planning
- [ ] **Integration**: Connect with fitness trackers and smart scales
- [ ] **Barcode Scanner**: Scan products to add to pantry
- [ ] **Voice Commands**: Voice-controlled cooking instructions
- [ ] **Recipe Scaling**: Automatic ingredient scaling for servings
- [ ] **Substitution Suggestions**: AI-powered ingredient substitutions
- [ ] **Multi-Language**: Support for multiple languages
- [ ] **Dark Mode**: Full dark mode support
- [ ] **Offline Mode**: Offline access to saved recipes
- [ ] **Recipe Import**: Import recipes from websites
- [ ] **Family Accounts**: Multiple users on one account
- [ ] **Shopping Integration**: Order groceries directly from app

### Performance Improvements

- [ ] Image caching and optimization
- [ ] Database indexing and query optimization
- [ ] Background sync for offline changes
- [ ] Progressive image loading
- [ ] Lazy loading for recipe lists

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/mealplanner.git
   cd mealplanner
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**
   - Test backend endpoints
   - Test frontend functionality
   - Ensure no regressions

5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use ESLint and Prettier
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for new features

### Bug Reports

Report bugs by opening an issue with:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 SmartPlate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

This project is built on the shoulders of giants:

- **[OpenAI](https://openai.com)** - GPT models for recipe generation and chat
- **[Ultralytics](https://ultralytics.com)** - YOLO computer vision models
- **[Hugging Face](https://huggingface.co)** - Stable Diffusion XL for image generation
- **[Expo](https://expo.dev)** - Amazing React Native framework
- **[FastAPI](https://fastapi.tiangolo.com)** - Modern Python web framework
- **[React Navigation](https://reactnavigation.org)** - Navigation library
- **[NativeWind](https://nativewind.dev)** - TailwindCSS for React Native

### Special Thanks

- The open-source community for invaluable tools and libraries
- Contributors who help improve SmartPlate
- Users who provide feedback and feature requests

---

## 📞 Support

Need help? We're here for you:

- **Documentation**: You're reading it! Check the sections above
- **Issues**: [GitHub Issues](https://github.com/yourusername/mealplanner/issues)
- **Email**: support@smartplate.app (if applicable)
- **Community**: Join our Discord/Slack (if applicable)

---

## 🌟 Star History

If you find SmartPlate useful, please consider giving it a star ⭐ on GitHub!

---

<div align="center">

**Made with ❤️ by the SmartPlate Team**

[⬆ Back to Top](#-smartplate--ai-powered-meal-planning-platform)

</div>