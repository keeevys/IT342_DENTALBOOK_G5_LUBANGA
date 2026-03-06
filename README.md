# DentalBook - User Registration & Login System

## Project Information
- **Course**: IT342
- **Project Name**: DentalBook
- **Group**: G5 Lubanga
- **Phase**: Phase 1 - User Registration and Login

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.11
- **Build Tool**: Maven
- **Database**: MySQL
- **Security**: Spring Security with BCrypt password hashing
- **Architecture**: REST API

### Frontend
- **Framework**: React 19.2.4
- **Routing**: React Router DOM
- **HTTP Client**: Fetch API

## API Endpoints

### Authentication Endpoints

1. **POST /api/auth/register**
   - Register a new user
   - Request Body:
     ```json
     {
       "fullName": "John Doe",
       "email": "john@example.com",
       "password": "password123"
     }
     ```
   - Response (201 Created):
     ```json
     {
       "userId": 1,
       "fullName": "John Doe",
       "email": "john@example.com",
       "message": "User registered successfully"
     }
     ```

2. **POST /api/auth/login**
   - Login with existing credentials
   - Request Body:
     ```json
     {
       "email": "john@example.com",
       "password": "password123"
     }
     ```
   - Response (200 OK):
     ```json
     {
       "userId": 1,
       "fullName": "John Doe",
       "email": "john@example.com",
       "message": "Login successful"
     }
     ```

3. **GET /api/auth/test**
   - Test endpoint to verify API is working
   - Response: "Auth API is working!"

## Database Schema

### Table: users

| Column     | Type         | Constraints                  |
|------------|--------------|------------------------------|
| user_id    | INT          | PRIMARY KEY, AUTO_INCREMENT  |
| full_name  | VARCHAR(100) | NOT NULL                     |
| email      | VARCHAR(100) | UNIQUE, NOT NULL             |
| password   | VARCHAR(255) | NOT NULL (BCrypt hashed)     |
| created_at | DATETIME     | NOT NULL                     |

### Backend Setup

1. **Configure Database**
   - Create a MySQL database (it will be created automatically on first run)
   - Update `application.properties` if needed:
     ```properties
     spring.datasource.url=jdbc:mysql://localhost:3306/dentalbook_db?createDatabaseIfNotExist=true
     spring.datasource.username=root
     spring.datasource.password=
     ```

2. **Install Dependencies**
   ```bash
   cd backend/dentalbook
   mvn clean install
   ```

3. **Run Backend**
   ```bash
   mvn spring-boot:run
   ```
   - Backend will start on: http://localhost:8080

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Run Frontend**
   ```bash
   npm start
   ```
   - Frontend will start on: http://localhost:3000

## Features Implemented

### User Registration
-  Full name, email, and password fields
-  Field validation (required fields, email format, password length)
-  Duplicate email prevention
-  Password hashing using BCrypt
-  Database storage with timestamp
-  Success/error message display

### User Login
-  Email and password authentication
-  Credential validation against database
-  Password verification using BCrypt
-  Invalid credentials handling
-  Redirect to dashboard on success
-  User session storage in localStorage

## Security Implementation

### Password Security
- Passwords are hashed using **BCrypt** algorithm
- Never stored in plain text
- Hash strength: Default BCrypt cost factor (10)

### Validation
- **Email**: Must be valid email format
- **Password**: Minimum 6 characters
- **Name**: 2-100 characters
- Server-side validation using Jakarta Bean Validation

### CORS Configuration
- Configured to allow requests from React frontend (localhost:3000)
- Restricted to specific HTTP methods: GET, POST, PUT, DELETE

## Screenshots for Submission

Required screenshots:
1. Registration page
2. Successful user registration
3. Login page
4. Successful login with dashboard
5. MySQL database showing registered user with hashed password
