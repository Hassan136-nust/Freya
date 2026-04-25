# ✅ FREYA Deployment Checklist

## Quick Reference - Follow in Order

### 📋 Before You Start
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] Render account created
- [ ] Vercel account created
- [ ] Groq API key obtained

---

## 🗄️ MongoDB Setup (5 minutes)

- [ ] Create free cluster on MongoDB Atlas
- [ ] Create database user with password
- [ ] Allow network access (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Replace `<password>` in connection string
- [ ] Add `/freya` database name at end
- [ ] **SAVE CONNECTION STRING**

---

## 🔧 Backend Deployment on Render (10 minutes)

- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure:
  - [ ] Name: `freya-backend`
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `node server.js`
  - [ ] Instance: Free

- [ ] Add Environment Variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `10000`
  - [ ] `MONGODB_URI` = (your MongoDB connection string)
  - [ ] `JWT_SECRET` = (random long string)
  - [ ] `GROQ_API_KEY` = (your Groq key)
  - [ ] `FRONTEND_URL` = `https://placeholder.com` (update later)

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 min)
- [ ] **COPY BACKEND URL** (e.g., `https://freya-backend.onrender.com`)

---

## 🎨 Frontend Deployment on Vercel (5 minutes)

- [ ] Go to Vercel Dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Import GitHub repository
- [ ] Configure:
  - [ ] Framework: `Vite`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`

- [ ] Add Environment Variable:
  - [ ] `VITE_API_URL` = (your Render backend URL)

- [ ] Click "Deploy"
- [ ] Wait for deployment (2-5 min)
- [ ] **COPY FRONTEND URL** (e.g., `https://freya-xyz.vercel.app`)

---

## 🔄 Update Backend with Frontend URL (2 minutes)

- [ ] Go back to Render Dashboard
- [ ] Click on `freya-backend` service
- [ ] Click "Environment" tab
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Click "Save Changes"
- [ ] Wait for auto-redeploy (2-3 min)

---

## ✅ Testing (10 minutes)

### Basic Functionality
- [ ] Open Vercel URL in browser
- [ ] Register new account
- [ ] Login successfully
- [ ] Create a new project
- [ ] Open the project

### Real-time Collaboration
- [ ] Open project on Device 1
- [ ] Open same project on Device 2 (phone/another computer)
- [ ] Create file on Device 1
- [ ] Verify file appears on Device 2
- [ ] Edit file on Device 1
- [ ] Verify changes appear on Device 2 in real-time

### AI Code Generation
- [ ] Type `@freya create a simple counter app` in chat
- [ ] Verify AI responds
- [ ] Verify files are created automatically
- [ ] Click "Run" button
- [ ] Verify code executes in WebContainer

### Socket Connection
- [ ] Open browser console (F12)
- [ ] Look for "✅ Socket connected" message
- [ ] No "🔴 Socket connection error" messages

---

## 🐛 If Something Doesn't Work

### Socket Connection Issues
- [ ] Check `FRONTEND_URL` in Render matches Vercel URL exactly
- [ ] No trailing slash in URLs
- [ ] Redeploy backend after changing env vars

### CORS Errors
- [ ] Check `VITE_API_URL` in Vercel matches Render URL
- [ ] Check `FRONTEND_URL` in Render is correct
- [ ] Clear browser cache

### MongoDB Connection Error
- [ ] Verify connection string is correct
- [ ] Password is correct (no `<password>` placeholder)
- [ ] Network access allows 0.0.0.0/0
- [ ] Database user exists

### AI Not Working
- [ ] Check `GROQ_API_KEY` is set in Render
- [ ] Check Render logs for errors
- [ ] Verify Groq API has credits

---

## 🎉 Success Criteria

You're done when:
- ✅ Can register and login from any device
- ✅ Can create and open projects
- ✅ Real-time updates work across devices
- ✅ AI generates code when mentioned with @freya
- ✅ WebContainer runs code successfully
- ✅ No errors in browser console
- ✅ No errors in Render logs

---

## 📝 Important URLs to Save

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `https://your-app.vercel.app` | Share this with users |
| **Backend** | `https://freya-backend.onrender.com` | For API calls |
| **MongoDB** | `mongodb+srv://...` | Connection string |
| **Render Dashboard** | `https://dashboard.render.com` | Check logs |
| **Vercel Dashboard** | `https://vercel.com/dashboard` | Manage deployments |

---

## 🔄 Quick Update Process

### Update Frontend
```bash
git add .
git commit -m "Update"
git push origin main
# Vercel auto-deploys in 1-2 minutes
```

### Update Backend
```bash
git add .
git commit -m "Update"
git push origin main
# Render auto-deploys in 3-5 minutes
```

---

## 💡 Pro Tips

1. **Free Tier Sleep**: Render free tier sleeps after 15 min inactivity. First request takes 30-60 sec to wake up.

2. **Environment Variables**: Never commit `.env` files. Always use platform dashboards.

3. **Logs**: Check Render logs if backend issues, browser console if frontend issues.

4. **HTTPS Required**: WebContainer needs HTTPS (Vercel provides automatically).

5. **Browser Support**: Use Chrome/Edge for best WebContainer support.

---

## 📞 Need Help?

- Read full guide: `DEPLOYMENT_GUIDE.md`
- Check troubleshooting section
- Check Render logs
- Check browser console
- Open GitHub issue

---

**Estimated Total Time**: 30-40 minutes

**Cost**: $0 (using free tiers)

Good luck! 🚀
