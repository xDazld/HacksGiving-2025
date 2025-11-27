import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSegments: () => [],
  Stack: {
    Screen: () => null,
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      appwriteEndpoint: 'https://test.appwrite.io/v1',
      appwriteProjectId: 'test-project',
      appwriteDatabaseId: 'test-db',
      appwritePlantsCollectionId: 'plants',
    },
  },
}));