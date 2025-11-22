# API Integration Guide for Mobile App

This guide helps the mobile app team integrate with the Milwaukee Domes Management API.

## 🔗 Base URLs

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://your-deployed-api.com/api/v1`

Update this in your mobile app:

```typescript
// Thunderdomes/services/api.ts
const API_BASE_URL = 'https://your-deployed-api.com/api/v1';
```

## 📡 Available Endpoints

### 1. Tours

#### Get All Tours
```typescript
GET /tours

Response: Tour[]
[
  {
    "id": "123",
    "title": "Tropical Dome Discovery",
    "description": "Explore tropical plants...",
    "parts": [
      {
        "id": "part1",
        "title": "Welcome",
        "content": "Welcome to...",
        "unlock_progress": 0,
        "audio_url": null
      }
    ],
    "created_at": "2025-11-22T12:00:00Z",
    "updated_at": "2025-11-22T12:00:00Z"
  }
]
```

#### Get Single Tour
```typescript
GET /tours/{tour_id}

Response: Tour
```

**Implementation:**
```typescript
export async function fetchTours(): Promise<Tour[]> {
  const response = await fetch(`${API_BASE_URL}/tours`);
  if (!response.ok) throw new Error('Failed to fetch tours');
  return await response.json();
}
```

### 2. Scavenger Hunts

#### Get All Scavenger Hunts
```typescript
GET /scavenger-hunts

Response: ScavengerHunt[]
[
  {
    "id": "456",
    "title": "Plant Detective Challenge",
    "description": "Find these plants...",
    "difficulty": "easy",
    "items": [
      {
        "id": "1",
        "name": "Bird of Paradise",
        "description": "Find the plant with...",
        "image_url": null,
        "hint": "Look in the tropical section",
        "qr_code": null
      }
    ],
    "created_at": "2025-11-22T12:00:00Z",
    "updated_at": "2025-11-22T12:00:00Z"
  }
]
```

**Implementation:**
```typescript
export async function fetchScavengerHunts(): Promise<ScavengerHunt[]> {
  const response = await fetch(`${API_BASE_URL}/scavenger-hunts`);
  if (!response.ok) throw new Error('Failed to fetch scavenger hunts');
  return await response.json();
}
```

### 3. Cafe Tours

#### Get All Cafe Tours
```typescript
GET /cafe-tours

Response: CafeTour[]
[
  {
    "id": "789",
    "title": "Cafe and Garden Tour",
    "description": "Learn about plants in our cafe...",
    "parts": [
      {
        "id": "part1",
        "title": "Herb Garden",
        "content": "Our cafe uses fresh herbs...",
        "unlock_progress": 0,
        "recipe_url": null
      }
    ],
    "created_at": "2025-11-22T12:00:00Z",
    "updated_at": "2025-11-22T12:00:00Z"
  }
]
```

**Implementation:**
```typescript
export async function fetchCafeTours(): Promise<CafeTour[]> {
  const response = await fetch(`${API_BASE_URL}/cafe-tours`);
  if (!response.ok) throw new Error('Failed to fetch cafe tours');
  return await response.json();
}
```

### 4. Progress Tracking

#### Calculate Progress
```typescript
POST /progress/calculate

Request Body:
{
  "ids": ["beacon1", "beacon2", "beacon3"],
  "rssi": [-65, -70, -55]
}

Response: ProgressData
{
  "progress": 45.5,
  "nearest_location": "beacon3",
  "suggested_next": "Continue forward to discover more exhibits"
}
```

**Implementation:**
```typescript
export async function calculateProgress(beaconData: BeaconAPIFormat): Promise<ProgressData> {
  const response = await fetch(`${API_BASE_URL}/progress/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(beaconData),
  });
  
  if (!response.ok) throw new Error('Failed to calculate progress');
  return await response.json();
}
```

### 5. Barcode Validation

#### Validate Ticket
```typescript
POST /progress/validate-ticket

Request Body:
{
  "barcode": "TICKET-12345"
}

Response: BarcodeValidationResponse
{
  "valid": true,
  "ticket_type": "adult",
  "visitor_name": "John Doe",
  "expiry_date": "2025-12-31T23:59:59Z",
  "message": "Ticket is valid"
}
```

**Implementation:**
```typescript
export async function validateBarcode(barcode: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/progress/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode }),
  });
  
  if (!response.ok) return false;
  const data = await response.json();
  return data.valid === true;
}
```

### 6. Plants Database

#### Get All Plants
```typescript
GET /plants?limit=100&offset=0

