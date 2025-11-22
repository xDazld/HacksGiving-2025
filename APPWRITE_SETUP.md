# Appwrite Integration Guide for Thunderdomes

This guide explains how to set up and use Appwrite with the Thunderdomes app.

## Overview

Appwrite is integrated into the app to provide:
- **Authentication**: Anonymous sessions for ticket validation
- **User Preferences**: Store user age and ticket information
- **Data Storage**: Future expansion for user data and app content

## Setup Instructions

### 1. Create an Appwrite Account

1. Go to [Appwrite Cloud](https://cloud.appwrite.io/)
2. Sign up for a free account (or use your student plan)
3. Create a new project called "Thunderdomes"

### 2. Get Your Project Credentials

After creating your project:

1. Go to **Settings** in your Appwrite project dashboard
2. Note down your:
   - **Endpoint**: `https://cloud.appwrite.io/v1` (or your self-hosted URL)
   - **Project ID**: Found in Settings

### 3. Configure the App

Update `/src/services/appwrite.ts` with your credentials:

```typescript
export const APPWRITE_CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual project ID
  databaseId: 'YOUR_DATABASE_ID', // Optional, for future use
  userCollectionId: 'YOUR_USER_COLLECTION_ID', // Optional, for future use
};
```

### 4. Enable Anonymous Sessions (Important!)

For the barcode scanning to work without requiring email/password:

1. Go to your Appwrite project dashboard
2. Navigate to **Auth** → **Settings**
3. Enable **Anonymous Sessions**
4. Save changes

This allows users to scan their ticket and get immediate access without creating an account.

## How It Works

### Authentication Flow

1. **User enters age** and clicks "Scan Ticket to Enter"
2. **Camera scans barcode** (QR code or ticket barcode)
3. **App validates barcode** using `authService.validateBarcode()`
4. **Creates anonymous session** using `authService.loginAnonymous()`
5. **Stores user data** in preferences:
   - Age
   - Barcode data
   - Scan timestamp
6. **User gets access** to all tour pages

### Code Structure

```
src/
├── services/
│   ├── appwrite.ts          # Appwrite client configuration
│   └── authService.ts       # Authentication service wrapper
└── screens/
    └── LoginScreen.tsx      # Login UI with Appwrite integration
```

## Features

### Anonymous Authentication

```typescript
// Creates a temporary session without email/password
await authService.loginAnonymous();
```

Benefits:
- Quick access for visitors
- No personal information required
- Session persists for app usage
- Can be upgraded to full account later

### User Preferences

```typescript
// Store ticket and user data
await authService.updatePreferences({
  age: 25,
  barcodeData: 'TICKET12345',
  scanTimestamp: '2025-11-22T01:00:00.000Z',
});
```

This data is:
- Stored securely in Appwrite
- Associated with the anonymous session
- Available across app restarts
- Can be used for analytics

## Advanced Configuration (Optional)

### Adding a Database

If you want to store additional data:

1. In Appwrite dashboard, go to **Databases**
2. Create a new database: `thunderdomes_db`
3. Create collections as needed (e.g., `tickets`, `tours`, `user_progress`)
4. Update `APPWRITE_CONFIG` with your database ID

### Ticket Validation

To implement real ticket validation:

1. Create a `tickets` collection in Appwrite
2. Store valid ticket barcodes with metadata
3. Update `validateBarcode()` in `authService.ts`:

```typescript
async validateBarcode(barcodeData: string): Promise<boolean> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId!,
      'tickets', // collection ID
      [Query.equal('barcode', barcodeData)]
    );
    
    // Check if ticket exists and is not already used
    if (response.documents.length > 0) {
      const ticket = response.documents[0];
      return !ticket.used; // Return true if not used
    }
    return false;
  } catch (error) {
    console.error('Ticket validation error:', error);
    return false;
  }
}
```

### User Accounts (Future)

To add email/password login:

1. Keep anonymous login for quick access
2. Add "Create Account" option
3. Use `authService.createAccount()` and `authService.login()`
4. Link anonymous session to account

## Security Best Practices

1. **Never commit credentials**: Keep your project ID in environment variables for production
2. **Enable rate limiting**: Configure in Appwrite dashboard to prevent abuse
3. **Use HTTPS**: Always use secure connections
4. **Validate server-side**: Consider server-side ticket validation for production
5. **Monitor sessions**: Check Appwrite dashboard for active sessions

## Troubleshooting

### "Failed to validate ticket"

**Cause**: Appwrite client not properly configured
**Solution**: 
- Check your Project ID is correct
- Ensure anonymous sessions are enabled
- Check network connectivity

### "Invalid credentials"

**Cause**: Project ID mismatch
**Solution**: Verify `projectId` in `appwrite.ts` matches your Appwrite dashboard

### Session not persisting

**Cause**: App restart clears session
**Solution**: The app checks for active session on startup (already implemented in `App.tsx`)

### CORS errors (Web only)

**Cause**: Web platform needs CORS configuration
**Solution**: 
1. Go to Appwrite dashboard → Settings → Platforms
2. Add a Web platform
3. Add your web URL (e.g., `http://localhost:19006` for Expo web)

## Testing

### Test Anonymous Login

1. Start the app
2. Enter any age (e.g., 25)
3. Scan any QR code or barcode
4. Should see "Success" message
5. Check Appwrite dashboard → Auth → Users to see the anonymous session

### Test Session Persistence

1. Login successfully
2. Close and restart the app
3. Should automatically be logged in (no need to scan again)

## Student Plan Benefits

With your Appwrite student plan, you get:
- Unlimited users
- More bandwidth
- Increased storage
- Priority support

Make sure to apply your student discount in the Appwrite billing section!

## Next Steps

1. ✅ Set up Appwrite project
2. ✅ Configure credentials
3. ✅ Enable anonymous sessions
4. ✅ Test the login flow
5. 🔲 Add ticket collection for validation
6. 🔲 Implement tour progress tracking
7. 🔲 Add user analytics

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [React Native Appwrite SDK](https://appwrite.io/docs/sdks#react-native)
- [Appwrite Student Program](https://appwrite.io/students)
- [Expo Documentation](https://docs.expo.dev/)

## Support

For Appwrite-related issues:
- [Appwrite Discord](https://appwrite.io/discord)
- [GitHub Issues](https://github.com/appwrite/appwrite/issues)

For app-specific issues:
- Check the console logs
- Verify Appwrite configuration
- Test with a simple QR code first
