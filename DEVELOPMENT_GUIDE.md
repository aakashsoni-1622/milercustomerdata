# 🚀 Development Mode Setup Guide

## ⚡ **The Problem You Experienced**

You were running the **production build** instead of **development mode**, which is why file changes weren't automatically reloading.

## 📋 **Commands Explained**

### **🔧 Development Mode (With Hot Reload)**

```bash
npm run dev
```

- ✅ **Hot Reload**: Automatically restarts when files change
- ✅ **Fast Refresh**: React components reload without losing state
- ✅ **Source Maps**: Better debugging with original file names
- ✅ **Turbopack**: Faster builds with `--turbopack` flag
- ⚡ **Instant Updates**: Changes appear immediately in browser

### **🏭 Production Mode (Static Build)**

```bash
npm run build  # Builds the application
npm run start  # Starts the built application
```

- ❌ **No Hot Reload**: Files are pre-built and static
- ✅ **Optimized**: Minified and optimized for production
- ✅ **Fast Serving**: Pre-built files serve faster
- ❌ **Slow Changes**: Requires rebuild for any changes

## 🎯 **Quick Fix Steps**

### **1. Stop Any Running Processes**

```bash
# Kill any existing Next.js processes
pkill -f "next"
# OR on Windows:
taskkill /F /IM node.exe
```

### **2. Start Development Server**

```bash
npm run dev
```

### **3. Verify Hot Reload**

1. Open http://localhost:3000
2. Edit any file (e.g., `src/app/page.tsx`)
3. Save the file
4. ✅ Browser should automatically refresh/update

## 🔍 **How to Tell Which Mode You're In**

### **Development Mode Indicators:**

- Console shows: `Ready in Xms` (not "Next.js X.X.X")
- Hot reload works when you save files
- URL shows `http://localhost:3000` (development port)
- Console shows Turbopack or webpack compilation messages

### **Production Mode Indicators:**

- Console shows: `Next.js X.X.X` with static file serving
- No automatic reload on file changes
- Files are served from `.next` build directory
- No compilation messages after startup

## ⚡ **Development Scripts Available**

```bash
# Standard development with hot reload
npm run dev

# Development with debugging enabled
npm run debug

# Build for production (creates .next folder)
npm run build

# Start production server (requires build first)
npm run start

# Lint checking
npm run lint

# Database migration (PostgreSQL)
npm run migrate
```

## 🛠️ **Advanced Development Tips**

### **1. Environment Variables**

Make sure your `.env.local` file is set up for development:

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=milercustomerdata
DB_USER=postgres
DB_PASSWORD=root
JWT_SECRET=your-super-secret-jwt-key
```

### **2. Database Connection**

Development mode uses:

- SSL disabled for local PostgreSQL
- Connection pooling optimized for development
- Automatic connection retry

### **3. Hot Reload Features**

- **Fast Refresh**: React components update without losing state
- **API Route Reload**: API changes reflect immediately
- **CSS Hot Reload**: Styles update without page refresh
- **TypeScript**: Type checking in real-time

### **4. Turbopack (Faster Development)**

Your project is configured with Turbopack for faster builds:

```json
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}
```

## 🚨 **Common Issues & Solutions**

### **Port Already in Use**

```bash
# Find what's using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
# Or use different port
npm run dev -- -p 3001
```

### **File Changes Not Detected**

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### **Database Connection Issues**

```bash
# Check database health
curl http://localhost:3000/api/health/db
```

## ✅ **Verification Checklist**

After running `npm run dev`, you should see:

- [ ] Console shows "Ready in X ms"
- [ ] Browser opens to http://localhost:3000
- [ ] Making a file change triggers automatic reload
- [ ] Database health endpoint responds: `/api/health/db`
- [ ] Authentication works: `/login`

## 🎯 **Recommended Development Workflow**

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Open Browser**: http://localhost:3000

3. **Edit Files**: Any file in `src/` directory

4. **Save**: Changes appear automatically in browser

5. **Check Database**: Visit `/api/health/db` for connection status

6. **Test Authentication**: Login with `superadmin:admin123`

## 📊 **Performance in Development Mode**

With Turbopack enabled, you'll get:

- ⚡ **10x faster** cold starts
- 🔄 **Instant** hot reloads
- 📈 **Better** memory usage
- 🛠️ **Enhanced** debugging experience

**Your development environment is now optimized for rapid iteration!** 🚀
