# 📋 Deployment Checklist for Milwaukee Domes Alliance

This checklist helps you deploy and operate the Milwaukee Domes Management API.

## Phase 1: Initial Setup (15 minutes)

### Step 1: Create Appwrite Account
- [ ] Go to [cloud.appwrite.io](https://cloud.appwrite.io)
- [ ] Sign up (free account)
- [ ] Verify your email
- [ ] Create a new project named "Milwaukee Domes"
- [ ] Save your Project ID (you'll need this)

### Step 2: Create Database
- [ ] In Appwrite console, go to "Databases"
- [ ] Create database named "milwaukee-domes"
- [ ] Create collections (see below for each)
- [ ] Generate API key (Settings → API Keys → Create API Key)
  - [ ] Select "All scopes" or at minimum: `databases.read`, `databases.write`
  - [ ] Save the API key securely

### Step 3: Create Collections

#### Collection: `tours`
- [ ] Click "+ Create Collection"
- [ ] Name: `tours`
- [ ] Document Security: Off (handled by API)
- [ ] Add attributes:
  - [ ] `title` - String (required, max 200)
  - [ ] `description` - String (required)
  - [ ] `parts` - String (required) - Store JSON array
  - [ ] `created_at` - DateTime
  - [ ] `updated_at` - DateTime

#### Collection: `scavenger-hunts`
- [ ] Name: `scavenger-hunts`
- [ ] Add attributes:
  - [ ] `title` - String (required, max 200)
  - [ ] `description` - String (required)
  - [ ] `items` - String (required) - Store JSON array
  - [ ] `difficulty` - String (required)
  - [ ] `created_at` - DateTime
  - [ ] `updated_at` - DateTime

#### Collection: `cafe-tours`
- [ ] Name: `cafe-tours`
- [ ] Add attributes:
  - [ ] `title` - String (required, max 200)
  - [ ] `description` - String (required)
  - [ ] `parts` - String (required) - Store JSON array
  - [ ] `created_at` - DateTime
  - [ ] `updated_at` - DateTime

#### Collection: `plants`
- [ ] Name: `plants`
- [ ] Add attributes:
  - [ ] `common_name` - String (required)
  - [ ] `scientific_name` - String (required)
  - [ ] `quantity` - Integer (required)
  - [ ] `buy_new_wont_survive` - Boolean
  - [ ] `buy_new_readily_available` - Boolean
  - [ ] `move_by_staff` - Boolean
  - [ ] `move_requires_consult` - Boolean
  - [ ] `notes` - String
  - [ ] `dome_location` - String
  - [ ] `image_url` - String
  - [ ] `created_at` - DateTime
  - [ ] `updated_at` - DateTime

#### Collection: `tickets`
- [ ] Name: `tickets`
- [ ] Add attributes:
  - [ ] `barcode` - String (required, unique)
  - [ ] `ticket_type` - String
  - [ ] `visitor_name` - String
  - [ ] `expiry_date` - DateTime
  - [ ] `created_at` - DateTime

### Step 4: Choose Deployment Platform

Select ONE:
- [ ] **Railway** (Easiest, recommended)
- [ ] **Render** (Best free tier)
- [ ] **Fly.io** (Most control)
- [ ] **Docker on your server** (Full control)

## Phase 2: Deploy to Railway (Recommended - 10 minutes)

### Step 1: Connect GitHub
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up/login with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your fork of the repository
- [ ] Select the `management` folder

### Step 2: Configure Environment
- [ ] Click on your service
- [ ] Go to "Variables" tab
- [ ] Add these variables:

```
APPWRITE_PROJECT_ID=<from-appwrite-console>
APPWRITE_API_KEY=<from-appwrite-console>
SECRET_KEY=<generate-new-secret>
ADMIN_PASSWORD=<choose-secure-password>
ADMIN_USERNAME=admin
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=milwaukee-domes
DEBUG=false
```

To generate SECRET_KEY:
```bash
openssl rand -hex 32
```

### Step 3: Deploy
- [ ] Railway automatically builds and deploys
- [ ] Wait 2-3 minutes for build
- [ ] Click "Generate Domain" to get your URL
- [ ] Save your API URL (e.g., `https://milwaukee-domes.railway.app`)

### Step 4: Verify Deployment
- [ ] Visit `https://your-url.railway.app/health`
- [ ] Should see: `{"status":"healthy",...}`
- [ ] Visit `https://your-url.railway.app/docs`
- [ ] Should see API documentation

## Phase 3: Load Initial Data (5 minutes)

### Option A: Use the initialization script (Recommended)

On your local machine:
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd management

# 2. Install dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# 3. Configure environment to point to production
# Edit .env with your PRODUCTION Appwrite credentials

# 4. Run initialization
uv run python scripts/init_db.py
```

This will:
- Load all 1700+ plants from CSV
- Create sample tours
- Create sample scavenger hunts

### Option B: Manual data entry
- [ ] Visit `https://your-url.railway.app/admin`
- [ ] Log in with admin credentials
- [ ] Manually create tours, scavenger hunts

## Phase 4: Configure Mobile App (2 minutes)

- [ ] Open `Thunderdomes/services/api.ts`
- [ ] Update `API_BASE_URL`:
```typescript
const API_BASE_URL = 'https://your-url.railway.app/api/v1';
```
- [ ] Test in mobile app
- [ ] Verify tours load
- [ ] Test scavenger hunts

## Phase 5: Security & Production Readiness

### Required
- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Keep `SECRET_KEY` secret (never commit to git)
- [ ] Set `DEBUG=false` in production
- [ ] Enable HTTPS (automatic on Railway/Render/Fly.io)

### Recommended
- [ ] Set up custom domain (optional)
- [ ] Configure CORS to only allow your mobile app domain
- [ ] Set up monitoring alerts (Railway has built-in)
- [ ] Regular backups of Appwrite data (export collections)

## Phase 6: Maintenance & Operations

### Daily
- [ ] Monitor Railway dashboard for errors
- [ ] Check API health: `curl https://your-url/health`

### Weekly
- [ ] Review API usage in Appwrite console
- [ ] Check for any failed requests in logs
- [ ] Verify admin dashboard is accessible

### Monthly
- [ ] Review Appwrite billing (should be $0 on free tier)
- [ ] Review Railway usage (should be $0 on free tier)
- [ ] Backup collections from Appwrite console

## Troubleshooting

### API not starting
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Test Appwrite connection with curl:
```bash
curl -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
     https://cloud.appwrite.io/v1/health
```

### Mobile app can't connect
1. Verify API URL is correct in mobile app
2. Check CORS settings in API `.env`
3. Test API directly: `curl https://your-url/api/v1/tours`

### Admin login not working
1. Verify `ADMIN_PASSWORD` is set correctly
2. Check that `SECRET_KEY` is set
3. Try resetting password in Railway variables

### Database errors
1. Check Appwrite console for collection structure
2. Verify collection IDs match `.env` settings
3. Check API key has correct permissions

## Cost Monitoring

### Free Tier Limits
- **Appwrite**: 75,000 requests/month
- **Railway**: 500 execution hours/month ($5 credit)

### Expected Usage
- Small (100 visitors/day): ~3,000 requests/day = 90k/month
- Medium (500 visitors/day): ~15,000 requests/day = 450k/month

### When to Upgrade
- [ ] Exceeding Appwrite free tier: Upgrade to Pro ($15/mo)
- [ ] Exceeding Railway hours: Add credit ($5-10/mo)

## Support Resources

### Documentation
- [ ] API Documentation: `/docs` on your deployed URL
- [ ] Main README: `management/README.md`
- [ ] Deployment Guide: `management/DEPLOYMENT.md`
- [ ] Architecture: `management/ARCHITECTURE.md`

### External Help
- [ ] FastAPI Documentation: https://fastapi.tiangolo.com
- [ ] Appwrite Documentation: https://appwrite.io/docs
- [ ] Railway Documentation: https://docs.railway.app

### Quick Links
| Resource | URL |
|----------|-----|
| Health Check | `https://your-url/health` |
| API Docs | `https://your-url/docs` |
| Admin Dashboard | `https://your-url/admin` |
| Appwrite Console | https://cloud.appwrite.io/console |
| Railway Dashboard | https://railway.app/dashboard |

## Success Criteria

✅ API is deployed and accessible
✅ Health check returns "healthy"
✅ Admin dashboard loads
✅ Mobile app can fetch tours
✅ Progress tracking works with beacon data
✅ All tests pass
✅ Documentation is accessible

## Next Steps After Deployment

1. **Train Staff**
   - Show them admin dashboard
   - Create sample tours together
   - Practice adding plants

2. **Test with Users**
   - Deploy mobile app to test users
   - Gather feedback
   - Iterate on content

3. **Monitor Performance**
   - Watch Railway logs
   - Check API response times
   - Monitor Appwrite usage

4. **Expand Content**
   - Add more tours
   - Create seasonal scavenger hunts
   - Upload plant images

## Emergency Contacts

Save these for quick access:

- **API Status**: `curl https://your-url/health`
- **Railway Dashboard**: https://railway.app/dashboard
- **Appwrite Console**: https://cloud.appwrite.io/console
- **Repository**: <your-github-repo-url>

---

## Summary

You now have:
- ✅ Production-ready API
- ✅ Cloud database (Appwrite)
- ✅ Admin dashboard
- ✅ Mobile app integration
- ✅ Free deployment
- ✅ Automatic scaling
- ✅ Complete documentation

**Total setup time**: ~30 minutes
**Monthly cost**: $0 (free tier)
**Maintenance time**: <1 hour/month

**You're ready to launch!** 🚀

---

Questions? Check the documentation or test the health endpoint first.
