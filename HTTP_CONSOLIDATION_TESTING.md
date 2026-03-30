# HTTP Consolidation - Testing & Validation Guide

## ✅ Consolidation Complete

### Changes Made
- ✅ Created `src/shared/api/httpClient.ts` - Single source of truth for HTTP clients
- ✅ Consolidated `http.ts`, `apiClient.ts`, `clienteHttp.ts` into one unified module
- ✅ Updated all 5 repositories to import from `httpClient.ts`
- ✅ Updated `shared/api/index.ts` to export from consolidated client
- ✅ Build passes (2.17s, 307.87 kB gzip: 100.12 kB)

---

## 📋 HTTP Clients Available

### 1. `authHttp` - Authentication
- **Purpose**: Login, password reset, no token required
- **Base URL**: `${AUTH_BASE_URL}` → `:8080/autorizacion`
- **JWT Required**: ❌ NO
- **Endpoints**: `/autorizacion/login`, `/autorizacion/forgot-password`, etc.
- **Interceptors**: Error handling only
- **Usage**: `AuthRepository`

### 2. `rrhhHttp` - RRHH (HR)
- **Purpose**: Employees, Contracts, Applicants
- **Base URL**: `${RRHH_BASE_URL}` → `:8080/rrhh`
- **JWT Required**: ✅ YES (Bearer token)
- **Endpoints**: `/postulantes`, `/empleados`, `/contratos`
- **Interceptors**: Auth token + Error handling
- **Usage**: `EmployeeRepository`, `ContractRepository`, `ApplicantRepository`

### 3. `leadsHttp` - Leads & Plans
- **Purpose**: Campaigns, Plans, Promotions, Events
- **Base URL**: `${LEADS_BASE_URL}` → `:8080/leads`
- **JWT Required**: ✅ YES (Bearer token)
- **Endpoints**: `/planes`, `/promociones`, `/eventos`
- **Interceptors**: Auth token + Error handling
- **Usage**: `LeadsRepository`

---

## 🔐 JWT Token Handling

### Token Storage
Stored in `localStorage.auth_token` after successful login:
```typescript
// After AuthRepository.login() succeeds:
localStorage.setItem('auth_token', response.token);
localStorage.setItem('auth_user', JSON.stringify(user));
```

### Token Injection (via Interceptor)
rrhhHttp and leadsHttp automatically add JWT to every request:
```typescript
// Request interceptor adds:
headers.Authorization = `Bearer ${token}`
```

### Token Validation
Verify token is stored and attached:
```typescript
// In browser console:
localStorage.getItem('auth_token')  // Should show token value
```

---

## 🧪 Testing Critical Endpoints

### Test 1: Login (authHttp - NO JWT)
```bash
curl -X POST http://localhost:8080/autorizacion/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass"}'
```

**Expected**: 
- Status: 200 OK
- Response: `{ token: "...", empleadoId: 123, ... }`
- Local Storage Updated: ✅

---

### Test 2: Get Employees (rrhhHttp - WITH JWT)
```bash
curl -X GET http://localhost:8080/rrhh/empleados \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Expected**:
- Status: 200 OK
- Authorization Header: ✅ Present in DevTools
- Response: Employee list

---

### Test 3: Get Plans (leadsHttp - WITH JWT)
```bash
curl -X GET http://localhost:8080/leads/planes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Expected**:
- Status: 200 OK
- Authorization Header: ✅ Present in DevTools
- Response: Plans list

---

