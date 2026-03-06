# Database Setup Instructions

## MySQL Configuration Required

Before running the DentalBook application, you need to set up MySQL properly.

### Option 1: MySQL Already Installed

1. **Start MySQL Service**
   - Open Services (Win + R, type `services.msc`)
   - Find "MySQL" or "MySQL80" service
   - Right-click and select "Start"

2. **Update application.properties with your password**
   - Open: `backend/dentalbook/src/main/resources/application.properties`
   - Update the password line:
     ```properties
     spring.datasource.password=YOUR_MYSQL_ROOT_PASSWORD
     ```

3. **If you don't remember your MySQL root password:**
   ```bash
   # Stop MySQL service first, then reset password
   # Or create a new user with proper permissions
   ```

### Option 2: Install MySQL

1. **Download MySQL**
   - Visit: https://dev.mysql.com/downloads/installer/
   - Download MySQL Installer for Windows
   - Install MySQL Community Server

2. **During Installation:**
   - Set root password (remember this!)
   - Keep default port: 3306
   - Start MySQL as a service

3. **After Installation:**
   - Update `application.properties` with your MySQL root password

### Option 3: Use Docker (Recommended for Development)

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop

2. **Run MySQL in Docker**
   ```bash
   docker run --name dentalbook-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=dentalbook_db -p 3306:3306 -d mysql:8.0
   ```

3. **Update application.properties**
   ```properties
   spring.datasource.password=password
   ```

### Quick Fix for Empty Password

If your MySQL root user has NO password (not recommended for production):

1. Test MySQL connection:
   ```bash
   mysql -u root
   ```

2. If it works without password, the application.properties is correct.
3. Make sure MySQL service is running.

### Verify MySQL is Running

Run in PowerShell:
```powershell
Get-Service -Name "*mysql*"
```

Or try connecting:
```bash
mysql -u root -p
# Enter your MySQL root password when prompted
```

### Create Database Manually (Optional)

The application will create the database automatically, but you can also do it manually:

```sql
CREATE DATABASE dentalbook_db;
USE dentalbook_db;
-- Tables will be created automatically by Spring Boot
```

## Re-run the Backend After MySQL Setup

```bash
cd backend/dentalbook
.\mvnw.cmd spring-boot:run
```

The application should start successfully on http://localhost:8080
