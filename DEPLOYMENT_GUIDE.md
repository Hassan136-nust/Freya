# 🚀 FREYA Deployment Guide

## Complete Step-by-Step Deployment Instructions

This guide will help you deploy FREYA with:
- **Frontend** on Vercel
- **Backend** on Render
- **Socket.io** working across different devices

---

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ GitHub account
2. ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
3. ✅ Render account (sign up at [render.com](https://render.com))
4. ✅ MongoDB Atlas account (sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
5. ✅ Groq API key (get from [console.groq.com](https://console.groq.com))
6. ✅ Your code pushed to GitHub

---

## 🗄️ STEP 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Build a Database"**
3. Choose **FREE** tier (M0)
4. Select a cloud provider and region (choose closest to you)
5. Click **"Create Cluster"**

### 1.2 Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username: `freya_user`
5. Click **"Autogenerate Secure Password"** and **SAVE IT**
6. Set privileges to **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Allow Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://freya_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved earlier
6. Add database name at the end: `/freya`
   ```
   mongodb+srv://freya_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/freya?retryWrites=true&w=majority
   ```
7. **SAVE THIS CONNECTION STRING** - you'll need it later

---

## 🔧 STEP 2: Deploy Backend on Render

### 2.1 Push Code to GitHub

```bash
# If not already done
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2.2 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not connected
4. Select your **freya** repository
5. Configure the service:

   **Basic Settings:**
   - **Name**: `freya-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

   **Instance Type:**
   - Select **"Free"** (or paid if you prefer)

### 2.3 Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | - |
| `PORT` | `10000` | Render default port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string from Step 1.4 |
| `JWT_SECRET` | `your_super_secret_key_change_this_12345` | Make it long and random |
| `GROQ_API_KEY` | `gsk_...` | Your Groq API key |
| `FRONTEND_URL` | `https://your-app.vercel.app` | We'll update this after deploying frontend |

**Important**: Leave `FRONTEND_URL` as a placeholder for now. We'll update it after deploying the frontend.

### 2.4 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll see a URL like: `https://freya-backend.onrender.com`
4. **SAVE THIS URL** - you'll need it for frontend

### 2.5 Test Backend

Open your backend URL in browser:
```
https://freya-backend.onrender.com
```

You should see the Express app running (might show "Cannot GET /" which is normal).

---

## 🎨 STEP 3: Deploy Frontend on Vercel

### 3.1 Update Frontend Environment Variable

Before deploying, we need to tell the frontend where the backend is.

**Option A: Using Vercel Dashboard (Recommended)**

We'll add this in Vercel dashboard in the next step.

**Option B: Using .env file (for testing)**

Create `frontend/.env.production`:
```env
VITE_API_URL=https://freya-backend.onrender.com
```

### 3.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:

   **Framework Preset**: `Vite`
   
   **Root Directory**: `frontend`
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`

### 3.3 Add Environment Variables in Vercel

1. Before clicking "Deploy", scroll down to **"Environment Variables"**
2. Add this variable:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://freya-backend.onrender.com` |

   (Use your actual Render backend URL from Step 2.4)

3. Click **"Deploy"**

### 3.4 Wait for Deployment

- Vercel will build and deploy your app (2-5 minutes)
- Once done, you'll get a URL like: `https://freya-xyz123.vercel.app`
- **SAVE THIS URL**

### 3.5 Test Frontend

1. Open your Vercel URL: `https://freya-xyz123.vercel.app`
2. You should see the FREYA login page
3. Try to register/login

---

## 🔄 STEP 4: Update Backend with Frontend URL

Now we need to tell the backend where the frontend is (for CORS and Socket.io).

### 4.1 Update Render Environment Variable

1. Go back to [Render Dashboard](https://dashboard.render.com/)
2. Click on your **freya-backend** service
3. Click **"Environment"** in left sidebar
4. Find `FRONTEND_URL` variable
5. Update its value to your Vercel URL: `https://freya-xyz123.vercel.app`
6. Click **"Save Changes"**

### 4.2 Redeploy Backend

Render will automatically redeploy with the new environment variable. Wait 2-3 minutes.

---

## ✅ STEP 5: Test Everything

### 5.1 Test Registration & Login

1. Open your Vercel URL: `https://freya-xyz123.vercel.app`
2. Click **"Create one"** to register
3. Enter email and password
4. Click **"Create account"**
5. You should be redirected to the home page

### 5.2 Test Project Creation

1. Click **"Add New Project"**
2. Enter a project name
3. Click **"Create Project"**
4. Click on the project to open it

### 5.3 Test Real-time Collaboration (IMPORTANT!)

**On Device 1 (Your Computer):**
1. Open the project
2. Create a new file: `test.js`
3. Type some code

**On Device 2 (Your Phone/Another Computer):**
1. Login with the same account (or add as collaborator)
2. Open the same project
3. You should see the `test.js` file appear automatically
4. You should see the code being typed in real-time

### 5.4 Test AI Code Generation

1. In the project chat, type: `@freya create a simple React counter app`
2. Wait for AI response
3. Files should be created automatically
4. Click **"Run"** to execute the code

### 5.5 Test WebContainer

1. Make sure you have files in the project
2. Click **"Run"** button
3. Check the logs at the bottom
4. Preview should appear on the right side

---

## 🐛 Troubleshooting

### Problem: "Socket connection error" in console

**Solution:**
1. Check that `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Make sure there's no trailing slash: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`
3. Redeploy backend after changing environment variables

### Problem: "CORS error" when making API calls

**Solution:**
1. Check that `VITE_API_URL` in Vercel matches your Render URL exactly
2. Make sure backend `FRONTEND_URL` is set correctly
3. Clear browser cache and try again

### Problem: Real-time updates not working

**Solution:**
1. Open browser console (F12)
2. Look for "Socket connected" message
3. If you see "Socket disconnected", check:
   - Backend is running on Render
   - `FRONTEND_URL` is set correctly
   - No firewall blocking WebSocket connections

### Problem: AI not responding

**Solution:**
1. Check that `GROQ_API_KEY` is set in Render
2. Check Render logs for errors:
   - Go to Render Dashboard
   - Click on your service
   - Click "Logs" tab
3. Make sure you have Groq API credits

### Problem: MongoDB connection error

**Solution:**
1. Check that `MONGODB_URI` is correct
2. Make sure you replaced `<password>` with actual password
3. Check MongoDB Atlas Network Access allows 0.0.0.0/0
4. Check MongoDB Atlas Database User exists

### Problem: WebContainer not working

**Solution:**
1. WebContainer requires these headers (already in `vercel.json`):
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`
2. Make sure you're using HTTPS (Vercel provides this automatically)
3. Try in Chrome/Edge (best WebContainer support)

---

## 📱 Testing on Multiple Devices

### Test Scenario 1: Same User, Different Devices

1. **Device 1**: Login and create a project
2. **Device 2**: Login with same account
3. **Device 1**: Create a file and type code
4. **Device 2**: Should see file and code appear in real-time

### Test Scenario 2: Different Users, Collaboration

1. **User 1**: Create a project
2. **User 1**: Add User 2 as collaborator
3. **User 2**: Login and open the project
4. **User 1**: Edit a file
5. **User 2**: Should see changes in real-time
6. **User 2**: Edit the same file
7. **User 1**: Should see User 2's changes

### Test Scenario 3: AI Code Generation

1. **User 1**: Type `@freya create a todo app`
2. **User 2**: Should see AI response streaming in real-time
3. **Both Users**: Should see files created automatically

---

## 🔒 Security Checklist

Before going live, make sure:

- ✅ `JWT_SECRET` is long and random (not the default)
- ✅ MongoDB user has a strong password
- ✅ Groq API key is kept secret
- ✅ Environment variables are set in Render/Vercel (not in code)
- ✅ `.env` files are in `.gitignore`
- ✅ CORS is configured to allow only your frontend URL

---

## 🎉 You're Done!

Your FREYA app is now live and accessible from anywhere!

**Frontend URL**: `https://your-app.vercel.app`
**Backend URL**: `https://freya-backend.onrender.com`

### Share with Others

1. Send them your Vercel URL
2. They can register and create projects
3. Add them as collaborators to work together in real-time

---

## 📊 Monitoring

### Check Backend Logs (Render)

1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. See real-time logs of API calls, Socket connections, etc.

### Check Frontend Logs (Vercel)

1. Go to Vercel Dashboard
2. Click on your project
3. Click **"Deployments"** tab
4. Click on latest deployment
5. Click **"Functions"** to see logs

### Monitor Socket Connections

Open browser console (F12) and look for:
- ✅ `Socket connected: <socket_id>`
- ✅ `Emitting event: project-message`
- ❌ `Socket connection error` (if this appears, check troubleshooting)

---

## 🔄 Updating Your App

### Update Frontend

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Vercel automatically redeploys (1-2 minutes)

### Update Backend

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update API"
   git push origin main
   ```
3. Render automatically redeploys (3-5 minutes)

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | ✅ Unlimited (hobby) | $20/month (Pro) |
| **Render** | ✅ 750 hours/month | $7/month (Starter) |
| **MongoDB Atlas** | ✅ 512MB storage | $9/month (M10) |
| **Groq API** | ✅ Free tier available | Pay as you go |

**Total for Free Tier**: $0/month 🎉

**Note**: Free tier Render services sleep after 15 minutes of inactivity. First request after sleep takes 30-60 seconds to wake up.

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Check Render logs for backend errors
3. Check browser console for frontend errors
4. Open an issue on GitHub
5. Contact support

---

## 🎊 Congratulations!

You've successfully deployed FREYA with:
- ✅ Real-time collaboration working across devices
- ✅ AI code generation
- ✅ WebContainer code execution
- ✅ Secure authentication
- ✅ Persistent storage

Now go build something amazing! 🚀
