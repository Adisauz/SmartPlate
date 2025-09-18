# 🍽️ SmartPlate – AI-Powered Meal Planner

SmartPlate is a comprehensive **AI-powered meal planning application** featuring a React Native mobile app and FastAPI backend. It combines traditional meal planning with cutting-edge AI technology for recipe suggestions and intelligent pantry management through computer vision.

---

## 🚀 Key Features

### 🤖 AI-Powered Features
- **AI Chef Assistant**: Get personalized recipe suggestions based on your preferences and dietary needs using OpenAI
- **Smart Pantry Detection**: Use your camera to automatically detect and add food items to your pantry using YOLO computer vision
- **Recipe Image Generation**: AI-generated food images for recipes using Stable Diffusion XL via Hugging Face

### 🔐 User Authentication
- Secure JWT-based authentication system
- Protected API endpoints with token validation
- User registration and login functionality

### 🍽️ Meal Management
- Complete CRUD operations for meals
- Detailed nutritional information (calories, protein, carbs, fat)
- Recipe instructions and ingredient lists
- Cooking time tracking (prep time + cook time)
- Recipe rating and review system

### 📅 Smart Meal Planning
- Create personalized meal plans for any date range
- Assign meals to different meal types (breakfast, lunch, dinner, snacks)
- Visual calendar interface for easy meal scheduling
- Nutritional overview for planned meals

### 🥘 Pantry Management
- **AI Camera Detection**: Take photos or upload images to automatically detect food items
- Add, edit, and delete pantry items
- Category-based organization (canned goods, dry goods, spices, etc.)
- Search and filter functionality
- Low stock and expiration tracking

### 📱 Mobile Experience
- Native React Native app with Expo
- Beautiful, intuitive UI with modern design patterns
- Responsive layouts optimized for mobile devices
- Image capture and gallery integration
- Push notifications support

### 🔌 Robust API
- FastAPI backend with automatic API documentation
- RESTful endpoints for all features
- File upload support for images
- Real-time data synchronization

---

## 🛠️ Technologies Used

### Frontend (Mobile)
- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **React Navigation** for seamless navigation
- **Expo Image Picker** for camera and gallery access
- **Axios** for API communication
- **React Native Gesture Handler** and **Reanimated** for smooth interactions

### Backend
- **FastAPI** - Modern, fast web framework for Python
- **Python 3.10+**
- **SQLite** database with **aiosqlite** for async operations
- **JWT Authentication** with python-jose
- **OpenAI API** for AI chat completions
- **Ultralytics YOLO** for computer vision food detection
- **Hugging Face** for image generation with Stable Diffusion XL
- **Pillow (PIL)** for image processing

### AI & Machine Learning
- **OpenAI GPT** for recipe suggestions and cooking assistance
- **YOLOv8** for real-time food item detection
- **Stable Diffusion XL** for AI-generated food photography
- **Hugging Face Inference API** for model deployment

---

## 📁 Project Structure

```
mealplanner/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── auth.py             # Authentication endpoints
│   ├── meals.py            # Meal management endpoints
│   ├── pantry.py           # Pantry management endpoints
│   ├── plans.py            # Meal planning endpoints
│   ├── ai.py               # AI chat and recipe generation
│   ├── yolo_detection.py   # Computer vision food detection
│   ├── image_upload.py     # Image upload handling
│   ├── database.py         # Database configuration
│   ├── models.py           # Data models
│   ├── requirements.txt    # Python dependencies
│   ├── run_server.py       # Development server with auto IP detection
│   └── uploaded_images/    # Static file storage
├── frontend/               # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   │   ├── AIChefScreen.tsx
│   │   │   ├── PantryScreen.tsx
│   │   │   ├── MealPlannerScreen.tsx
│   │   │   └── RecipeDetailScreen.tsx
│   │   ├── components/     # Reusable components
│   │   ├── navigation/     # Navigation configuration
│   │   └── utils/         # API utilities
│   ├── package.json
│   └── app.json           # Expo configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Expo CLI**: `npm install -g @expo/cli`
- **OpenAI API Key**
- **Hugging Face API Key**

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   git clone <repository-url>
   cd mealplanner/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   # Add your API keys to environment variables
   export OPENAI_API_KEY="your_openai_api_key"
   export HF_TOKEN="your_hugging_face_token"
   ```

5. **Run the development server**:
   ```bash
   python run_server.py
   ```
   The server will automatically detect your local IP and display connection info.

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Update API configuration**:
   - Edit `src/utils/api.ts`
   - Update `API_BASE` with your backend IP address from the server startup logs

4. **Start the development server**:
   ```bash
   npx expo start
   ```

5. **Run on device**:
   - Install Expo Go app on your phone
   - Scan the QR code to run the app
   - Or use `npx expo start --android/--ios` for emulators

---

## 📱 App Features Guide

### AI Chef Assistant
- Navigate to the "AI Chef" tab
- Ask questions about recipes, cooking techniques, or dietary preferences
- Get personalized recipe suggestions with AI-generated images
- Tap recipe cards to view full details and add to meal plans

### Smart Pantry Management
- Go to "Pantry" screen
- Tap the camera button (with sparkles icon) to use AI detection
- Choose "Take Photo" or "Choose from Gallery"
- AI will automatically detect food items in the image
- Select detected items to add to your pantry
- Manually add items using the text input form

### Meal Planning
- Use the "Meal Planner" to schedule your meals
- Create custom meal plans for any date range
- Assign meals to different times of day
- View nutritional summaries for planned meals

---

## 🔧 Configuration

### Backend Configuration
- **Database**: SQLite by default, easily configurable for PostgreSQL
- **CORS**: Configured for mobile app access
- **File Storage**: Local storage for uploaded images
- **AI Models**: Configurable model parameters in respective modules

### Frontend Configuration
- **API Endpoint**: Update in `src/utils/api.ts`
- **Expo Configuration**: Modify `app.json` for app settings
- **Navigation**: Customize in `src/navigation/AppNavigator.tsx`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for powerful language models
- **Ultralytics** for YOLO computer vision models
- **Hugging Face** for Stable Diffusion image generation
- **Expo Team** for excellent React Native development tools
- **FastAPI** for the amazing Python web framework

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

*Built with ❤️ using modern AI and mobile technologies*