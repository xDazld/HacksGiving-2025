# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Milwaukee Domes System                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Mobile App      │         │  Admin Dashboard │         │  BLE Beacons     │
│  (React Native)  │◄────────┤  (FastUI/Web)    │         │  (Hardware)      │
│                  │   API   │                  │         │                  │
│  - Tours         │         │  - Manage Tours  │         │  - Location      │
│  - Scavenger     │         │  - Manage Plants │         │  - Progress      │
│  - Progress      │         │  - Analytics     │         │  - Tracking      │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         │                            │                            │
         │         HTTP/REST          │                            │
         └────────────┬───────────────┘                            │
                      │                                            │
                      ▼                                            │
         ┌────────────────────────────┐                            │
         │   FastAPI Backend          │                            │
         │   (Python 3.11+)           │◄───────────────────────────┘
         │                            │        Beacon Data
         │   - RESTful API            │
         │   - JWT Auth               │
         │   - Progress Calc          │
         │   - Validation             │
         └─────────────┬──────────────┘
                       │
                       │ Appwrite SDK
                       │
                       ▼
         ┌────────────────────────────┐
         │   Appwrite Cloud           │
         │   (BaaS)                   │
         │                            │
         │   - Database               │
         │   - Storage                │
         │   - Auth                   │
         └────────────────────────────┘
```

## Data Flow

### 1. Mobile App Viewing Tours
```
Mobile App → GET /api/v1/tours → FastAPI → Appwrite → Database
                                                ↓
Mobile App ← JSON Response ← FastAPI ← Appwrite ← Tours Collection
```

### 2. Progress Tracking
```
BLE Beacons → Mobile App → POST /api/v1/progress/calculate
                              ↓
                        FastAPI Algorithm
                              ↓
                        Calculate Progress
                              ↓
                        Return Progress %
```

### 3. Admin Managing Content
```
Admin Dashboard → POST /api/v1/tours → FastAPI → Verify JWT
                                          ↓
                                    Appwrite SDK
                                          ↓
                                    Create Document
                                          ↓
                                    Return New Tour
```

## Component Responsibilities

### FastAPI Backend
- **API Gateway**: All requests go through FastAPI
- **Business Logic**: Progress calculation, validation
- **Authentication**: JWT token generation/verification
- **Data Transformation**: Pydantic models ensure type safety
- **Error Handling**: Consistent error responses

### Appwrite
- **Database**: NoSQL document store
- **Storage**: Files (images, audio)
- **Authentication**: User management (future)
- **Real-time**: WebSocket support (future)
- **Scaling**: Automatic scaling

### FastUI Admin
- **No Frontend Code**: Python-only admin interface
- **CRUD Operations**: Create, read, update, delete
- **Analytics**: Dashboard views
- **User-Friendly**: Non-technical staff can use

### Mobile App
- **Consumer**: Reads data from API
- **BLE Integration**: Collects beacon data
- **Offline Support**: Can cache data
- **User Interface**: React Native UI

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Security Layers                        │
└─────────────────────────────────────────────────────────────┘

1. HTTPS (TLS) - Transport Security
   ├─ Encrypted in transit
   └─ Certificate validation

2. CORS - Cross-Origin Resource Sharing
   ├─ Allowed origins configured
   └─ Prevents unauthorized access

3. JWT Authentication - Identity Verification
   ├─ Signed tokens
   ├─ Expiration (30 min)
   └─ Admin operations protected

4. Input Validation - Pydantic Models
   ├─ Type checking
   ├─ Range validation
   └─ Required fields enforced

5. Appwrite Security - Database Layer
   ├─ Collection permissions
   ├─ Document-level rules
   └─ API key management
```

## Deployment Architecture

### Option 1: Railway (Recommended)
```
GitHub Repo → Railway → Build Container → Deploy
                                 ↓
                         Auto-scale pods
                                 ↓
                         Public HTTPS URL
```