### Test 4: Get Applicants (rrhhHttp - WITH JWT)
```bash
curl -X GET http://localhost:8080/rrhh/postulantes?etapa=reclutamiento \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Expected**:
- Status: 200 OK
- Authorization Header: ✅ Present
- Response: Applicant list for stage

---

## 🔍 How to Verify Headers in Browser DevTools

### Step 1: Open DevTools
- Press `F12` or right-click → Inspect → **Network** tab

### Step 2: Make a Request
- Login first (credentials captured)
- Navigate to a page that loads data (Employees, Plans, etc.)

### Step 3: Check Network Tab
1. Look for requests to `/api/rrhh/*` or `/api/leads/*`
2. Click on request → **Headers** section
3. Scroll down to **Request Headers**
4. Verify `Authorization: Bearer <token>` is present

### Step 4: Check Response
- Status should be `200 OK` (or expected status)
- Response data should be in **Response** tab

### Example Output
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  Accept: application/json

Response:
  Status: 200 OK
  Data: { data: [...], total: 10 }
```

---

## 401 Unauthorized Handling

### What Happens on 401
1. Error interceptor catches 401 status
2. Logs: `[httpClient] 401 Unauthorized - Clearing session`
3. Clears localStorage:
   ```typescript
   localStorage.removeItem('auth_token');
   localStorage.removeItem('auth_user');
   localStorage.removeItem('user');
   ```
4. App should redirect to login

### How to Test
1. Get valid token
2. Open DevTools Console
3. Modify token: `localStorage.setItem('auth_token', 'invalid_token')`
4. Make API request (should fail with 401)
5. Verify session cleared in console

---

## 📊 Expected Console Logs (Debug Mode)

When making authenticated requests, you should see:
```javascript
// Request with JWT:
[rrhhHttp] JWT attached {
  endpoint: "/postulantes",
  hasToken: true
}

// Success response:
[rrhhHttp] Success {
  status: 200,
  url: "/postulantes",
  dataKeys: 5
}
```

### Enable Logging
Chrome DevTools:
- **Settings** → **Console** → Check "Verbose"
- Or use `console.level = 'debug'`

---

## ⚠️ Timeout & Retry Behavior

### Timeout Settings
All clients: **30 seconds** (30000ms)

### Retry Logic
- **Trigger**: ECONNABORTED (timeout reached)
- **Attempts**: 1 retry automatically
- **Delay**: None (immediate)
- **Log**: `[httpClient] TIMEOUT - Retrying request`

### Test Timeout
1. Slow down network (DevTools → Network → "Slow 3G")
2. Make request to endpoint
3. Should see retry message if timeout occurs

---

## ✅ Validation Checklist

Before deploying:

- [ ] `npm run build` passes (size < 150kB gzip)
- [ ] Login works → token stored in localStorage
- [ ] Employees page loads → 200 OK + JWT header present
- [ ] Plans page loads → 200 OK + JWT header present
- [ ] Applicants page loads → 200 OK + JWT header present
- [ ] Logout clears token
- [ ] Missing token → 401 Unauthorized
- [ ] No CORS errors in console
- [ ] No type errors (TS2305, etc.)

---

## 📝 Important Notes

### Backward Compatibility
- Old code importing `clienteHttp` still works (re-exports from httpClient)
- All type interfaces (ApiError, ApiResult) available from `@shared/api`

### No Breaking Changes
- Repositories automatically use correct client (authHttp, rrhhHttp, leadsHttp)
- Services don't need updates (they use repositories)
- Components don't change

### Production Ready
- Error logging includes full context (URL, status, message)
- Retry handles temporary network issues
- JWT lifecycle managed automatically
- Session cleanup on auth failure

---

## 🔧 Future Improvements (Not Implemented)

- [ ] Add request/response caching (React Query)
- [ ] Token refresh on 401 (currently just clears)
- [ ] Request deduplication
- [ ] Service worker for offline mode
- [ ] API versioning in base URLs

---

## 📞 Troubleshooting

### Issue: 401 Unauthorized on all requests
**Solution**: 
1. Check token in localStorage: `localStorage.getItem('auth_token')`
2. Login again if missing
3. Verify token not expired

### Issue: CORS error
**Solution**:
1. Check backend CORS headers
2. Verify base URLs in `.env`
3. Check vite proxy config in `vite.config.ts`

### Issue: Timeout errors appearing
**Solution**:
1. Check backend is running on `:8080`
2. Check network tab in DevTools
3. Try retry manually

### Issue: Header not visible in DevTools
**Solution**:
1. Look in **Request Headers** section (not "Headers" tab)
2. Refresh page to see new requests
3. Check if request is actually authenticated endpoint (POST, etc.)

