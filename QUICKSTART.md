# 🚀 Quick Start Guide - DentalBook

## Prerequisites Check
- [x] Java 17+ installed
- [x] MySQL Server installed and running (MySQL94 detected)
- [x] Node.js and npm installed
- [x] Maven wrapper (mvnw.cmd) available

## ⚡ Quick Start (3 Steps)

### Step 1: Configure MySQL Password

**IMPORTANT:** You need to set your MySQL root password before running the backend.

1. Open this file in your editor:
   ```
   backend/dentalbook/src/main/resources/application.properties
   ```

2. Update line 5 with your MySQL root password:
   ```properties
   spring.datasource.password=YOUR_PASSWORD_HERE
   ```
   
   If you don't remember your password, see DATABASE_SETUP.md for reset instructions.

### Step 2: Start Backend Server

```powershell
cd backend\dentalbook
.\mvnw.cmd spring-boot:run
```

**Expected Output:**
```
Started DentalbookApplication in X.XXX seconds
Tomcat started on port(s): 8080 (http)
```

**Backend will be available at:** http://localhost:8080

### Step 3: Start Frontend Server (New Terminal)

```powershell
cd web
npm start
```

**Frontend will open automatically at:** http://localhost:3000

---

## ✅ Testing the System

### Test 1: Registration
1. Go to: http://localhost:3000/register
2. Fill in:
   - Name: "Test User"
   - Email: "test@dentalbook.com"
   - Password: "test123"
3. Click Register
4. **Expected:** Success message → redirect to login

### Test 2: Login
1. Go to: http://localhost:3000/login
2. Enter credentials from registration
3. Click Login
4. **Expected:** Redirect to dashboard with welcome message

### Test 3: Verify Database
```sql
mysql -u root -p
-- Enter your password
USE dentalbook_db;
SELECT user_id, full_name, email, LEFT(password, 20) as password_hash, created_at FROM users;
```

**Expected:** See registered users with BCrypt hashed passwords (starting with `$2a$`)

---

## 📁 Project Files Created

### Backend (Spring Boot)

**Entities:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/entity/User.java`

**Repositories:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/repository/UserRepository.java`

**Services:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/service/UserService.java`

**Controllers:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/controller/AuthController.java`

**DTOs:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/dto/RegisterRequest.java`
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/dto/LoginRequest.java`
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/dto/AuthResponse.java`

**Configuration:**
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/config/SecurityConfig.java`
- ✅ `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/config/CorsConfig.java`
- ✅ `backend/dentalbook/src/main/resources/application.properties` (updated)
- ✅ `backend/dentalbook/pom.xml` (updated with dependencies)

### Frontend (React)

**Components:**
- ✅ `web/src/components/Register.js` + `Register.css`
- ✅ `web/src/components/Login.js` + `Login.css`
- ✅ `web/src/components/Dashboard.js` + `Dashboard.css`

**App Configuration:**
- ✅ `web/src/App.js` (updated with routing)
- ✅ `web/package.json` (updated with react-router-dom)

### Documentation

- ✅ `README.md` - Complete project documentation
- ✅ `DATABASE_SETUP.md` - MySQL configuration guide
- ✅ `IMPLEMENTATION_SUMMARY.md` - Detailed implementation summary for PDF submission
- ✅ `QUICKSTART.md` - This file

---

## 🔥 Common Issues & Solutions

### Issue 1: Backend fails to start - "Access denied for user 'root'"
**Solution:** Update MySQL password in `application.properties`

### Issue 2: "mvnw.cmd not recognized"
**Solution:** Make sure you're in the `backend/dentalbook` directory

### Issue 3: React shows blank page
**Solution:** Check browser console for errors, ensure backend is running on port 8080

### Issue 4: CORS error in browser
**Solution:** Verify backend is running and CorsConfig allows localhost:3000

### Issue 5: MySQL service not running
**Solution:** 
```powershell
# Check service status
Get-Service -Name "*mysql*"

# Start if stopped (run as Administrator)
Start-Service MySQL94
```

---

## 🎯 API Endpoints Reference

| Method | Endpoint              | Description        | Auth Required |
|--------|-----------------------|--------------------|---------------|
| POST   | /api/auth/register    | Register new user  | No            |
| POST   | /api/auth/login       | Login user         | No            |
| GET    | /api/auth/test        | Test API           | No            |

**Base URL:** http://localhost:8080

---

## 📦 Git Workflow for Submission

1. **Add all changes:**
   ```bash
   git add .
   ```

2. **Commit with required message:**
   ```bash
   git commit -m "IT342 Phase 1 – User Registration and Login Completed"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

4. **Get commit hash:**
   ```bash
   git log -1 --oneline
   ```

5. **Include in PDF:**
   - Repository link
   - Commit hash
   - Screenshots
   - Implementation summary

---

## 📊 Features Checklist

### User Registration
- [x] Full name field
- [x] Email field (unique)
- [x] Password field (min 6 chars)
- [x] Field validation
- [x] Duplicate email prevention
- [x] BCrypt password hashing
- [x] Database storage
- [x] Success/error messages

### User Login
- [x] Email field
- [x] Password field
- [x] Credential validation
- [x] Password verification (BCrypt)
- [x] Invalid credential handling
- [x] Redirect to dashboard
- [x] Session management (localStorage)

### Database
- [x] MySQL integration
- [x] Auto-create database
- [x] User table with constraints
- [x] Timestamps
- [x] BCrypt password storage

### Security
- [x] BCrypt password hashing
- [x] Spring Security configuration
- [x] CORS configuration
- [x] Input validation

### Frontend
- [x] Registration page
- [x] Login page
- [x] Dashboard page
- [x] React Router setup
- [x] Responsive design
- [x] Error handling

---

## 📞 Support

If you encounter any issues:

1. Check the terminal output for error messages
2. Verify MySQL is running and credentials are correct
3. Ensure both backend (8080) and frontend (3000) are running
4. Review DATABASE_SETUP.md for MySQL configuration
5. Check IMPLEMENTATION_SUMMARY.md for detailed documentation

---

## 🎉 You're Ready!

Your DentalBook authentication system is fully implemented and ready for testing. 

**Next Steps:**
1. Set your MySQL password in application.properties
2. Start backend server
3. Start frontend server
4. Test registration and login
5. Take screenshots for submission
6. Commit and push to GitHub

Good luck with your submission! 🚀

---

**Project:** DentalBook  
**Group:** G5 - Lubanga  
**Course:** IT342  
**Phase:** 1 - User Registration and Login  
**Status:** ✅ Implementation Complete