### Option 2: Docker
```
Dockerfile → Build Image → Push to Registry → Deploy to Platform
                                                      ↓
                                              Any Docker host:
                                              - AWS ECS
                                              - Google Cloud Run
                                              - Azure Container Instances
                                              - DigitalOcean
                                              - Your own server
```

## Scalability Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Horizontal Scaling                        │
└─────────────────────────────────────────────────────────────┘

                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Instance 1       Instance 2       Instance 3
    (FastAPI)        (FastAPI)        (FastAPI)
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  Appwrite Cloud
                  (Auto-scaling)
```

### Current Capacity
- **FastAPI**: 1000+ req/sec per instance
- **Appwrite Free**: 75,000 requests/month
- **Appwrite Pro**: Unlimited

### Scaling Strategy
1. Start with 1 instance (sufficient for launch)
2. Add instances as traffic grows
3. Appwrite scales automatically
4. Add caching layer (Redis) if needed

## Technology Stack Details

```
┌─────────────────────────────────────────────────────────────┐
│                     Technology Stack                         │
└─────────────────────────────────────────────────────────────┘

Backend:
  ├─ FastAPI 0.121+ (async, fast, modern)
  ├─ Python 3.11+ (type hints, performance)
  ├─ Pydantic 2.10+ (data validation)
  └─ Uvicorn (ASGI server)

Database:
  ├─ Appwrite Cloud (managed NoSQL)
  └─ Appwrite SDK 6.0+ (Python client)

Admin UI:
  ├─ FastUI 0.6+ (Python-based UI)
  └─ Served by FastAPI

Authentication:
  ├─ python-jose (JWT)
  └─ passlib (password hashing)

Testing:
  ├─ pytest (unit tests)
  ├─ pytest-asyncio (async tests)
  └─ playwright (E2E tests)

Deployment:
  ├─ Docker (containerization)
  ├─ uv (package management)
  └─ Railway/Render/Fly.io (hosting)
```

## Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   Development Workflow                       │
└─────────────────────────────────────────────────────────────┘

1. Local Development
   ├─ uv sync (install deps)
   ├─ uvicorn --reload (hot reload)
   └─ http://localhost:8000

2. Testing
   ├─ pytest tests/ (unit tests)
   ├─ playwright (E2E tests)
   └─ Test coverage reports

3. Version Control
   ├─ Git commit
   └─ Push to GitHub

4. CI/CD (Auto-deploy)
   ├─ Railway/Render detects push
   ├─ Build container
   ├─ Run tests
   └─ Deploy to production

5. Monitoring
   ├─ Health check: /health
   ├─ Logs in dashboard
   └─ Appwrite analytics
```

## API Design Principles

### RESTful Routes
- `GET /api/v1/tours` - List all
- `GET /api/v1/tours/{id}` - Get one
- `POST /api/v1/tours` - Create (auth required)
- `PUT /api/v1/tours/{id}` - Update (auth required)
- `DELETE /api/v1/tours/{id}` - Delete (auth required)

### Response Format
```json
{
  "id": "unique-id",
  "data": { ... },
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Error Format
```json
{
  "detail": "Error message",
  "status_code": 404
}
```

## Performance Characteristics

### Response Times (Expected)
- Health check: <10ms
- GET endpoints: <50ms (cached), <200ms (database)
- POST endpoints: <500ms (includes database write)
- Progress calculation: <100ms (algorithm only)

### Throughput
- FastAPI instance: 1000+ req/sec
- Appwrite: Scales automatically
- Bottleneck: Network latency to Appwrite

### Optimization Strategies
1. **Caching**: Add Redis for frequently accessed data
2. **CDN**: Use for static assets (images, audio)
3. **Indexing**: Proper Appwrite collection indexes
4. **Pagination**: Implemented for all list endpoints
5. **Async**: All I/O operations are async

---

This architecture is designed to be:
- ✅ Simple to understand
- ✅ Easy to deploy
- ✅ Cost-effective
- ✅ Scalable
- ✅ Maintainable
