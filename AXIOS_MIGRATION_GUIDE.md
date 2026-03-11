# 🔧 Migration Guide: Update All Axios Calls to Use axiosInstance

## ✅ Files Already Updated:
- ✅ AdminLogin.tsx
- ✅ EmployeeLogin.tsx
- ✅ Gatekeeper.tsx
- ✅ logoutModel.tsx
- ✅ adminProtected.tsx
- ✅ settings.tsx

## 📋 Files That Still Need Updates:

Use **Find & Replace** in VS Code to update all remaining files:

### Step 1: Update Imports
**Find:**
```typescript
import axios from "axios";
```

**Replace with:**
```typescript
import axiosInstance from "../../utils/axiosConfig"; // Adjust path based on file location
```

### Step 2: Update API Calls

**Find pattern:**
```typescript
axios.get("http://localhost:5000/api/...", {
    withCredentials: true
})
```

**Replace with:**
```typescript
axiosInstance.get("/api/...")
```

**Find pattern:**
```typescript
axios.post("http://localhost:5000/api/...", data, {
    withCredentials: true
})
```

**Replace with:**
```typescript
axiosInstance.post("/api/...", data)
```

Same for `axios.put()` and `axios.delete()`.

---

## 🗂️ Files to Update:

### Admin Dashboard Options:
1. **dashboard.tsx** - Multiple axios.get() calls
2. **manageUsers.tsx** - User management APIs
3. **manageClients.tsx** - Client CRUD operations
4. **manageCat.tsx** - Category management
5. **manageModels.tsx** - Model/inventory management
6. **Report.tsx** - Reporting APIs

### Employee Dashboard Options:
7. **addStock.tsx** - Stock addition APIs
8. **transferStock.tsx** - Stock transfer APIs

---

## 📝 Example Transformation:

### Before:
```typescript
import axios from "axios";

const fetchData = async () => {
    const response = await axios.get("http://localhost:5000/api/admin/clients/all", {
        withCredentials: true
    });
};
```

### After:
```typescript
import axiosInstance from "../../utils/axiosConfig";

const fetchData = async () => {
    const response = await axiosInstance.get("/api/admin/clients/all");
};
```

---

## 🎯 Quick Commands (VS Code):

1. **Ctrl + Shift + H** (Open Find & Replace in Files)
2. Enable regex mode (icon with `.*`)
3. Search in: `client/src/**/*.{tsx,ts}`

### Replace axios import:
- **Find:** `import axios from "axios";`
- **Replace:** `import axiosInstance from "../../utils/axiosConfig";`

### Replace axios.get calls:
- **Find:** `axios\.get\("http://localhost:5000(\/api\/[^"]+)",\s*\{\s*withCredentials:\s*true[^}]*\}\s*\)`
- **Replace:** `axiosInstance.get("$1")`

### Replace axios.post calls:
- **Find:** `axios\.post\("http://localhost:5000(\/api\/[^"]+)",\s*([^,]+),\s*\{\s*withCredentials:\s*true[^}]*\}\s*\)`
- **Replace:** `axiosInstance.post("$1", $2)`

---

## ⚠️ Important Notes:

1. **Path adjustments**: The import path to `axiosConfig.ts` varies by file location:
   - From `pages/admin-dashboard/options/`: `../../../utils/axiosConfig`
   - From `pages/admin-login/`: `../../utils/axiosConfig`
   - From `components/`: `../../utils/axiosConfig`

2. **No more baseURL**: Remove `"http://localhost:5000"` from all API calls

3. **No more withCredentials**: It's already set in axiosInstance

4. **Token handling**: Automatically handled by interceptors (localStorage for Electron, cookies for web)

---

## 🧪 After Updates, Test:

1. **Web Browser:**
   ```bash
   npm run dev
   ```
   - Login should work with cookies
   - All API calls should succeed

2. **Electron:**
   ```bash
   npm run build
   npm run electron
   ```
   - Login should work with localStorage token
   - All API calls should include Authorization header
   - Check DevTools: localStorage should have `apl_auth_token`

---

## 🚀 What This Achieves:

✅ **Web Browser**: Uses HTTP-only cookies (secure)  
✅ **Electron**: Uses Authorization Bearer tokens (works with file:// protocol)  
✅ **Automatic detection**: No code changes needed per platform  
✅ **Production-ready**: Same approach used by Slack, Discord, VS Code  
✅ **Token refresh**: Handled by interceptors  
✅ **Logout cleanup**: Automatically clears tokens from localStorage
