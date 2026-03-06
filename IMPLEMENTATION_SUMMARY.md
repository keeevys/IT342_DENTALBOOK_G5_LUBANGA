# IT342 Phase 1 Implementation Summary
## DentalBook - User Registration and Login System

---

## 📋 Implementation Overview

This document provides a summary of the User Registration and Login implementation for the DentalBook system as part of IT342 Phase 1.

---

## 🎯 Features Implemented

### 1. User Registration
**Endpoint:** `POST /api/auth/register`

**Implementation Details:**
- **Fields**: Full Name, Email, Password
- **Validation**: 
  - Full Name: 2-100 characters, required
  - Email: Valid email format, required, unique
  - Password: Minimum 6 characters, required
- **Security**: Passwords hashed using BCrypt algorithm
- **Duplicate Prevention**: Email uniqueness enforced at database level
- **Response**: Returns user ID, full name, email, and success message

**Code Location:**
- Controller: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/controller/AuthController.java`
- Service: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/service/UserService.java`
- Entity: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/entity/User.java`
- DTO: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/dto/RegisterRequest.java`

### 2. User Login
**Endpoint:** `POST /api/auth/login`

**Implementation Details:**
- **Fields**: Email, Password
- **Authentication Process**:
  1. Verify email exists in database
  2. Compare provided password with hashed password using BCrypt
  3. Return user information if credentials are valid
  4. Return error if credentials are invalid
- **Session Management**: User data stored in browser localStorage
- **Redirect**: Successful login redirects to dashboard

**Code Location:**
- Controller: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/controller/AuthController.java`
- Service: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/service/UserService.java`
- DTO: `backend/dentalbook/src/main/java/edu/cit/lubanga/dentalbook/dto/LoginRequest.java`

---

## 💾 Database Schema

### Table: `users`

| Column Name | Data Type     | Constraints                    | Description                           |
|-------------|---------------|--------------------------------|---------------------------------------|
| user_id     | INT           | PRIMARY KEY, AUTO_INCREMENT    | Unique identifier for each user       |
| full_name   | VARCHAR(100)  | NOT NULL                       | User's full name                      |
| email       | VARCHAR(100)  | UNIQUE, NOT NULL               | User's email address (login username) |
| password    | VARCHAR(255)  | NOT NULL                       | BCrypt hashed password                |
| created_at  | DATETIME      | NOT NULL                       | Timestamp of account creation         |

**Database Configuration:**
- Database Name: `dentalbook_db`
- Host: localhost
- Port: 3306
- User: root
- Auto-create: Enabled (database created automatically if not exists)
- DDL Mode: update (tables created/updated automatically)

---

## 🔐 Security Implementation

### Password Hashing
- **Algorithm**: BCrypt
- **Implementation**: Spring Security's `BCryptPasswordEncoder`
- **Cost Factor**: 10 (default)
- **Storage**: Only hashed passwords stored, never plain text

**Code Example:**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// In UserService:
user.setPassword(passwordEncoder.encode(request.getPassword()));
```

### Validation Rules
- **Server-side**: Jakarta Bean Validation annotations
  - `@NotBlank`: Ensures field is not empty
  - `@Email`: Validates email format
  - `@Size`: Enforces length constraints
- **Client-side**: HTML5 validation + React state management

### Duplicate Email Prevention
**Method 1: Repository Check**
```java
if (userRepository.existsByEmail(request.getEmail())) {
    throw new RuntimeException("Email already registered");
}
```

**Method 2: Database Constraint**
```java
@Column(unique = true, nullable = false, length = 100)
private String email;
```

### CORS Configuration
- **Allowed Origin**: http://localhost:3000 (React frontend)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Enabled for session management

---

## 🛠️ Technology Stack

### Backend
| Technology              | Version  | Purpose                          |
|-------------------------|----------|----------------------------------|
| Spring Boot             | 3.5.11   | Framework                        |
| Spring Data JPA         | Included | Database access                  |
| Spring Security         | 6.5.8    | Security & password hashing      |
| Spring Validation       | Included | Request validation               |
| MySQL Connector         | Latest   | Database driver                  |
| Hibernate               | 6.x      | ORM                              |
| Maven                   | 3.x      | Build tool                       |
| Java                    | 17       | Programming language             |

### Frontend
| Technology         | Version  | Purpose                          |
|--------------------|----------|----------------------------------|
| React              | 19.2.4   | UI framework                     |
| React Router DOM   | Latest   | Client-side routing              |
| JavaScript (ES6+)  | -        | Programming language             |
| CSS3               | -        | Styling                          |
| Fetch API          | -        | HTTP client                      |

---

## 📡 API Endpoints

### 1. Register User
```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (201 Created):**
```json
{
  "userId": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "message": "User registered successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Email already registered"
}
```

### 2. Login User
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "userId": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

### 3. Test API
```http
GET http://localhost:8080/api/auth/test
```

**Response (200 OK):**
```text
Auth API is working!
```

---

## 🎨 Frontend Implementation

### Pages Implemented

