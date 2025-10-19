# CSS Troubleshooting Guide 🎨

## Problem: "CSS not working" or "Only plain text showing"

This is a common Next.js development server issue where the webpack cache gets corrupted.

---

## ✅ Quick Fix (Recommended)

### Method 1: Use the Helper Script

```bash
./restart-dev.sh
```

This script will:
1. Stop the existing dev server
2. Clear the `.next` cache
3. Restart with a fresh build

### Method 2: Manual Commands

```bash
# Stop the server
pkill -f "next dev"

# Clear the cache
rm -rf .next

# Restart
source ~/.zshrc && npm run dev
```

---

## 🔄 After Server Restart

### ALWAYS Do a Hard Refresh in Your Browser:

**Mac:**
- Chrome/Edge: `Cmd + Shift + R`
- Firefox: `Cmd + Shift + R`
- Safari: `Cmd + Option + R`

**Windows:**
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

**Alternative:**
- Open in **Incognito/Private Mode** (bypasses all cache)

---

## 🔍 How to Verify CSS is Loading

### Check 1: HTTP Status

```bash
curl -s -I "http://localhost:3000/_next/static/css/app/layout.css" | head -3
```

Should show: `HTTP/1.1 200 OK`

### Check 2: CSS Content

```bash
curl -s "http://localhost:3000/_next/static/css/app/layout.css" | grep -o "bg-background" | head -3
```

Should show: Multiple `bg-background` matches

### Check 3: Terminal Logs

Server should show:
```
✓ Compiled /feed in 369ms (1712 modules)
GET /feed 200 in 502ms
```

NOT showing 404 errors like:
```
GET /_next/static/css/app/layout.css?v=... 404
```

---

## ⚠️ Common Issues

### Issue 1: Webpack Cache Corruption

**Symptoms:**
- CSS returns 404
- JavaScript chunks return 404
- Page shows plain text
- Warning about vendor-chunks

**Solution:**
```bash
rm -rf .next
npm run dev
```

### Issue 2: Browser Cache

**Symptoms:**
- Server logs show 200 OK
- CSS file loads correctly
- But browser still shows plain text

**Solution:**
- Hard refresh (`Cmd+Shift+R`)
- Clear browser cache
- Open incognito mode

### Issue 3: Multiple Servers Running

**Symptoms:**
- Port 3000 in use
- Server starts on port 3001
- Inconsistent behavior

**Solution:**
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Wait a moment
sleep 2

# Restart
npm run dev
```

---

## 🚀 Prevention Tips

### 1. Stop Server Properly

Don't just close the terminal. Use `Ctrl+C` to stop the server gracefully.

### 2. Clear Cache When Adding Features

When adding many new components/pages:
```bash
rm -rf .next && npm run dev
```

### 3. Use Production Build

For testing without cache issues:
```bash
npm run build
npm start
```

---

## 📊 Expected Behavior

### Successful Server Start

```
> barakah.social@0.1.0 dev
> next dev

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1584ms
 ○ Compiling /src/middleware ...
 ✓ Compiled /src/middleware in 886ms (146 modules)
```

### Successful Page Load

```
 ○ Compiling /feed ...
 ✓ Compiled /feed in 3.3s (1676 modules)
Supabase environment variables not set. Using placeholder client.
GET /feed 200 in 3613ms
```

### CSS Loading Correctly

```
# In browser DevTools Network tab:
layout.css    200    OK    ~70KB
```

---

## 🛠️ Helper Scripts

### Restart Development Server

```bash
./restart-dev.sh
```

### Clean Everything

```bash
# Nuclear option - clears everything
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Check Server Health

```bash
# Check if CSS is loading
curl -s -I "http://localhost:3000/_next/static/css/app/layout.css"

# Check if server is running
curl -s -I http://localhost:3000
```

---

## 📝 When to Restart

### Always Restart When:
- Adding new major features
- CSS stops loading (404 errors)
- Webpack cache errors appear
- Server behaves inconsistently

### Sometimes Restart When:
- Making many file changes quickly
- Editing configuration files
- Adding new dependencies

### Don't Need to Restart When:
- Editing existing components
- Changing text/content
- Updating styles
- Most code changes (hot reload works)

---

## 🎯 Quick Reference Card

```
Problem: CSS not working
Solution: ./restart-dev.sh + Hard Refresh (Cmd+Shift+R)

Problem: Port in use
Solution: pkill -f "next dev" && npm run dev

Problem: Everything broken
Solution: rm -rf .next node_modules && npm install && npm run dev
```

---

## ✅ Verification Checklist

After restarting, verify:
- [ ] Server shows "Ready" message
- [ ] No 404 errors for CSS files
- [ ] No webpack cache warnings
- [ ] Pages compile successfully
- [ ] Browser shows styled content (after hard refresh)

---

*This is a known Next.js development server quirk. Your code is fine!* ✨

**Remember: Server Restart + Hard Browser Refresh = Problem Solved** 🎨
