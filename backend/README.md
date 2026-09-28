# CampusConnect Authentication & Authorization Backend

Enterprise-grade Authentication and Role-Based Access Control (RBAC) backend service for the **CampusConnect** Centralized College Calendar and Club Management System.

Built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB (Mongoose)**, **JWT**, and **bcryptjs**.

---

## 1. Project Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts               # Mongoose database connection and teardown logic
│   ├── controllers/
│   │   └── auth.controller.ts  # Handlers for register, login, me, and logout
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification and user hydration (requireAuth)
│   │   └── role.middleware.ts  # Server-side RBAC guard (requireRole)
│   ├── models/
│   │   └── User.ts             # Mongoose User model with password hashing and schema validation
│   ├── routes/
│   │   └── auth.routes.ts      # Auth REST endpoints and RBAC test routes
│   ├── scripts/
│   │   └── seed.ts             # Seeder for demo admin, club president, and student accounts
│   ├── utils/
│   │   ├── jwt.ts              # JWT signing, verification, and token utilities
│   │   └── password.ts         # bcryptjs password hashing and verification
│   ├── app.ts                  # Express application setup, CORS, JSON parsing, error handlers
│   └── server.ts               # Server entry point listening on configured PORT
├── tests/
│   └── auth.test.ts            # Automated test suite covering all 13 required auth & RBAC scenarios
├── .env.example                # Example configuration file
├── .gitignore                  # Git ignore rules for node_modules, dist, and .env
├── package.json                # Project manifest and dependencies
├── tsconfig.json               # Strict TypeScript compiler options
└── README.md                   # Backend documentation
```

---

## 2. Allowed Roles & Policies

The backend strictly supports **only three roles**:

| Allowed Role | Normalized Value | Description |
|---|---|---|
| **College Admin** | `college_admin` | Institutional administration, event approval, and system governance |
| **Club President** | `president` | Club lead managing club events, proposals, and club profile |
| **Student** | `student` | General campus student exploring events, registrations, and clubs |

> **Note on `subhead` (Club Subhead):**  
> Per project requirements, the `subhead` role is completely omitted. Any registration or login specifying `subhead` is rejected with `HTTP 400 Bad Request`.

---

## 3. Authentication & Authorization APIs

Base URL: `http://localhost:4000/api/auth`

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Aarav Patel",
    "email": "aarav.student@pict.edu",
    "password": "Password@123",
    "role": "student",
    "enrollmentNumber": "C2K2310001",
    "department": "Computer Engineering",
    "year": "TE (3rd Year)",
    "phone": "9876543210"
  }
  ```
- **Responses**:
  - `201 Created`: User created, returns `{ success: true, token, user }`
  - `400 Bad Request`: Missing fields, invalid email format, weak password, or unallowed role
  - `409 Conflict`: Email or Student PRN / Employee ID already registered

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Supports login with either **Email** OR **Enrollment Number / Student PRN / Employee ID**.
- **Request Body**:
  ```json
  {
    "identifier": "C2K2310001",
    "password": "Password@123",
    "role": "student"
  }
  ```
- **Responses**:
  - `200 OK`: Successful authentication, returns `{ success: true, token, user }`
  - `400 Bad Request`: Missing identifier or password
  - `401 Unauthorized`: Invalid credentials or incorrect password
  - `403 Forbidden`: Account status is `pending` or `rejected`

### 3. Get Current Logged-in User
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`Authorization: Bearer <token>`)
- **Responses**:
  - `200 OK`: Returns sanitized user profile (never exposes password)
  - `401 Unauthorized`: Missing, invalid, or expired JWT

### 4. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public / Authenticated
- **Responses**:
  - `200 OK`: Returns `{ success: true, message: "Logged out successfully." }`

### 5. RBAC Route Verification
- `GET /api/auth/test/admin` — Protected by `requireRole('college_admin')`
- `GET /api/auth/test/president` — Protected by `requireRole('president')`
- `GET /api/auth/test/student` — Protected by `requireRole('student')`

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or higher, tested on v24.18)
- npm (v9 or higher)
- MongoDB instance (local or MongoDB Atlas connection string)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (do NOT commit `.env` to Git):
```bash
cp .env.example .env
```
Populate your environment variables:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=your_strong_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 3. Build & Type Check
```bash
npm run lint   # Run TypeScript type check (tsc --noEmit)
npm run build  # Compile TypeScript to dist/
```

### 4. Seed Demo Users
Populates initial demo accounts (`admin@college.edu`, `president@college.edu`, `student@college.edu`):
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Run Automated Test Suite
Executes the comprehensive in-memory test suite verifying all 13 validation and RBAC scenarios:
```bash
npm test
```