Response: Plant[]
[
  {
    "id": "plant123",
    "common_name": "Bird of Paradise",
    "scientific_name": "Strelitzia reginae",
    "quantity": 3,
    "dome_location": "Tropical Dome",
    "notes": "Blooms in spring",
    "image_url": null,
    "created_at": "2025-11-22T12:00:00Z",
    "updated_at": "2025-11-22T12:00:00Z"
  }
]
```

**Implementation:**
```typescript
export async function fetchPlants(limit: number = 100): Promise<Plant[]> {
  const response = await fetch(`${API_BASE_URL}/plants?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch plants');
  return await response.json();
}
```

## 🔒 Authentication (Admin Only)

Most endpoints are public (GET). Admin endpoints require authentication.

### Login
```typescript
POST /auth/login-json

Request Body:
{
  "username": "admin",
  "password": "your-password"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Using the Token
```typescript
// For protected endpoints (POST, PUT, DELETE)
const response = await fetch(`${API_BASE_URL}/tours`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newTour),
});
```

## 📱 Complete Integration Example

Replace the entire `Thunderdomes/services/api.ts` with:

```typescript
import { Tour, ScavengerHunt, CafeTour, ProgressData, BeaconAPIFormat } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Error handling wrapper
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export async function fetchTours(): Promise<Tour[]> {
  return apiCall<Tour[]>(`${API_BASE_URL}/tours`);
}

export async function fetchScavengerHunts(): Promise<ScavengerHunt[]> {
  return apiCall<ScavengerHunt[]>(`${API_BASE_URL}/scavenger-hunts`);
}

export async function fetchCafeTours(): Promise<CafeTour[]> {
  return apiCall<CafeTour[]>(`${API_BASE_URL}/cafe-tours`);
}

export async function calculateProgress(beaconData: BeaconAPIFormat): Promise<ProgressData> {
  return apiCall<ProgressData>(`${API_BASE_URL}/progress/calculate`, {
    method: 'POST',
    body: JSON.stringify(beaconData),
  });
}

export async function validateBarcode(barcode: string): Promise<boolean> {
  try {
    const data = await apiCall<{ valid: boolean }>(`${API_BASE_URL}/progress/validate-ticket`, {
      method: 'POST',
      body: JSON.stringify({ barcode }),
    });
    return data.valid;
  } catch {
    return false;
  }
}
```

## 🔧 Environment Setup

Add to your `.env` file:

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1

# Production (update after deployment)
# EXPO_PUBLIC_API_URL=https://your-api.railway.app/api/v1
```

## 📊 Data Models

All TypeScript types match the API responses. Update `Thunderdomes/types/index.ts`:

```typescript
export interface Tour {
  id: string;
  title: string;
  description: string;
  parts: TourPart[];
  created_at?: string;
  updated_at?: string;
}

export interface TourPart {
  id: string;
  title: string;
  content: string;
  unlock_progress: number;
  audio_url?: string | null;
}

export interface ScavengerHunt {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  items: ScavengerHuntItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ScavengerHuntItem {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  hint?: string | null;
  qr_code?: string | null;
}

export interface CafeTour {
  id: string;
  title: string;
  description: string;
  parts: CafeTourPart[];
  created_at?: string;
  updated_at?: string;
}

export interface CafeTourPart {
  id: string;
  title: string;
  content: string;
  unlock_progress: number;
  recipe_url?: string | null;
}

export interface ProgressData {
  progress: number;
  nearest_location?: string | null;
  suggested_next?: string | null;
}

export interface BeaconAPIFormat {
  ids: string[];
  rssi: number[];
}
```

## 🧪 Testing the Integration

### 1. Check API Health
```bash
curl http://localhost:8000/health
```

### 2. Test Tours Endpoint
```bash
curl http://localhost:8000/api/v1/tours
```

### 3. Test Progress Calculation
```bash
curl -X POST http://localhost:8000/api/v1/progress/calculate \
  -H "Content-Type: application/json" \
  -d '{"ids":["beacon1","beacon2"],"rssi":[-65,-70]}'
```

## 🐛 Debugging

### Network Issues
```typescript
// Add timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch(url, { signal: controller.signal })
  .finally(() => clearTimeout(timeoutId));
```

### Logging
```typescript
// Enable request logging
fetch(url).then(res => {
  console.log('Response status:', res.status);
  console.log('Response headers:', res.headers);
  return res.json();
});
```

### CORS Issues
If you get CORS errors:
1. Ensure API is running
2. Check `CORS_ORIGINS` in API `.env`
3. Add your mobile app domain to allowed origins

## 📈 Performance Tips

1. **Cache static data** (tours, plants):
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   const CACHE_KEY = 'tours_cache';
   const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
   ```

2. **Batch beacon updates**:
   ```typescript
   // Don't send every beacon update
   // Throttle to once per 5 seconds
   ```

3. **Handle offline mode**:
   ```typescript
   import NetInfo from '@react-native-community/netinfo';
   
   const isConnected = await NetInfo.fetch().then(state => state.isConnected);
   ```

## 🆘 Common Issues

**Empty responses:**
- API might not have data yet
- Run `uv run python scripts/init_db.py` to load sample data

**401 Unauthorized:**
- Only affects admin endpoints
- Mobile app doesn't need authentication for viewing data

**Network timeout:**
- Check API is running: `curl http://localhost:8000/health`
- Verify correct URL in environment variables

## 📞 Support

- **API Docs**: http://your-api-url.com/docs
- **Health Check**: http://your-api-url.com/health
- **Admin Dashboard**: http://your-api-url.com/admin

---

Happy coding! 🌿📱
