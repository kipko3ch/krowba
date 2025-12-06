# Krowba - Netlify Deployment Guide

## ✅ Build Complete!

Your production build is ready in the `dist` folder.

---

## 🚀 Deploy to Netlify

### Option 1: Drag & Drop (Fastest)

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the entire `dist` folder onto the page
3. Your site will be live in seconds!

### Option 2: Netlify CLI

```powershell
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

When prompted:
- **Publish directory**: `dist`

### Option 3: Git Integration (Recommended for continuous deployment)

1. **Initialize Git** (if not already):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Follow GitHub's instructions to push your code

3. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings (auto-detected from `netlify.toml`):
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click "Deploy site"

---

## 📋 What's Included

✅ **Production build** in `dist` folder  
✅ **Netlify configuration** (`netlify.toml`)  
✅ **SPA routing** configured  
✅ **Security headers** enabled  
✅ **Asset caching** optimized  

---

## 🔧 Build Commands

```powershell
# Development
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Custom Domain

After deployment:
1. Go to your Netlify site dashboard
2. Click "Domain settings"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## 📊 Build Output

- **HTML**: `dist/index.html`
- **Assets**: `dist/assets/` (JS, CSS, images)
- **Favicon**: `dist/favicon.png`

---

## ⚡ Performance Tips

- All assets are automatically optimized
- Cache headers configured for 1 year
- Gzip/Brotli compression enabled by Netlify
- CDN distribution worldwide

---

**Your Krowba site is ready to go live!** 🎉
