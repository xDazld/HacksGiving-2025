# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Appwrite Plant Integration

This app now loads plant data from an Appwrite Database collection (`plants`) provisioned by the management server. If remote fetch fails, it falls back to the bundled CSV.

### Configuration

Set the following in `app.json` under `expo.extra` (or via EAS secrets):

```jsonc
"appwriteEndpoint": "https://cloud.appwrite.io/v1",
"appwriteProjectId": "<your-project-id>",
"appwriteDatabaseId": "milwaukee-domes",
"appwritePlantsCollectionId": "plants"
```

### Usage

Wrap the root layout with `PlantProvider` (already configured). Access plants with:

```tsx
import { usePlants } from '@/contexts/PlantContext';
const { plants, refresh } = usePlants();
```

### Offline Caching

Successful responses are cached in AsyncStorage (`plants-cache-v1`). Call `refresh({ force: true })` to bust cache.

### Document Mapping

Appwrite fields (snake_case) → UI record fields:

- `common_name` → `Common Name`
- `scientific_name` → `Scientific Name`
- `quantity` → `Qty`
- Boolean flags map to an `'x'` marker.

### Adding New Fields

Add attributes to the Appwrite collection, then extend `PlantDoc` and `docToRecord` in `services/PlantService.ts`.

### Fallback CSV

If the Appwrite fetch returns no documents or errors, the provider parses `Plants_Formatted.csv` for continuity.
