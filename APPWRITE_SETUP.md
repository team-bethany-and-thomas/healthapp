# Appwrite Configuration Checklist

## 🔧 Steps to Fix "Failed to fetch" Error:

### 1. **Check Collection Permissions**
In your Appwrite Console:
1. Go to **Databases** → Your Database → **providers** collection
2. Click **Settings** → **Permissions**
3. Make sure you have:
   - **Role: Any** with **Read** permission
   - OR **Role: Users** with **Read** permission (if you want authenticated users only)

### 2. **Check Web Platform Configuration**
In your Appwrite Console:
1. Go to **Project Settings** → **Platforms**
2. Add a **Web App** platform if not already added
3. Set the hostname to: **`localhost`** (without port - Appwrite handles all ports automatically)
4. Make sure it's enabled

### 3. **Environment Variables**
Current values from your .env.local:
- Endpoint: https://cloud.appwrite.io/v1
- Project ID: 687a4d59003991e16dde
- Database ID: 687e6048001622f66995
- Collection ID: 687e608e001a7f42dc4b

### 4. **Common Issues & Solutions**

**403 Forbidden Error:**
- Collection permissions are too restrictive
- Add "Any" role with "Read" permission

**404 Not Found Error:**
- Database ID or Collection ID is incorrect
- Check the IDs in your Appwrite console

**Failed to fetch / Network Error:**
- Web platform not configured
- CORS issues
- Add localhost:3001 to web platforms

### 5. **Test Pages**
Visit these to diagnose:
- http://localhost:3001/appwrite-test - Raw HTTP test
- http://localhost:3001/network-test - Network connectivity
- http://localhost:3001/providers - Your main page with debugging

### 6. **Expected Result**
Once fixed, you should see:
- ✅ Successfully fetched from Appwrite!
- 📊 Documents count: [number of providers]
- Your provider cards displaying on the page
