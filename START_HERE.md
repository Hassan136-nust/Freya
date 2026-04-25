# 🚀 START HERE - FREYA Deployment

## Choose Your Path

### 🏠 Want to Test Locally First?
👉 Follow **Local Setup** below

### ☁️ Ready to Deploy to Production?
👉 Read **`DEPLOYMENT_GUIDE.md`** (complete guide)
👉 Or use **`DEPLOYMENT_CHECKLIST.md`** (quick checklist)

---

## 🏠 Local Setup (Before Deployment)

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Setup Environment Variables

**Backend** - Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/freya
JWT_SECRET=your_secret_key_for_testing
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Recommended)**
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in `backend/.env`

### Step 4: Start Backend

```bash
cd backend
node server.js
```

You should see:
```
Server started on port 3000
MongoDB connected
```

### Step 5: Start Frontend

Open a new terminal:
```bash
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173
```

### Step 6: Test Locally

1. Open `http://localhost:5173` in browser
2. Register a new account
3. Create a project
4. Test features:
   - Create files
   - Edit code
   - Use AI: `@freya create a counter app`
   - Click "Run" to execute code

### Step 7: Test Real-time (2 Devices)

1. Open `http://localhost:5173` on your computer
2. Open `http://YOUR_LOCAL_IP:5173` on your phone
   - Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Example: `http://192.168.1.100:5173`
3. Login on both devices
4. Open same project
5. Edit file on one device
6. Should see changes on other device in real-time

---

## ☁️ Deploy to Production

Once local testing works, deploy to production:

### Quick Steps:

1. **Setup MongoDB Atlas** (5 min)
   - Create free cluster
   - Get connection string

2. **Deploy Backend to Render** (10 min)
   - Connect GitHub
   - Add environment variables
   - Deploy

3. **Deploy Frontend to Vercel** (5 min)
   - Connect GitHub
   - Add environment variable
   - Deploy

4. **Update Backend** (2 min)
   - Add frontend URL to backend
   - Redeploy

5. **Test Everything** (10 min)
   - Test on multiple devices
   - Verify real-time works

### Detailed Instructions:

📖 **Complete Guide**: Read `DEPLOYMENT_GUIDE.md`

✅ **Quick Checklist**: Use `DEPLOYMENT_CHECKLIST.md`

📊 **Overview**: Read `DEPLOYMENT_SUMMARY.md`

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `START_HERE.md` | This file - where to begin |
| `DEPLOYMENT_GUIDE.md` | Complete deployment instructions |
| `DEPLOYMENT_CHECKLIST.md` | Quick deployment checklist |
| `DEPLOYMENT_SUMMARY.md` | Overview and architecture |
| `README.md` | Project documentation |
| `backend/.env.example` | Backend environment variables template |
| `frontend/.env.example` | Frontend environment variables template |

---

## 🎯 What You Need

### For Local Testing:
- ✅ Node.js installed
- ✅ MongoDB (local or Atlas)
- ✅ Groq API key
- ✅ Code editor

### For Production Deployment:
- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ Render account (free)
- ✅ MongoDB Atlas account (free)
- ✅ Groq API key (free tier)
- ✅ Code pushed to GitHub

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Local setup | 10-15 minutes |
| Local testing | 10-15 minutes |
| MongoDB Atlas setup | 5 minutes |
| Backend deployment | 10 minutes |
| Frontend deployment | 5 minutes |
| Production testing | 10 minutes |
| **Total** | **50-60 minutes** |

---

## 🆘 Quick Help

### Local Issues

**Backend won't start:**
- Check MongoDB is running
- Check `.env` file exists in `backend/`
- Check port 3000 is not in use

**Frontend won't start:**
- Check `.env` file exists in `frontend/`
- Check backend is running
- Check port 5173 is not in use

**Socket not connecting:**
- Check backend is running
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for errors

### Deployment Issues

**Read the troubleshooting section in:**
- `DEPLOYMENT_GUIDE.md` (detailed solutions)
- `DEPLOYMENT_SUMMARY.md` (quick fixes)

---

## 🎉 Next Steps

### After Local Testing Works:
1. ✅ Commit and push code to GitHub
2. ✅ Follow `DEPLOYMENT_GUIDE.md`
3. ✅ Deploy to production
4. ✅ Share with friends!

### After Production Deployment:
1. ✅ Test on multiple devices
2. ✅ Share your Vercel URL
3. ✅ Add collaborators
4. ✅ Build amazing projects!

---

## 💡 Pro Tips

1. **Test locally first** - Easier to debug issues
2. **Use MongoDB Atlas** - Even for local testing (free tier)
3. **Check logs** - Browser console and Render logs are your friends
4. **Follow the order** - Deploy backend before frontend
5. **Save URLs** - Keep track of your deployment URLs

---

## 📞 Need Help?

1. Check the relevant guide:
   - Local issues → This file
   - Deployment issues → `DEPLOYMENT_GUIDE.md`
   - Quick reference → `DEPLOYMENT_CHECKLIST.md`

2. Check logs:
   - Backend → Terminal or Render logs
   - Frontend → Browser console (F12)

3. Common issues:
   - Environment variables not set
   - MongoDB not connected
   - Wrong URLs in config

---

## 🚀 Ready to Start?

### For Local Testing:
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Create .env files (see Step 2 above)

# 3. Start backend
cd backend
node server.js

# 4. Start frontend (new terminal)
cd frontend
npm run dev

# 5. Open http://localhost:5173
```

### For Production Deployment:
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Follow DEPLOYMENT_GUIDE.md
```

---

**Good luck! 🎉**

Remember: Start with local testing, then deploy to production!
