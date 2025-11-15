# HotKup - WhatsApp Provider Platform

## 🚀 Overview

**HotKup** is a **complete, production-ready** WhatsApp Business API provider platform, featuring a full-stack solution with React frontend and Java Spring Boot backend. The implementation follows enterprise-grade security standards and provides a seamless user experience for tenant registration, email verification, password setup, and login.

**HotKup** enables businesses to connect to WhatsApp Business API through multiple providers (Meta, Twilio, Gupshup, 360Dialog) and manage their WhatsApp messaging, campaigns, and CRM functionality in one unified platform.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Complete Onboarding Flow](#complete-onboarding-flow)
4. [API Endpoints](#api-endpoints)
5. [Configuration](#configuration)
6. [Email Integration](#email-integration)
7. [Security Features](#security-features)
8. [Development Setup](#development-setup)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

## 🚀 Quick Start

### Prerequisites
- **Java 17+** (for backend)
- **Node.js 18+** (for frontend)
- **PostgreSQL** (database)
- **Redis** (caching and rate limiting)

### 1. Backend Setup
```bash
cd hotkup-api

# Configure environment variables
cp src/main/resources/application.yml.example src/main/resources/application.yml
# Edit application.yml with your database and email settings

# Start PostgreSQL and Redis (using Docker)
docker run -d --name postgres-hotkup -e POSTGRES_DB=db_hotkup -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
docker run -d --name redis-hotkup -p 6379:6379 redis:7-alpine

# Build and run backend
mvn clean install
mvn spring-boot:run
```

### 2. Frontend Setup
```bash
cd hotkup-web

# Install dependencies
npm install

# Configure environment
# Edit .env file (already configured for localhost:3002)

# Start development server
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:8081/hotkup (or your configured API path)
- **API Documentation**: http://localhost:8081/hotkup/swagger-ui.html

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Hook Form, Zod validation
- **Backend**: Java 17, Spring Boot 3, JOOQ (database access), PostgreSQL
- **Security**: JWT authentication, BCrypt password encryption, Rate limiting
- **Email**: Gmail SMTP integration with template processing
- **DevOps**: Docker support, environment-based configuration

### Project Structure
```
hotkup-web/          # React frontend
├── src/
│   ├── components/auth/     # Authentication components
│   │   ├── TenantSignupForm.tsx    # Main signup form
│   │   ├── EmailVerificationForm.tsx # Email verification
│   │   ├── SetPasswordForm.tsx     # Password setup
│   │   └── TenantLoginForm.tsx     # Tenant admin login
│   ├── components/whatsapp/  # WhatsApp integration components
│   │   ├── WhatsAppBusinessSetup.tsx  # Provider setup
│   │   ├── WhatsAppCampaignDashboard.tsx  # Campaign management
│   │   └── WhatsAppTemplateCreator.tsx  # Template management
│   ├── services/
│   │   ├── onboardingService.ts    # Onboarding API calls
│   │   └── authService.ts          # Authentication service
│   └── lib/validations.ts          # Form validation schemas

hotkup-api/          # Java Spring Boot backend
├── src/main/java/com/hotkup/api/
│   ├── platform/controller/        # REST controllers
│   ├── platform/service/           # Business logic services
│   ├── platform/service/impl/      # Service implementations
│   └── platform/config/            # Configuration classes
└── src/main/resources/
    ├── application.yml             # Main configuration
    └── db/migration/               # Database migrations
```

## 🔄 Complete Onboarding Flow

### Step 1: Admin Registration
**Endpoint:** `POST /api/v1/auth/admin/signup`

**Frontend Form:** `TenantSignupForm.tsx`

**Request Payload:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "username": "john.doe",
  "phone": "+1-555-0123",
  "organizationName": "Acme Corporation",
  "organizationCode": "acme_corp",
  "description": "Leading technology solutions provider",
  "subscriptionPlan": "PREMIUM",
  "agreeToTerms": true
}
```

**What Happens:**
- ✅ Admin user record created in platform database
- ✅ Organization record created
- ✅ Tenant database schema initialized (`tenant_acme_corp`)
- ✅ Email verification token generated
- ✅ Welcome email sent automatically

### Step 2: Email Verification
**Endpoint:** `POST /api/v1/auth/admin/verify-email`

**Frontend Form:** `EmailVerificationForm.tsx`

**Request Payload:**
```json
{
  "token": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**What Happens:**
- ✅ Email verification token validated
- ✅ Admin user status updated to `ACTIVE`
- ✅ Email verified flag set to `true`

### Step 3: Set Admin Password
**Endpoint:** `POST /api/v1/auth/admin/set-password`

**Frontend Form:** `SetPasswordForm.tsx`

**Request Payload:**
```json
{
  "token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**What Happens:**
- ✅ Password encrypted and stored using BCrypt
- ✅ Verification token cleared from database
- ✅ Admin account ready for login

### Step 4: Admin Login
**Endpoint:** `POST /api/v1/auth/signin`

**Frontend Form:** `LoginForm.tsx`

**Request Payload:**
```json
{
  "username": "john.doe",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "userInfo": {
    "id": 123,
    "username": "john.doe",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "phone": "+1-555-0123",
    "emailVerified": true,
    "roles": ["ADMIN"],
    "tenantCode": "acme_corp",
    "organizationName": "Acme Corporation"
  }
}
```

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/admin/signup` | Create admin user and organization |
| POST | `/api/v1/auth/admin/verify-email` | Verify admin email |
| POST | `/api/v1/auth/admin/set-password` | Set admin password |
| POST | `/api/v1/auth/signin` | Admin login |
| POST | `/api/v1/auth/signout` | Admin logout |

### Tenant Onboarding Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/tenants/onboard` | Complete tenant onboarding |
| POST | `/api/v1/admin/tenants/{tenantCode}/activate` | Activate tenant |
| GET | `/api/v1/admin/tenants/{tenantCode}/progress` | Get onboarding progress |
| POST | `/api/v1/admin/tenants/{tenantCode}/verify/email` | Verify email |
| POST | `/api/v1/admin/tenants/{tenantCode}/configuration/complete` | Complete configuration |

## ⚙️ Configuration

### Backend Configuration (`application.yml`)

#### Database Configuration
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/db_inspocrm
    username: postgres
    password: postgres
  redis:
    host: localhost
    port: 6379
```

#### Email Configuration
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: gentextestemail@gmail.com
    password: jiuy azex tbdy bjvn

app:
  email:
    from: noreply@inspocrm.com
    from-name: InspoCRM System
```

#### JWT Configuration
```yaml
app:
  jwt:
    secret: dev-only-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256!!!
    access-token:
      expiration-hours: 1
    refresh-token:
      expiration-days: 7
```

#### Tenant Onboarding Configuration
```yaml
tenant:
  onboarding:
    send-delayed-setup-email: true
    delayed-email-hours: 24
    callback-urls:
      base-url: http://localhost:3002
      email-verification: http://localhost:3002/verify-email
      password-reset: http://localhost:3002/reset-password
```

### Frontend Configuration (`.env`)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8081/inspocrm

# Frontend Configuration
VITE_FRONTEND_PORT=3002
VITE_FRONTEND_URL=http://localhost:3002

# Email Verification Callback URLs
VITE_EMAIL_VERIFICATION_URL=http://localhost:3002/verify-email
VITE_PASSWORD_RESET_URL=http://localhost:3002/reset-password

# Application Configuration
VITE_APP_NAME=InspoCRM
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

## 📧 Email Integration

### Email Templates

The system uses the following email templates:

1. **welcome-and-verification-email** - Sent after signup with verification link
2. **setup-guide-email** - Sent 24 hours after signup with setup instructions
3. **activation-confirmation-email** - Sent when tenant is activated

### Email Service Implementation

**Backend Email Service:** `EmailServiceImpl.java`
- Gmail SMTP integration
- Template processing with dynamic data
- Email logging for audit trails
- Error handling and retry logic

**Frontend Integration:**
- Automatic email verification token handling
- Seamless navigation between onboarding steps
- Real-time form validation

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Access (1 hour) + Refresh (7 days) tokens
- **Password Security**: BCrypt hashing, 12+ character requirement
- **Rate Limiting**: Redis-based rate limiting per tenant
- **Account Lockout**: Automatic lockout after failed attempts

### Data Protection
- **Multi-tenant Isolation**: Separate database schemas per organization
- **Audit Logging**: Complete activity tracking
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Comprehensive validation on all endpoints

### Email Security
- **Verification Tokens**: Time-limited tokens (24 hours)
- **Secure Callbacks**: HTTPS enforcement in production
- **Template Sanitization**: XSS protection in email templates

## 🛠️ Development Setup

### Environment Variables

#### Backend Environment Variables
```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/db_inspocrm
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-only-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256!!!

# Email
EMAIL_FROM=noreply@inspocrm.com
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=gentextestemail@gmail.com
SMTP_PASSWORD=jiuy azex tbdy bjvn

# Frontend URLs
CALLBACK_BASE_URL=http://localhost:3002
EMAIL_VERIFICATION_CALLBACK=http://localhost:3002/verify-email
```

#### Frontend Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:8081/inspocrm
VITE_FRONTEND_URL=http://localhost:3002
VITE_EMAIL_VERIFICATION_URL=http://localhost:3002/verify-email
```

### Database Setup

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE db_inspocrm;

-- Create user
CREATE USER postgres WITH PASSWORD 'postgres';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE db_inspocrm TO postgres;
```

#### Redis Setup
```bash
# Using Docker
docker run -d --name redis-inspocrm -p 6379:6379 redis:7-alpine

# Or using local Redis
redis-server --port 6379
```

## 🧪 Testing

### Manual Testing Steps

#### 1. Complete Onboarding Flow
```bash
# 1. Start services
cd inspo-crm-api && mvn spring-boot:run &
cd inspo-crm-web && npm run dev &

# 2. Test signup
curl -X POST http://localhost:8081/inspocrm/api/v1/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "username": "john.doe",
    "phone": "+1-555-0123",
    "organizationName": "Acme Corporation",
    "organizationCode": "acme_corp",
    "subscriptionPlan": "PREMIUM",
    "agreeToTerms": true
  }'

# 3. Check email (verification token will be in response)
# 4. Verify email
# 5. Set password
# 6. Login
```

#### 2. Frontend Testing
1. Open http://localhost:3002
2. Fill out the signup form
3. Check email for verification link
4. Complete email verification
5. Set password
6. Login to the application

### API Testing with Postman

Import the provided `postman.json` collection for comprehensive API testing:

```bash
# Import collection
# Run requests in order:
# 1. Admin Signup
# 2. Email Verification
# 3. Set Password
# 4. Admin Login
# 5. Complete Onboarding
```

## 🚨 Troubleshooting

### Common Issues

#### Issue 1: Email Verification Token Expired
**Solution:** Use `POST /api/v1/auth/admin/resend-verification` to get new token

#### Issue 2: CORS Errors
**Solution:** Ensure frontend URL is in CORS allowed origins:
```yaml
security:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3001,http://localhost:3002
```

#### Issue 3: Database Connection Failed
**Solution:** Check PostgreSQL is running and credentials are correct:
```bash
# Test connection
psql -h localhost -U postgres -d db_inspocrm
```

#### Issue 4: Email Not Sending
**Solution:** Check Gmail SMTP settings and app passwords:
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
```

#### Issue 5: JWT Token Expired
**Solution:** Implement refresh token logic or increase expiration time:
```yaml
app:
  jwt:
    access-token:
      expiration-hours: 24  # Increase for development
```

### Debug Mode

#### Enable Debug Logging
```yaml
logging:
  level:
    com.inspocrm.api: DEBUG
    org.springframework.web: DEBUG
    org.springframework.security: DEBUG
```

#### Check Application Health
```bash
# Health check endpoint
curl http://localhost:8081/inspocrm/actuator/health

# API docs
open http://localhost:8081/inspocrm/swagger-ui.html
```

## 📞 Support

For technical support:
- **Email**: support@inspocrm.com
- **Documentation**: https://docs.inspocrm.com
- **Community**: https://community.inspocrm.com

## 🔄 Next Steps

After completing the onboarding process:

1. **Explore CRM Features**: Access campaign management, lead tracking, analytics
2. **Configure Integrations**: Set up email, social media, and API connections
3. **Customize Dashboard**: Personalize views and reports
4. **Team Collaboration**: Set up internal communication and file sharing
5. **Training Resources**: Access help documentation and video tutorials

## 🎉 Congratulations!

Your InspoCRM tenant is now fully set up and ready for use. The implementation includes:

- ✅ **Complete onboarding flow** from signup to login
- ✅ **Email verification** with secure token handling
- ✅ **Password security** with enterprise-grade requirements
- ✅ **Multi-tenant architecture** with proper isolation
- ✅ **Production-ready security** features
- ✅ **Comprehensive documentation** and testing guides

**Welcome to HotKup!** 🚀

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project uses open-source dependencies. For a complete list of third-party software and their licenses, see [NOTICES.txt](NOTICES.txt).

All dependencies are:
- ✅ Open-source
- ✅ Free for commercial use
- ✅ Permissive licenses (MIT, Apache-2.0, ISC)
- ✅ No paid licenses required

For more information about legal compliance, see [LEGAL_COMPLIANCE_AUDIT.md](LEGAL_COMPLIANCE_AUDIT.md).
