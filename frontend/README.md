# Smart Meal Planner

A comprehensive meal planning and grocery management app built with React Native, Expo, and NativeWind.

## Features

- **Onboarding & Authentication**
  - Welcome screen with sign-up and login options
  - Dietary preferences and restrictions setup
  - Household size and meal frequency configuration

- **Home Dashboard**
  - Daily meal plan overview
  - Quick access to key features
  - Notifications for expiring items and updates

- **Weekly Meal Planner**
  - Interactive calendar with week view
  - Meal slots for breakfast, lunch, dinner, and snacks
  - Recipe management and meal plan generation

- **Recipe Management**
  - Detailed recipe view with ingredients and instructions
  - Serving size adjustments
  - Nutritional information
  - "Cook Now" mode with step-by-step guidance

- **Grocery List**
  - Auto-generated lists from meal plans
  - Category-based organization
  - Integration with delivery services
  - Budget tracking

- **Pantry Management**
  - Item tracking with expiry dates
  - Barcode scanning
  - Low stock alerts
  - Usage suggestions

- **Profile & Settings**
  - User preferences and goals
  - Dietary restrictions management
  - Notification settings
  - Theme customization

## Tech Stack

- React Native
- Expo
- NativeWind (Tailwind CSS for React Native)
- React Navigation
- TypeScript
- Expo Vector Icons
- React Native Reanimated
- React Native Gesture Handler

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-meal-planner.git
cd smart-meal-planner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# For iOS
npm run ios

# For Android
npm run android

# For web
npm run web
```

## Project Structure

```
src/
  ├── screens/          # Screen components
  ├── components/       # Reusable components
  ├── navigation/       # Navigation configuration
  ├── hooks/           # Custom React hooks
  ├── utils/           # Utility functions
  ├── constants/       # Constants and configuration
  ├── assets/          # Images, fonts, etc.
  ├── services/        # API and external service integration
  └── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icons provided by [Ionicons](https://ionicons.com/)
- Design inspiration from various meal planning and recipe apps 