# Deployment Guide - Milwaukee Domes API

This guide covers multiple deployment options for the Milwaukee Domes Management API, from easiest to most customizable.

## ✨ NEW: Automatic Database Setup

**No manual database setup required!** The application now automatically:
- Creates the Appwrite database if it doesn't exist
- Creates all required collections (tours, plants, scavenger-hunts, etc.)
- Sets up the proper schema for each collection
- Handles idempotent startup (safe to restart multiple times)

### What You Need

Just **3 environment variables** to get started:

```env
APPWRITE_PROJECT_ID=your-project-id        # From Appwrite console
APPWRITE_API_KEY=your-api-key              # With database permissions
APPWRITE_DATABASE_ID=milwaukee-domes       # Will be created automatically
```

On first startup, you'll see:
```
🚀 Initializing Appwrite Database
✓ Database created
✓ Collection created: tours
✓ Collection created: plants
✓ Collection created: scavenger-hunts
✅ Database initialization complete!
```

### API Key Permissions Required

Your Appwrite API key needs these permissions:
- `databases.read` / `databases.write`
- `collections.read` / `collections.write`
- `attributes.read` / `attributes.write`
- `documents.read` / `documents.write`

**That's it!** The database setup is now **completely automatic**. No manual collection creation, no schema setup, no manual steps. Just provide credentials and start the app.

---

## 🚀 Recommended: Railway (Easiest - 5 minutes)

Perfect for non-technical users. Free tier available.

### Steps:

1. **Create a Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway auto-detects the Python app

3. **Add Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Add these variables (get from your Appwrite console):
     ```
     APPWRITE_PROJECT_ID=your-project-id
     APPWRITE_API_KEY=your-api-key
     SECRET_KEY=generate-with-openssl-rand-hex-32
     ADMIN_PASSWORD=your-secure-password
     ```

4. **Deploy!**
   - Railway automatically builds and deploys
   - Get your public URL from the "Settings" tab
   - Your API is live at `https://your-app.railway.app`

**Cost**: Free tier includes 500 hours/month ($5 credit)

---

## 🌐 Option 2: Render (Great Free Tier)

Free tier includes:
- Automatic HTTPS
- Auto-deploy from GitHub
- No credit card required

### Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect this repository
   - Name: `milwaukee-domes-api`

3. **Configure Build Settings**
   - **Build Command**: `pip install uv && uv sync`
   - **Start Command**: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. **Add Environment Variables**
   - In "Environment" section, add:
     ```
     APPWRITE_PROJECT_ID
     APPWRITE_API_KEY
     SECRET_KEY
     ADMIN_PASSWORD
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 2-3 minutes for build
   - Access at `https://milwaukee-domes-api.onrender.com`

**Note**: Free tier sleeps after 15 min of inactivity (50ms cold start)

---

## ☁️ Option 3: Fly.io (More Control)

Best for production. $5/month credit for free tier.

### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and Launch**
   ```bash
   cd management
   fly auth login
   fly launch
   ```

3. **Configure**
   - App name: `milwaukee-domes-api`
   - Region: Choose closest to Milwaukee (Chicago/ORD)
   - Don't deploy yet

4. **Set Environment Secrets**
   ```bash
   fly secrets set \
     APPWRITE_PROJECT_ID=your-id \
     APPWRITE_API_KEY=your-key \
     SECRET_KEY=your-secret \
     ADMIN_PASSWORD=your-password
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Access**
   ```bash
   fly open
   ```

**Features**:
- Global edge network
- Auto-scaling
- Built-in SSL
- Custom domains

---

## 🐳 Option 4: Docker (Any Platform)

Deploy anywhere that supports Docker.

### Local Testing:

```bash
cd management
docker build -t milwaukee-domes-api .
docker run -p 8000:8000 --env-file .env milwaukee-domes-api
```

### Deploy to Any Cloud:

**AWS ECS/Fargate:**
```bash
aws ecr create-repository --repository-name milwaukee-domes-api
docker tag milwaukee-domes-api:latest AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/milwaukee-domes-api
docker push AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/milwaukee-domes-api
# Then create ECS task and service
```

**Google Cloud Run:**
```bash
gcloud run deploy milwaukee-domes-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Azure Container Instances:**
```bash
az container create \
  --resource-group myResourceGroup \
  --name milwaukee-domes-api \
  --image milwaukee-domes-api \
  --dns-name-label milwaukee-domes \
  --ports 8000
```

---

## 🖥️ Option 5: VPS/Server (Full Control)

For your own server (DigitalOcean, Linode, etc.)

### With Systemd:

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3.11 python3-pip nginx
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone and Setup**
   ```bash
   cd /var/www
   git clone YOUR_REPO
   cd milwaukee-domes-api/management
   uv sync
   ```

3. **Create Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/milwaukee-domes-api.service
   ```

   ```ini
   [Unit]
   Description=Milwaukee Domes API
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/milwaukee-domes-api/management
   Environment="PATH=/home/www-data/.local/bin:/usr/local/bin:/usr/bin:/bin"
   EnvironmentFile=/var/www/milwaukee-domes-api/management/.env
   ExecStart=/home/www-data/.local/bin/uv run uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

4. **Enable and Start**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable milwaukee-domes-api
   sudo systemctl start milwaukee-domes-api
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/milwaukee-domes-api
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/milwaukee-domes-api /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

7. **Add SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 📊 Cost Comparison

| Platform | Free Tier | Paid Start | Best For |
|----------|-----------|------------|----------|
| Railway | $5/month credit | $5/mo | Easiest deployment |
| Render | 750 hrs/month | $7/mo | Simple projects |
| Fly.io | $5/month credit | $5/mo | Production apps |
| Docker + VPS | - | $4-12/mo | Full control |

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Generate new `SECRET_KEY`: `openssl rand -hex 32`
- [ ] Set `DEBUG=false` in production
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Restrict `CORS_ORIGINS` to your mobile app domains
- [ ] Review Appwrite security rules
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting (optional)

---

## 🔄 Continuous Deployment

All platforms support auto-deploy from GitHub:

1. **Railway/Render**: Automatically deploys on `git push`
2. **Fly.io**: Use GitHub Actions:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Fly
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: superfly/flyctl-actions/setup-flyctl@master
         - run: flyctl deploy --remote-only
           env:
             FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
   ```

---

## 📈 Monitoring & Logs

### Railway
- Built-in logs in dashboard
- Add observability tools via Railway marketplace

### Render
- Real-time logs in dashboard
- Integrate with Sentry, DataDog, etc.

### Fly.io
```bash
fly logs
fly status
```

### Docker
```bash
docker logs milwaukee-domes-api
```

---

## 🆘 Troubleshooting

**Build Fails:**
- Check that `pyproject.toml` is present
- Verify Python version is 3.11+

**App Crashes:**
- Check logs for missing environment variables
- Verify Appwrite credentials

**Slow Responses:**
- Appwrite free tier has rate limits
- Consider caching frequently accessed data

**Can't Connect:**
- Verify firewall settings
- Check that app is listening on `0.0.0.0`

---

## 📞 Support

Need help deploying? 

1. Check platform-specific documentation
2. Review error logs
3. Test locally first with `uv run uvicorn main:app`
4. Verify Appwrite connection with test credentials

---

**Recommended Path**: Railway → Test → Fly.io for production

Good luck with your deployment! 🚀