#### 1. Registration Page (`/register`)
- **File**: `web/src/components/Register.js`
- **Features**:
  - Form with Full Name, Email, and Password fields
  - Client-side validation
  - Error message display
  - Success message and redirect to login
  - Responsive design with gradient background
  - Link to login page for existing users

#### 2. Login Page (`/login`)
- **File**: `web/src/components/Login.js`
- **Features**:
  - Form with Email and Password fields
  - Credential validation
  - Error message display
  - Session storage (localStorage)
  - Redirect to dashboard on success
  - Link to registration page for new users

#### 3. Dashboard Page (`/dashboard`)
- **File**: `web/src/components/Dashboard.js`
- **Features**:
  - Welcome message with user's name
  - Display user email
  - Logout functionality
  - Protected route (redirects to login if not authenticated)
  - Placeholder cards for future features

### Routing Configuration
```javascript
<Routes>
  <Route path="/" element={<Navigate to="/login" />} />
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Routes>
```

---

## 🏗️ Project Structure

```
IT342_DENTALBOOK_G5_LUBANGA/
├── backend/dentalbook/
│   ├── src/main/
│   │   ├── java/edu/cit/lubanga/dentalbook/
│   │   │   ├── config/
│   │   │   │   ├── CorsConfig.java          # CORS configuration
│   │   │   │   └── SecurityConfig.java      # Security & password encoder
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java      # REST endpoints
│   │   │   ├── dto/
│   │   │   │   ├── AuthResponse.java        # Response DTO
│   │   │   │   ├── LoginRequest.java        # Login request DTO
│   │   │   │   └── RegisterRequest.java     # Registration request DTO
│   │   │   ├── entity/
│   │   │   │   └── User.java                # User entity (JPA)
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java      # Data access layer
│   │   │   ├── service/
│   │   │   │   └── UserService.java         # Business logic
│   │   │   └── DentalbookApplication.java   # Main app
│   │   └── resources/
│   │       └── application.properties        # Configuration
│   └── pom.xml                               # Maven dependencies
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js & .css          # Dashboard page
│   │   │   ├── Login.js & .css              # Login page
│   │   │   └── Register.js & .css           # Registration page
│   │   ├── App.js                            # Main React component
│   │   └── index.js                          # Entry point
│   └── package.json                          # npm dependencies
├── README.md                                  # Project documentation
└── DATABASE_SETUP.md                         # Database setup guide
```

---

## 🚀 How to Run the System

### Step 1: Setup MySQL Database

1. **Ensure MySQL is running**
   ```powershell
   Get-Service -Name "*mysql*"
   ```

2. **Update database password** in `backend/dentalbook/src/main/resources/application.properties`:
   ```properties
   spring.datasource.password=YOUR_MYSQL_ROOT_PASSWORD
   ```

### Step 2: Start Backend

```bash
cd backend/dentalbook
.\mvnw.cmd spring-boot:run
```

- Backend URL: http://localhost:8080
- API Base URL: http://localhost:8080/api/auth

### Step 3: Start Frontend

```bash
cd web
npm install  # Only needed first time
npm start
```

- Frontend URL: http://localhost:3000

---

## ✅ Testing Scenarios

### Test Case 1: User Registration
1. Navigate to http://localhost:3000/register
2. Fill form:
   - Full Name: "Test User"
   - Email: "test@dentalbook.com"
   - Password: "test123"
3. Click "Register"
4. **Expected**: Success alert → redirect to login page

### Test Case 2: Duplicate Email Prevention
1. Try registering with same email again
2. **Expected**: Error message "Email already registered"

### Test Case 3: Validation
1. Try submitting with empty fields
2. Try invalid email format
3. Try password less than 6 characters
4. **Expected**: Validation errors displayed

### Test Case 4: User Login
1. Navigate to http://localhost:3000/login
2. Enter registered credentials
3. Click "Login"
4. **Expected**: Redirect to dashboard with welcome message

### Test Case 5: Invalid Login
1. Enter wrong password or unregistered email
2. **Expected**: Error message "Invalid email or password"

### Test Case 6: Database Verification
1. Open MySQL Workbench or command line:
   ```sql
   USE dentalbook_db;
   SELECT user_id, full_name, email, created_at FROM users;
   ```
2. **Expected**: See registered users with creation timestamps
3. Check password is hashed (starts with `$2a$` for BCrypt)

### Test Case 7: Session Persistence
1. After login, close browser tab
2. Reopen http://localhost:3000/dashboard
3. **Expected**: Still logged in (check localStorage)

---

## 📸 Screenshots for Submission

### Required Screenshots:

1. **Registration Page**
   - URL: http://localhost:3000/register
   - Show empty form with all fields

2. **Successful Registration**
   - Fill form and submit
   - Show success message or redirect

3. **Login Page**
   - URL: http://localhost:3000/login
   - Show login form

4. **Successful Login**
   - Show dashboard after login
   - Display user's name and welcome message

5. **Database Records**
   - MySQL query results showing:
     - user_id
     - full_name
     - email
     - password (hashed with BCrypt)
     - created_at timestamp

6. **Duplicate Email Prevention** (Bonus)
   - Show error message when trying to register with existing email

7. **API Testing** (Bonus)
   - Use Postman or similar tool
   - Show POST request and response for registration/login

