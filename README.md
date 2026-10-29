<div align="center">

# CampusConnect

### Centralized Academic & College Club Event Management

A full-stack campus event platform that brings academic activities and club events into one place—with event approvals, venue conflict checks, QR attendance, and participation certificates.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[Overview](#project-overview) · [Features](#key-features) · [Setup](#installation-and-setup) · [API](#api-endpoints)

</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Objectives](#objectives)
4. [Key Features](#key-features)
5. [User Roles and Permissions](#user-roles-and-permissions)
6. [Technology Stack](#technology-stack)
7. [System Architecture and Application Workflow](#system-architecture-and-application-workflow)
8. [Project Folder Structure](#project-folder-structure)
9. [Prerequisites](#prerequisites)
10. [Installation and Setup](#installation-and-setup)
11. [Environment Variables](#environment-variables)
12. [Running the Application](#running-the-application)
13. [Database Configuration and Seeding](#database-configuration-and-seeding)
14. [API Endpoints](#api-endpoints)
15. [Authentication and Authorization](#authentication-and-authorization)
16. [Core Workflows](#core-workflows)
17. [Screenshots](#screenshots)
18. [Error Handling and Troubleshooting](#error-handling-and-troubleshooting)
19. [Future Enhancements](#future-enhancements)
20. [Team Contributions](#team-contributions)
21. [Contributing Guidelines](#contributing-guidelines)
22. [License](#license)
23. [Acknowledgements](#acknowledgements)

---

## Project Overview

CampusConnect is a monorepo web application that provides a centralized platform for managing college events. It brings together:

- **A React 19 + TypeScript frontend** (served on port 3000 via Vite) for interactive dashboards, a master campus calendar, event browsing, and role-specific actions.
- **A Node.js + Express + TypeScript backend** (served on port 4000) providing a RESTful API with JWT-based authentication, role-based access control (RBAC), event lifecycle management, venue conflict detection, and PDF/CSV export.
- **A MongoDB (Mongoose) database layer** with a seed script for development data.

---

## Problem Statement

College campuses often suffer from scattered event communication — club events advertised via WhatsApp, academic deadlines posted on notice boards, and venue bookings managed manually. This causes:

- Scheduling conflicts between club events and academic activities.
- Students missing events due to lack of a unified calendar.
- No structured approval process for club event proposals.
- Manual, error-prone attendance tracking.

---

## Objectives

- Provide a **single, role-aware calendar** that aggregates club and academic events.
- Implement a structured **event proposal → admin approval** pipeline.
- Enable **venue conflict detection** before events are approved.
- Support **QR-code-based attendance** tracking at events.
- Issue verifiable **participation certificates** to attendees.
- Provide club presidents with **registration export** (CSV and PDF).

---

## Key Features

| Feature | Status |
|---|---|
| Role-based dashboards (Student, President, Admin) | Implemented |
| Event creation and proposal submission | Implemented |
| Admin approval / rejection / request-changes workflow | Implemented |
| Master campus calendar with multi-filter support | Implemented |
| Venue management and conflict detection | Implemented |
| QR-code generation and scan-based attendance | Implemented |
| Event registration with capacity enforcement | Implemented |
| Registration export (CSV and PDF via PDFKit) | Implemented |
| Participation certificate issuance and verification | Implemented |
| In-app notification system with unread count | Implemented |
| Admin broadcast notifications to all users | Implemented |
| Secure JWT authentication with token expiry guard | Implemented |
| Password change, forgot-password, and reset flows | Implemented |
| Admin-issued temporary password with forced change | Implemented |
| Club membership and lead management | Implemented |
| Multi-day event support with correct past-event detection | Implemented |
| Recharts-based analytics in President dashboard | Implemented |
| Academic calendar view | Implemented |
| Dark mode UI | Implemented |

---

## User Roles and Permissions

### Student (`student`)

- Browse and search approved events on the campus calendar.
- Register for events (where registration is enabled).
- View personal registrations with QR pass.
- Cancel own registration.
- View and download participation certificates.
- Follow clubs and receive notifications.

### Club President (`president`)

- All Student permissions.
- Create and submit event proposals for admin approval.
- Update or cancel own club's events.
- Manage club members (add, update role, remove).
- View registered students for own club's events.
- Download registration lists as CSV or PDF.
- Mark attendance via QR scan.
- Issue certificates to attendees manually.
- View club analytics dashboard.

### College Admin (`college_admin`)

- All President permissions across all clubs.
- Approve, reject, or request changes on any event proposal.
- Broadcast system-wide notifications.
- Create and manage venues (add, update, toggle status, delete).
- Create and manage clubs (create, update, activate/deactivate).
- Issue password reset tokens for any user.
- View full user list.
- Override approval decisions.
- Access system settings view.

---

## Technology Stack

### Frontend

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.0.1 |
| Language | TypeScript | ~5.8.2 |
| Build Tool | Vite | ^6.2.3 |
| Styling | Tailwind CSS (via @tailwindcss/vite) | ^4.1.14 |
| Icons | Lucide React | ^0.546.0 |
| Animation | Motion (motion package) | ^12.23.24 |
| Charts | Recharts | ^3.10.1 |
| PDF Client | jsPDF + html2canvas | ^4.2.1 / ^1.4.1 |
| AI Integration | Google GenAI (@google/genai) | ^2.4.0 |
| Confetti | canvas-confetti | ^1.9.4 |
| Dev Proxy | Vite dev server -> http://localhost:4000 | -- |

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js (ESM) | -- |
| Framework | Express | ^4.21.2 |
| Language | TypeScript | ~5.8.2 |
| Database ODM | Mongoose | ^8.13.0 |
| Authentication | JSON Web Token (jsonwebtoken) | ^9.0.2 |
| Password Hashing | bcryptjs | ^3.0.3 |
| PDF Generation | PDFKit | ^0.20.2 |
| CORS | cors | ^2.8.6 |
| Environment | dotenv | ^17.2.4 |
| Dev Runner | tsx (watch mode) | ^4.21.0 |
| Test DB | mongodb-memory-server | ^10.1.4 |

### Database

| Layer | Technology |
|---|---|
| Database | MongoDB (local or MongoDB Atlas) |
| ODM | Mongoose ^8.13.0 |

---

## System Architecture and Application Workflow
```
+--------------------------------------------------+
|                 BROWSER (React SPA)              |
|   React 19 + TypeScript + Vite + TailwindCSS    |
|   Port 3000  (dev proxy -> backend :4000)        |
+----------------------+---------------------------+
                       |  HTTP  (Bearer JWT)
                       |  VITE_API_BASE_URL=/api
                       v
+--------------------------------------------------+
|          EXPRESS REST API  (Port 4000)           |
|                                                  |
|  Middleware chain:                               |
|    CORS -> JSON body parser -> requireAuth       |
|    -> requireRole -> Controller                  |
|                                                  |
|  Route groups:                                   |
|    /api/auth          /api/users                 |
|    /api/clubs         /api/events                |
|    /api/registrations /api/venues                |
|    /api/notifications /api/certificates          |
|    /health            /api/health                |
+----------------------+---------------------------+
                       |  Mongoose ODM
                       v
+--------------------------------------------------+
|            MONGODB  (local / Atlas)              |
|  Collections: users, events, clubs,              |
|  clubmemberships, venues, approvals,             |
|  eventregistrations, notifications,              |
|  certificates, departments                       |
+--------------------------------------------------+
```

**Typical event lifecycle:**

1. Club President creates an event proposal -> status `DRAFT` -> submits -> `PENDING_APPROVAL`.
2. Admin reviews: **Approve** (`APPROVED`), **Reject** (`REJECTED`), or **Request Changes** (`CHANGES_REQUESTED`).
3. Venue conflict is checked before approval (time-slot overlap on same venue).
4. Approved event appears on the campus calendar for all users.
5. Students register; QR pass generated per registration.
6. President or Admin scans QR at the event -> attendance marked `ATTENDED`.
7. Certificates issued manually by President/Admin after the event.

---

## Project Folder Structure
```
CampusConnect/                     <- Monorepo root
|-- package.json                   <- Root workspace scripts
|-- .gitignore
|-- README.md
|
|-- backend/                       <- Node.js / Express API
|   |-- package.json
|   |-- tsconfig.json
|   |-- .env.example
|   +-- src/
|       |-- server.ts              <- Entry point; starts HTTP server
|       |-- app.ts                 <- Express app factory; mounts all routes
|       |-- config/
|       |   +-- db.ts              <- MongoDB connection helper
|       |-- middleware/
|       |   |-- auth.middleware.ts <- JWT verify; status guards; mustChangePassword gate
|       |   +-- role.middleware.ts <- RBAC role enforcement
|       |-- models/                <- Mongoose schemas
|       |   |-- User.ts
|       |   |-- Club.ts
|       |   |-- ClubMembership.ts
|       |   |-- Department.ts
|       |   |-- Event.ts
|       |   |-- Approval.ts
|       |   |-- EventRegistration.ts
|       |   |-- Venue.ts
|       |   |-- Notification.ts
|       |   +-- Certificate.ts
|       |-- routes/
|       |   |-- auth.routes.ts
|       |   |-- user.routes.ts
|       |   |-- club.routes.ts
|       |   |-- clubMembership.routes.ts
|       |   |-- event.routes.ts
|       |   |-- registration.routes.ts
|       |   |-- venue.routes.ts
|       |   |-- notification.routes.ts
|       |   +-- certificate.routes.ts
|       |-- controllers/
|       |   |-- auth.controller.ts
|       |   |-- user.controller.ts
|       |   |-- club.controller.ts
|       |   |-- clubMembership.controller.ts
|       |   |-- event.controller.ts
|       |   |-- registration.controller.ts
|       |   |-- venue.controller.ts
|       |   |-- notification.controller.ts
|       |   +-- certificate.controller.ts
|       |-- utils/
|       |   |-- jwt.ts             <- Sign / verify JWT helpers
|       |   |-- password.ts        <- bcryptjs hash / compare
|       |   |-- eventTimeUtils.ts  <- Multi-day past-detection logic
|       |   |-- venueConflict.ts   <- Time-slot overlap checker
|       |   |-- notificationService.ts
|       |   |-- certificateService.ts
|       |   +-- registrationPdfService.ts <- PDFKit PDF builder
|       +-- scripts/
|           +-- seed.ts            <- Development seed data
|   +-- tests/                     <- Integration + E2E tests (tsx runner)
|
|-- frontend/                      <- React SPA
|   |-- package.json
|   |-- tsconfig.json
|   |-- vite.config.ts
|   |-- index.html
|   |-- .env.example
|   +-- src/
|       |-- main.tsx
|       |-- App.tsx                <- Tab router; modal orchestration
|       |-- types.ts               <- Shared TypeScript type definitions
|       |-- context/
|       |   +-- AppContext.tsx     <- Global state; API calls; user session
|       |-- utils/
|       |   |-- api.ts             <- Centralized fetch wrapper
|       |   |-- calendarUtils.ts   <- Date helpers; past-event detection
|       |   +-- filterUtils.ts     <- Multi-criteria event filter engine
|       +-- components/
|           |-- auth/
|           |-- layout/
|           |-- dashboard/
|           |-- calendar/
|           |-- events/
|           |-- clubs/
|           |-- venues/
|           |-- attendance/
|           |-- certificates/
|           |-- academic/
|           |-- admin/
|           |-- profile/
|           +-- common/
|
+-- database/                      <- Standalone DB layer with seed
    +-- CampusConnect_database_updated/
        |-- package.json
        |-- .env.example
        |-- seed.js
        +-- models/
```

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 18.x LTS or later | Runtime for backend and frontend build |
| npm | 9.x or later | Package manager |
| MongoDB | 6.x local OR MongoDB Atlas | Database |
| Git | Any recent version | Version control |

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/dakshata-here/CampusConnect.git
cd CampusConnect
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure backend environment variables
```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### 4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 5. Configure frontend environment variables
```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

---

## Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in the values:
```env
# TCP port the Express server listens on
PORT=4000
# MongoDB connection string (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/campusconnect
# JWT signing secret — use a strong, random value in production
JWT_SECRET=your_jwt_secret_key_here_change_in_production
# JWT token lifetime
JWT_EXPIRES_IN=7d
# Allowed CORS origin (frontend dev URL)
CLIENT_URL=http://localhost:5173
```

For **MongoDB Atlas**, use:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusconnect?retryWrites=true&w=majority
```

> **Security:** Never commit real secrets. The `.env` file is already listed in `.gitignore`.

---

### Frontend — `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env`:
```env
# Backend API base URL exposed to the React app
VITE_API_BASE_URL=http://localhost:4000/api
# Optional: Gemini AI API key (used by @google/genai)
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: Hosting URL for self-referential links
APP_URL=http://localhost:3000
```

> The Vite dev server also has a built-in proxy: all requests to `/api` are forwarded to `http://localhost:4000` automatically during development.

---

## Running the Application

### Start from the monorepo root
```bash
# Frontend only (port 3000)
npm run dev:frontend
# Backend only (port 4000, tsx watch)
npm run dev:backend
```

Or open two separate terminals:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

### Production build
```bash
# Build frontend (outputs to frontend/dist)
npm run build:frontend
# Build backend (TypeScript -> JavaScript in backend/dist)
npm run build:backend
# Start compiled backend
cd backend && npm start
```

---

## Database Configuration and Seeding

The backend connects to MongoDB on startup via `MONGODB_URI` in `backend/.env`. No manual setup is required beyond providing a valid connection string.

### Seed development data (backend)
```bash
cd backend
npm run seed
```

### Seed via the standalone database layer
```bash
cd database/CampusConnect_database_updated
npm install
cp .env.example .env
# Set MONGODB_URI in .env
npm run seed
```

### Demo credentials (development only)

> Change or remove these before any deployment.

| Role | Email | Password |
|---|---|---|
| College Admin | admin@college.edu | Admin@123 |
| Club President | president@college.edu | Admin@123 |
| Student | student@college.edu | Admin@123 |

---

## API Endpoints

All routes are prefixed with `/api`. Protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server health check |
| GET | `/api/health` | None | Server health check (API prefix) |

---

### Authentication — `/api/auth`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | None | -- | Register a new user account |
| POST | `/api/auth/login` | None | -- | Log in; returns JWT token |
| GET | `/api/auth/me` | Required | Any | Get authenticated user profile |
| POST | `/api/auth/logout` | None | -- | Log out (client-side token discard) |
| POST | `/api/auth/change-password` | Required | Any | Change own password |
| POST | `/api/auth/forgot-password` | None | -- | Initiate password reset |
| POST | `/api/auth/reset-password` | None | -- | Reset password with token |
| POST | `/api/auth/admin-issue-reset-token` | Required | Admin | Issue temp reset token for a user |

---

### Users — `/api/users`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/users/profile` | Required | Any | Get own profile |
| PUT | `/api/users/profile` | Required | Any | Update own profile fields |
| GET | `/api/users` | Required | Admin | List all users |

---

### Events — `/api/events`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/events` | Required | Any | List events (role-filtered) |
| GET | `/api/events/:id` | Required | Any | Get event by ID |
| POST | `/api/events` | Required | Admin, President | Create event proposal |
| PUT | `/api/events/:id` | Required | Admin, President | Update event |
| PATCH | `/api/events/:id/cancel` | Required | Admin, President | Cancel event |
| PATCH | `/api/events/:id/approve` | Required | Admin | Approve event |
| PATCH | `/api/events/:id/reject` | Required | Admin | Reject event |
| PATCH | `/api/events/:id/request-changes` | Required | Admin | Request revisions |
| GET | `/api/events/:id/approvals` | Required | Any | Get approval history |
| GET | `/api/events/:id/registrations` | Required | Admin, President | Get registered students |
| GET | `/api/events/:id/registrations/download` | Required | Admin, President | Download registrations (CSV) |
| GET | `/api/events/:id/registrations/download/pdf` | Required | Admin, President | Download registrations (PDF) |

**Event status lifecycle:** `DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` / `REJECTED` / `CHANGES_REQUESTED` -> `RESCHEDULED` / `CANCELLED` / `COMPLETED`

---

### Registrations — `/api/registrations`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/registrations/events/:eventId` | Required | Any | Register for an event |
| GET | `/api/registrations/my` | Required | Any | Get own registrations and QR passes |
| GET | `/api/registrations/events/:eventId` | Required | Admin, President | Get all registrations for event |
| POST | `/api/registrations/scan-qr` | Required | Admin, President | Scan QR code to mark attendance |
| PATCH | `/api/registrations/:id/attendance` | Required | Admin, President | Update attendance status manually |
| DELETE | `/api/registrations/:id` | Required | Any | Cancel registration |

**Attendance statuses:** `REGISTERED` -> `ATTENDED` / `NOT_ATTENDED`

---

### Venues — `/api/venues`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/venues` | Required | Any | List all venues |
| GET | `/api/venues/:id` | Required | Any | Get venue by ID |
| GET | `/api/venues/:id/schedule` | Required | Any | Get booked time slots |
| POST | `/api/venues/check-conflict` | Required | Any | Check for time-slot conflict |
| POST | `/api/venues` | Required | Admin | Create venue |
| PUT | `/api/venues/:id` | Required | Admin | Update venue |
| PATCH | `/api/venues/:id/status` | Required | Admin | Toggle operational status |
| DELETE | `/api/venues/:id` | Required | Admin | Delete venue |

**Venue operational statuses:** `OPERATIONAL` / `MAINTENANCE` / `UNAVAILABLE`

---

### Clubs — `/api/clubs`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/clubs` | Required | Any | List all clubs |
| GET | `/api/clubs/:id` | Required | Any | Get club by ID |
| POST | `/api/clubs` | Required | Admin | Create club |
| PUT | `/api/clubs/:id` | Required | Admin | Update club |
| PATCH | `/api/clubs/:id/status` | Required | Admin | Activate or deactivate club |
| GET | `/api/clubs/:clubId/members` | Required | Any | List club members |
| GET | `/api/clubs/:clubId/lead` | Required | Any | Get active club lead |
| POST | `/api/clubs/:clubId/members` | Required | Admin, President | Add member |
| PATCH | `/api/clubs/:clubId/members/:userId` | Required | Admin, President | Update member role |
| DELETE | `/api/clubs/:clubId/members/:userId` | Required | Admin, President | Remove member |

**Club categories:** `TECHNICAL` / `CULTURAL` / `SPORTS` / `ENTREPRENEURSHIP` / `OTHER`

---

### Notifications — `/api/notifications`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/notifications` | Required | Any | Get own notifications |
| GET | `/api/notifications/unread-count` | Required | Any | Get unread count |
| PATCH | `/api/notifications/mark-all-read` | Required | Any | Mark all as read |
| PATCH | `/api/notifications/:id/read` | Required | Any | Mark one as read |
| DELETE | `/api/notifications/:id` | Required | Any | Delete notification |
| POST | `/api/notifications/broadcast` | Required | Admin | Broadcast to all users |

---

### Certificates — `/api/certificates`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/certificates/verify/:code` | None | -- | Publicly verify certificate |
| GET | `/api/certificates/my` | Required | Any | Get own certificates |
| GET | `/api/certificates/events/:eventId` | Required | Admin, President | Get event certificates |
| GET | `/api/certificates/:id` | Required | Any | Get certificate by ID |
| POST | `/api/certificates/issue/:registrationId` | Required | Admin, President | Issue certificate manually |

---

## Authentication and Authorization

### JWT Authentication

- Tokens are signed using `jsonwebtoken` with the `JWT_SECRET` environment variable.
- Default lifetime: `7d` (set via `JWT_EXPIRES_IN`).
- Send token in every protected request header:
```
Authorization: Bearer <your_token>
```

### Token Validation Guards (`auth.middleware.ts`)

The `requireAuth` middleware enforces these checks in order:

1. **Token presence** — 401 if no token found.
2. **Token validity** — 401 if expired or malformed.
3. **User existence** — 401 if the account no longer exists.
4. **Account status** — 403 if account is `pending` or `rejected`.
5. **Password change invalidation** — 401 if token was issued before a password change.
6. **Mandatory password change gate** — 403 if `mustChangePassword: true` and the path is not `/change-password`, `/me`, or `/logout`.

### Role-Based Access Control

The `requireRole` middleware checks the user's role against one or more permitted roles:

| Role String | Enum Value |
|---|---|
| `college_admin` | `UserRole.COLLEGE_ADMIN` |
| `president` | `UserRole.CLUB_PRESIDENT` |
| `student` | `UserRole.STUDENT` |

---

## Core Workflows

### 1. Event Creation and Approval
```
President creates event (POST /api/events)
  -> status: DRAFT
  -> submits for review -> PENDING_APPROVAL
Admin reviews:
  -> Approve  (PATCH .../approve)          -> APPROVED
  -> Reject   (PATCH .../reject)           -> REJECTED
  -> Changes  (PATCH .../request-changes)  -> CHANGES_REQUESTED
On approval:
  -> Venue conflict check performed
  -> Approval record created in Approvals collection
  -> In-app notification sent to the Club President
```

### 2. Venue Conflict Detection

Before an event is approved the system checks:

- **Venue availability:** Is operationalStatus `OPERATIONAL` and isAvailable `true`?
- **Capacity:** Does maxParticipants exceed the venue's capacity?
- **Time-slot overlap:** Does [startTime, endTime] on that date overlap any already-approved event at the same venue?

Possible conflict types: `NOT_FOUND`, `VENUE_UNAVAILABLE`, `VENUE_MAINTENANCE`, `CAPACITY_EXCEEDED`, `TIME_CLASH`

### 3. Event Registration
```
Student calls POST /api/registrations/events/:eventId
  -> Duplicate check: unique index on (eventId, studentId)
  -> Capacity check: if maxParticipants set and currentRegistrations >= max -> rejected
  -> Deadline check: registrationDeadline must not have passed
  -> EventRegistration created with attendanceStatus: REGISTERED
  -> QR data included in the registration record
```

### 4. Attendance Tracking
```
At the event:
  QR scan:  POST /api/registrations/scan-qr
    -> Looks up registration by QR data
    -> Sets attendanceStatus: ATTENDED, attendedAt: <timestamp>
  Manual:   PATCH /api/registrations/:id/attendance
    -> Body: { "status": "ATTENDED" }  or  { "status": "NOT_ATTENDED" }
```

### 5. Certificate Issuance and Verification
```
After event:
  POST /api/certificates/issue/:registrationId
    -> Creates Certificate with unique certificateNumber
    -> Linked to registrationId, eventId, studentId
Public verification (no login required):
  GET /api/certificates/verify/:code
    -> Returns certificate metadata if valid
```

### 6. Past-Event Detection (Multi-Day Support)

`eventTimeUtils.ts` determines whether an event is in the past:

- **Multi-day events:** evaluated against `endDate` + `endTime`.
- **Single-day events:** evaluated against `date` + `endTime`.
- **Missing or invalid endTime:** safe fallback to 23:59:59.999 — today's events are never hidden prematurely.

---

## Screenshots

Screenshots have not yet been added to this repository. Placeholders are listed below. To contribute, add images to a `screenshots/` folder at the repository root and update the paths.

| View | File |
|---|---|
| Login Page | screenshots/login.png |
| Student Dashboard | screenshots/student-dashboard.png |
| President Dashboard | screenshots/president-dashboard.png |
| Admin Dashboard | screenshots/admin-dashboard.png |
| Master Campus Calendar | screenshots/calendar.png |
| Event Details Modal | screenshots/event-details.png |
| Create Event Form | screenshots/create-event.png |
| Approval Review | screenshots/approval-review.png |
| QR Scanner | screenshots/qr-scanner.png |
| Certificate Modal | screenshots/certificate.png |
| Venues Management | screenshots/venues.png |
| Club Directory | screenshots/clubs.png |

---

## Error Handling and Troubleshooting

### Centralized Error Handler (backend/src/app.ts)

| Error | HTTP Status | Description |
|---|---|---|
| Mongoose ValidationError | 400 | Field-level validation failures |
| Mongoose duplicate key (code 11000) | 409 | Unique constraint violation |
| JsonWebTokenError | 401 | Malformed or invalid JWT |
| TokenExpiredError | 401 | Expired JWT |
| Any other error | 500 | Internal server error |

### Common Issues

**ECONNREFUSED on port 4000**

The backend is not running. Start it with `npm run dev` inside `backend/`.

**MongoServerError: Authentication failed**

Check MONGODB_URI in `backend/.env`. Verify username, password, and cluster URL.

**401 Authentication required**

The JWT token is missing from the Authorization header. Check the frontend is sending `Bearer <token>`.

**403 Password change required**

The account has `mustChangePassword: true`. The user must change their password before using other features.

**403 Registration request is pending**

The account status is `pending`. A College Admin must approve it first.

**Frontend blank page after login**

Check browser console for errors. Confirm `VITE_API_BASE_URL` in `frontend/.env` points to the running backend.

**Unexpected venue conflict**

Use `POST /api/venues/check-conflict` to debug which event is overlapping. Also verify the venue `operationalStatus`.

**Backend test scripts fail**

Tests use `mongodb-memory-server`. Run `npm install` inside `backend/` first. An internet connection is required on first run to download the in-memory MongoDB binary.

---

## Future Enhancements

The following features are planned but not yet implemented:

- Email or SMS notification delivery (currently notifications are in-app only).
- External event registration QR scanning (model fields exist; delivery logic is not implemented).
- OAuth / SSO login (Google Workspace or college SSO).
- Recurring event support.
- Student club signup request workflow (ClubSignupRequest model exists in the database layer; no API is exposed yet).
- Automated bulk certificate issuance after event completion.
- Public event landing pages (no-login access).
- Browser or mobile push notifications.
- System-wide admin analytics dashboard.
- Docker and CI/CD deployment configuration.

---

## Team Contributions

Add verified team member names and their individual contributions here before publishing. Avoid listing responsibilities that have not been confirmed.

---

## Contributing Guidelines

1. Fork the repository and create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and ensure backend tests pass:
```bash
cd backend
npm test
```

3. Keep commits small and descriptive.
4. Do not commit `.env` files, `node_modules`, or any real credentials.
5. Open a Pull Request against `main` with a clear description of the change.
6. All PRs require at least one review before merging.

---

## License

No license file is currently present in this repository.

**Action required:** Add a `LICENSE` file to the repository root before making this project publicly available. Common choices for academic projects include the MIT License (https://opensource.org/licenses/MIT) or the Apache 2.0 License (https://www.apache.org/licenses/LICENSE-2.0).

---

## Acknowledgements

- MongoDB and Mongoose for the flexible document database layer.
- Express.js for the minimal and robust Node.js web framework.
- React and Vite for the fast and modern frontend toolchain.
- Tailwind CSS for utility-first styling.
- Lucide React for the icon set.
- Recharts for analytics charts in the President dashboard.
- PDFKit for server-side PDF generation.
- jsonwebtoken and bcryptjs for secure authentication.
- mongodb-memory-server for zero-configuration integration testing.
