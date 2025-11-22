# Thunderdomes Expo App - Setup Instructions

## Overview
This is a React Native app built with Expo for the Milwaukee Domes "Thunderdomes" experience, with **Appwrite** integration for authentication and data storage.

## What's Included

### 1. Login Screen (`src/screens/LoginScreen.tsx`)
- Age input field for validation
- Barcode scanner button that opens the camera
- Uses `expo-camera` for scanning QR codes, EAN, and Code 128/39 barcodes
- **Appwrite anonymous authentication** for ticket validation
- Stores user preferences (age, barcode data) in Appwrite
- Loading indicators during authentication

### 2. Main Navigation
Bottom tab navigation with three main sections:

#### Scavenger Hunt (`src/screens/ScavengerHuntScreen.tsx`)
- Placeholder page for interactive scavenger hunt challenges
- Future features listed: plant identification, QR scanning, progress tracking, badges, leaderboard

#### Café Tour (`src/screens/CafeTourScreen.tsx`)
- Placeholder page for dining experiences
- Future features listed: menu, nutritional info, seasonal offerings, event catering, online ordering

#### Audio Tour (`src/screens/AudioTourScreen.tsx`)
- Placeholder page for guided audio experiences
- Future features listed: multi-language support, dome-specific tours, downloadable content

### 3. Navigation Flow
- App starts with Login screen
- User enters age and scans ticket barcode
- **Appwrite validates and creates anonymous session**
- Tab navigation appears with access to all three tour pages
- Users can switch between tabs freely after login
- Session persists across app restarts

### 4. Appwrite Integration (`src/services/`)
- **appwrite.ts**: Appwrite client configuration
- **authService.ts**: Authentication service with methods for:
  - Anonymous login (for ticket scanning)
  - User account creation and login
  - Session management
  - Preference storage
  - Barcode validation

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Expo CLI (install with: `npm install -g expo-cli`)
- For testing: Expo Go app on iOS/Android
- **Appwrite account** (free at [cloud.appwrite.io](https://cloud.appwrite.io))

### Appwrite Setup (Required!)

**Before running the app**, you need to configure Appwrite:

1. **Create an Appwrite account** at [cloud.appwrite.io](https://cloud.appwrite.io)
2. **Create a new project** called "Thunderdomes"
3. **Get your Project ID** from Settings
4. **Enable Anonymous Sessions**:
   - Go to Auth → Settings
   - Enable "Anonymous Sessions"
   - Save changes
5. **Configure the app**:
   - Open `src/services/appwrite.ts`
   - Replace `YOUR_PROJECT_ID` with your actual Project ID

See [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) for detailed instructions.

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Appwrite (see above)

3. Start the development server:
```bash
npm start
```

3. Test the app:
   - Scan QR code with Expo Go (Android) or Camera app (iOS)
   - Or press 'w' to open in web browser
   - Or press 'i' for iOS simulator
   - Or press 'a' for Android emulator

## Project Structure
```
├── App.tsx                          # Main app entry with auth state
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── babel.config.js                  # Babel configuration for Expo
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Login with barcode scanner
│   │   ├── ScavengerHuntScreen.tsx # Scavenger hunt (placeholder)
│   │   ├── CafeTourScreen.tsx      # Café tour (placeholder)
│   │   └── AudioTourScreen.tsx     # Audio tour (placeholder)
│   └── navigation/
│       └── TabNavigator.tsx        # Bottom tab navigation
└── assets/                          # Image assets (needs to be populated)
```

## Key Dependencies

### Core
- `expo` (~52.0.0) - Expo SDK
- `react` (18.3.1) - React library
- `react-native` (0.76.5) - React Native framework

### Navigation
- `@react-navigation/native` (^6.1.9) - Navigation core
- `@react-navigation/bottom-tabs` (^6.5.11) - Bottom tab navigation
- `react-native-screens` (~4.4.0) - Native screen management
- `react-native-safe-area-context` (4.12.0) - Safe area handling

### Camera & Barcode
- `expo-camera` (~16.0.0) - Camera access for barcode scanning
- `expo-barcode-scanner` (~14.0.0) - Barcode scanning functionality

### Other
- `expo-status-bar` (~2.0.0) - Status bar management

## Camera Permissions

The app requests camera permissions on first use of the barcode scanner.

### iOS
- Permission prompt appears automatically
- Users can grant/deny access
- Permission message: "Allow Thunderdomes to access your camera for barcode scanning."

### Android
- Camera permission specified in `app.json`
- Permission requested at runtime
- Users can manage in app settings

## Styling

Each screen includes:
- Consistent color scheme (green primary color: #27ae60)
- Proper spacing and padding
- Responsive layout with ScrollView where needed
- Dashed border placeholder boxes for future features
- Emoji icons for visual appeal

## Testing the Login Flow

1. Start the app
2. Enter an age (e.g., "25")
3. Tap "📷 Scan Barcode to Validate"
4. Allow camera permissions
5. Scan any barcode/QR code
6. Alert will confirm scan
7. Tap OK to proceed to main app
8. Bottom tabs will appear with access to all three tour pages

## Next Steps

This template provides the foundation for:
1. Implementing actual authentication with a backend
2. Adding scavenger hunt game logic
3. Integrating café menu and ordering systems
4. Adding audio tour content and playback
5. Creating custom assets (icons, splash screens)
6. Adding plant database and location tracking
7. Implementing QR code scanning for exhibits

## Notes

- Asset files (icon.png, splash.png, etc.) need to be added to `assets/` directory
- Current barcode validation is placeholder - integrate with real backend
- All three tour screens are placeholders ready for feature implementation
- Styling is functional and can be enhanced with custom branding

## Branch
This code is on the `expo` branch as requested.