---

## 🔄 Git Commit Instructions

### Final Commit Message:
```
IT342 Phase 1 – User Registration and Login Completed

Features Implemented:
- User Registration with validation and duplicate prevention
- User Login with BCrypt password verification
- Secure password storage using BCrypt hashing
- MySQL database integration with auto-create
- REST API endpoints for authentication
- React frontend with routing
- Session management with localStorage
- Dashboard with user information display

Technology Stack:
- Backend: Spring Boot 3.5.11 + Spring Security + JPA
- Frontend: React 19.2.4 + React Router DOM
- Database: MySQL with auto DDL
- Security: BCrypt password hashing

Files Changed:
- Backend: Entity, Repository, Service, Controller, DTOs, Config
- Frontend: Register, Login, Dashboard components
- Configuration: application.properties, pom.xml, package.json
```

### Commit Commands:
```bash
git add .
git commit -m "IT342 Phase 1 – User Registration and Login Completed"
git push origin main
```

---

## 📋 Submission Checklist

- [ ] GitHub repository link in PDF
- [ ] Repository name: `IT342-Lubanga-DentalBook`
- [ ] Base package: `edu.cit.lubanga.dentalbook`
- [ ] Final commit message as specified
- [ ] Screenshot: Registration page
- [ ] Screenshot: Successful registration
- [ ] Screenshot: Login page
- [ ] Screenshot: Successful login with dashboard
- [ ] Screenshot: Database table with hashed passwords
- [ ] Implementation summary (this document) included
- [ ] README.md with setup instructions
- [ ] All code committed and pushed

---

## 📝 Implementation Summary for PDF

### User Registration

**Fields Used:**
- Full Name (String, 2-100 characters)
- Email (String, valid email format, unique)
- Password (String, minimum 6 characters)

**Validation Process:**
1. Client-side: HTML5 validation + React state
2. Server-side: Jakarta Bean Validation annotations
3. Required field validation
4. Email format validation
5. Password length validation

**Duplicate Account Prevention:**
1. Database constraint: `UNIQUE` on email column
2. Pre-save check: `userRepository.existsByEmail()`
3. Returns error message if email already exists

**Password Storage:**
- Algorithm: BCrypt with cost factor 10
- Implementation: Spring Security's BCryptPasswordEncoder
- Storage: Hashed string stored in password column (255 chars)
- Never stored in plain text

### User Login

**Credentials Used:**
- Email (username)
- Password

**User Verification:**
1. Find user by email using repository
2. Check if user exists
3. Verify password using BCrypt `matches()` method
4. Compare provided password with stored hash

**After Successful Login:**
1. Return user information (ID, name, email)
2. Frontend stores data in localStorage
3. Redirect to dashboard page
4. Display welcome message with user's name

### Database Table

**Table Name:** `users`

**Columns:**
- `user_id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `full_name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `password` (VARCHAR(255), NOT NULL) - BCrypt hashed
- `created_at` (DATETIME, NOT NULL)

### API Endpoints

1. **POST /api/auth/register**
   - Registers new user
   - Request: JSON with fullName, email, password
   - Response: User info and success message

2. **POST /api/auth/login**
   - Authenticates user
   - Request: JSON with email, password
   - Response: User info and success message

3. **GET /api/auth/test**
   - Tests API connectivity
   - Response: "Auth API is working!"

---

## 👥 Project Information

**Course:** IT342  
**Group:** G5 - Lubanga  
**Project Name:** DentalBook  
**Phase:** 1 - User Registration and Login  
**Date:** March 6, 2026  

**Maven Configuration:**
- Group ID: `edu.cit.lubanga`
- Artifact ID: `dentalbook`
- Base Package: `edu.cit.lubanga.dentalbook`

---

## 📞 Troubleshooting

### Backend won't start
- Check MySQL is running: `Get-Service -Name "*mysql*"`
- Verify database password in application.properties
- Check port 8080 is not in use
- Run: `.\mvnw.cmd clean install` to rebuild

### Frontend won't start
- Delete node_modules and reinstall: `npm install`
- Check port 3000 is not in use
- Clear browser cache

### Database connection fails
- Verify MySQL service is running
- Check credentials in application.properties
- Try creating database manually: `CREATE DATABASE dentalbook_db;`
- See DATABASE_SETUP.md for detailed instructions

### CORS errors
- Ensure backend is running on port 8080
- Ensure frontend is running on port 3000
- Check CorsConfig.java allows localhost:3000

---

## 🎉 Conclusion

This implementation successfully fulfills all requirements for IT342 Phase 1:
- ✅ User Registration with all required fields
- ✅ Secure password storage with BCrypt
- ✅ Duplicate email prevention
- ✅ User Login with credential validation
- ✅ Successful login redirects to dashboard
- ✅ MySQL database integration
- ✅ REST API architecture
- ✅ React frontend with routing
- ✅ Proper validation on client and server
- ✅ Following Spring Boot 3.5.x specifications
- ✅ Maven naming convention: `edu.cit.lubanga.dentalbook`

The system is ready for testing and demonstration!

---

**End of Implementation Summary**
