# Thunderdomes - Milwaukee Domes Mobile App

A React Native app built with Expo for the Milwaukee Domes, featuring interactive tours and scavenger hunts.

## Features

- **Login Screen**: Age verification and barcode scanning for ticket validation
- **Scavenger Hunt**: Interactive challenges throughout the three domes
- **Café Tour**: Information about dining experiences at the Domes
- **Audio Tour**: Guided audio experiences for each dome

## Prerequisites

- Node.js (>=20)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

```
├── App.tsx                 # Main app entry point
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── ScavengerHuntScreen.tsx
│   │   ├── CafeTourScreen.tsx
│   │   └── AudioTourScreen.tsx
│   └── navigation/        # Navigation configuration
│       └── TabNavigator.tsx
├── assets/                # Images and static assets
└── app.json              # Expo configuration

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Open app in Android emulator
- `npm run ios` - Open app in iOS simulator
- `npm run web` - Open app in web browser
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Camera Permissions

The app requires camera permissions for barcode scanning. On first use:
- iOS: Permission prompt will appear automatically
- Android: Permission must be granted in app settings

## Development

### Adding Assets

Place image assets in the `assets/` directory:
- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen (1242x2436)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `favicon.png` - Web favicon (48x48)

### Barcode Scanning

The login screen uses expo-camera for barcode scanning. Supported formats:
- QR codes
- EAN-13, EAN-8
- Code 128, Code 39

## License

This project is part of HacksGiving 2025 in collaboration with MSOE and Milwaukee Domes Alliance.
