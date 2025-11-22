---
description: Build and deploy the app to an Android device
---

# Build and Deploy to Android

Since this project uses native modules like `react-native-ble-plx`, you cannot use the standard Expo Go app from the Play Store. You must create a **Development Build**.

## Prerequisites

1.  **EAS CLI**: Ensure you have the Expo Application Services CLI installed.
    ```bash
    npm install -g eas-cli
    ```
2.  **Expo Account**: You need an account at [expo.dev](https://expo.dev). Run `eas login` to sign in.

## Step 1: Configure EAS

If you haven't already, configure the project for building:

```bash
npx eas build:configure
```

- Select `Android` when prompted.
- This creates an `eas.json` file.

## Step 2: Create a Development Build

Run the following command to build an APK for your device:

```bash
npx eas build --profile development --platform android
```

- This will upload your code to Expo's build servers.
- Once complete, it will provide a QR code and a link to download the `.apk` file.

## Step 3: Install on Device

1.  Download the `.apk` file to your Android device.
2.  Install it (you may need to allow installation from unknown sources).
3.  This installs a custom version of the app (often called "Thunderdomes (Dev)").

## Step 4: Run the Development Server

Now you can develop using this custom build:

1.  Start the development server:
    ```bash
    npx expo start --dev-client
    ```
2.  Open the "Thunderdomes (Dev)" app on your phone.
3.  Scan the QR code from the terminal (or find the server in the list if on the same Wi-Fi).

## Production Build (Optional)

If you want to build a standalone APK to share with others (that doesn't require a running dev server):

1.  Edit `eas.json` to add a `preview` profile if it doesn't exist:
    ```json
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
    ```
2.  Run the build:
    ```bash
    npx eas build --profile preview --platform android
    ```
