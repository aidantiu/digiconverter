# Dummy Test User for DigiConverter

## Test User Credentials
- **Email**: `test@digiconverter.com`
- **Password**: `testpassword123`
- **Username**: `testuser`

## Features
✅ **Unlimited uploads** (no 3-per-day limit)  
✅ **Full access** to all conversion features  
✅ **Persistent account** for testing authenticated features  

## How to Use with Postman

### Quick Setup:
1. **Start your server**: `npm start`
2. **Open Postman**
3. **Import the requests** using the guide below
4. **Test unlimited uploads** with the dummy user credentials

### 1. Login via API
**Method**: `POST`  
**URL**: `http://localhost:5000/api/auth/login`  
**Headers**:
```
Content-Type: application/json
```
**Body** (raw JSON):
```json
{
  "email": "test@digiconverter.com",
  "password": "testpassword123"
}
```

### 2. Save JWT Token in Postman
After successful login, copy the token from the response and use it in subsequent requests.

**Tip**: Use Postman environment variables to store the token:
- Create variable `authToken` 
- Set value to the token from login response
- Use `{{authToken}}` in Authorization headers

### 3. Use Token for Authenticated Requests
**Authorization Header**:
```
Authorization: Bearer {{authToken}}
```
*Replace `{{authToken}}` with your actual token or use Postman variables*

### 4. Test Unlimited Uploads
**Method**: `GET`  
**URL**: `http://localhost:5000/api/conversions/limits`  
**Headers**:
```
Authorization: Bearer {{authToken}}
```
**Expected Response**:
```json
{
  "isAuthenticated": true,
  "unlimited": true,
  "message": "Unlimited uploads for registered users"
}
```

## Management Scripts

### Create User (if needed)
```bash
node create-dummy-user.js
```

### Test User
```bash
node test-dummy-user.js
```

## Testing with Postman & Frontend
1. **Postman Testing**: Follow the detailed Postman guide above
2. **Frontend Testing**: Use the test credentials in your login form
3. **Verify unlimited uploads** work in both environments
4. **Test file conversions** with authenticated user

## Postman Testing Guide

### 1. Login Request
**Method**: `POST`  
**URL**: `http://localhost:3001/auth/login`  
**Headers**:
```
Content-Type: application/json
```
**Body** (raw JSON):
```json
{
  "email": "test@digiconverter.com",
  "password": "testpassword123"
}
```
**Expected Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68694c3accdb0d692972c12e",
    "username": "testuser",
    "email": "test@digiconverter.com"
  }
}
```

### 2. Check Upload Limits
**Method**: `GET`  
**URL**: `http://localhost:5000/api/conversions/limits`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Expected Response**:
```json
{
  "isAuthenticated": true,
  "unlimited": true,
  "message": "Unlimited uploads for registered users"
}
```

### 3. Upload & Convert File
**Method**: `POST`  
**URL**: `http://localhost:5000/api/conversions/upload`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Body** (form-data):
- Key: `file` | Type: File | Value: [Select your file]
- Key: `targetFormat` | Type: Text | Value: `png` (or `jpg`, `webp`, `mp4`, etc.)

**Expected Response**:
```json
{
  "message": "File uploaded successfully, conversion in progress",
  "conversionId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "uploadInfo": {
    "isAnonymous": false
  }
}
```

### 4. Check Conversion Status
**Method**: `GET`  
**URL**: `http://localhost:5000/api/conversions/status/YOUR_CONVERSION_ID`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Expected Response**:
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "status": "completed",
  "originalFileName": "test-image.jpg",
  "originalFormat": "jpg",
  "targetFormat": "png",
  "createdAt": "2025-07-06T12:00:00.000Z"
}
```

### 5. Download Converted File
**Method**: `GET`  
**URL**: `http://localhost:5000/api/conversions/download/YOUR_CONVERSION_ID`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Response**: File download

### 6. Get Conversion History
**Method**: `GET`  
**URL**: `http://localhost:5000/api/conversions/history`  
**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
**Expected Response**:
```json
{
  "conversions": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "originalFileName": "test-image.jpg",
      "targetFormat": "png",
      "status": "completed",
      "createdAt": "2025-07-06T12:00:00.000Z",
      "downloadCount": 1
    }
  ]
}
```

## Postman Collection Setup

### Step-by-Step:
1. **Create New Collection** in Postman named "DigiConverter API"
2. **Add Environment Variables**:
   - `baseUrl`: `http://localhost:5000/api`
   - `authToken`: (will be set after login)
3. **Create Login Request**:
   - Save the token from response using: `pm.environment.set("authToken", pm.response.json().token);`
4. **Use Token in Other Requests**:
   - Authorization Header: `Bearer {{authToken}}`

### Postman Pre-request Script (for Login):
```javascript
// No pre-request script needed for login
```

### Postman Test Script (for Login):
```javascript
// Save token to environment variable
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("authToken", response.token);
    pm.test("Login successful", function () {
        pm.expect(response.message).to.include("Login successful");
    });
}
```

---

**Note**: This is a test user with a simple password. Do not use in production!
