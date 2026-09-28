# CampusConnect — Member 2 Backend API Specification

This document defines the complete and verified API contract implemented by **Member 2 (Backend Management)**.

---

## 1. Authentication & Role Definitions

### Global Authentication Roles (`User.role`)
- `college_admin`: College administrator with full system-wide permissions.
- `president`: Club President account.
- `student`: Standard student user.

### Club Membership Roles (`ClubMembership.role`)
- `LEAD`: Active leader/president of a specific club.
- `MEMBER`: General member of a club.

> **Authorization Rule:** A user with authentication role `president` is only authorized to manage a specific club's members and events if they hold an active `ClubMembership` record with `role = 'LEAD'` and `isActive = true` for that target club (`clubId`).

### Authentication Header
All protected endpoints require a valid JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

---

## 2. API Endpoints Inventory

### A. Authentication & User Profile APIs (`/api/auth`, `/api/users`)

#### 1. Register User
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "name": "Alex Smith",
    "email": "alex.smith@college.edu",
    "password": "Password@123",
    "role": "student",
    "department": "Computer Science",
    "enrollmentNumber": "CS2026001"
  }
  ```
- **Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "token": "...",
    "user": { "id": "...", "name": "Alex Smith", "email": "alex.smith@college.edu", "role": "student", "department": "Computer Science", "status": "active" }
  }
  ```
- **Common Errors:** `400 Bad Request` (validation/format), `409 Conflict` (duplicate email/enrollment number).

#### 2. Login User
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "alex.smith@college.edu",
    "password": "Password@123"
  }
  ```
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "...",
    "user": { "id": "...", "name": "Alex Smith", "email": "alex.smith@college.edu", "role": "student" }
  }
  ```
- **Common Errors:** `400 Bad Request` (missing credentials), `401 Unauthorized` (invalid email or password).

#### 3. Get Current User (`/me`)
- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Auth:** Authenticated (`student`, `president`, `college_admin`)
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
  }
  ```
- **Common Errors:** `401 Unauthorized`.

#### 4. Logout User
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Auth:** Public
- **Success (200 OK):** `{ "success": true, "message": "Logged out successfully." }`

#### 5. Get User Profile
- **Method:** `GET`
- **Endpoint:** `/api/users/profile`
- **Auth:** Authenticated
- **Success (200 OK):** `{ "success": true, "user": { ... } }`

#### 6. Update User Profile
- **Method:** `PUT`
- **Endpoint:** `/api/users/profile`
- **Auth:** Authenticated
- **Request Body:** `{ "name": "...", "department": "...", "bio": "...", "phone": "...", "avatar": "..." }`
- **Success (200 OK):** `{ "success": true, "message": "Profile updated successfully.", "user": { ... } }`

#### 7. Get All Users
- **Method:** `GET`
- **Endpoint:** `/api/users`
- **Auth:** `college_admin` only
- **Success (200 OK):** `{ "success": true, "count": 12, "users": [ ... ] }`
- **Common Errors:** `403 Forbidden` (non-admin).

---

### B. Club Management APIs (`/api/clubs`)

#### 1. List All Clubs
- **Method:** `GET`
- **Endpoint:** `/api/clubs`
- **Auth:** Authenticated (`student`, `president`, `college_admin`)
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "count": 5,
    "clubs": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Coding Club",
        "shortName": "CC",
        "description": "Official programming and dev club",
        "category": "TECHNICAL",
        "status": "ACTIVE",
        "socialLinks": { "website": "https://codingclub.edu" }
      }
    ]
  }
  ```

#### 2. Get Club by ID
- **Method:** `GET`
- **Endpoint:** `/api/clubs/:id`
- **Auth:** Authenticated
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "club": { "id": "...", "name": "...", "category": "TECHNICAL", "status": "ACTIVE", ... },
    "lead": { "userId": "...", "name": "...", "email": "...", "designation": "President" }
  }
  ```
- **Common Errors:** `400 Bad Request` (invalid ObjectId), `404 Not Found`.

#### 3. Create Club
- **Method:** `POST`
- **Endpoint:** `/api/clubs`
- **Auth:** `college_admin` only
- **Request Body:**
  ```json
  {
    "name": "Robotics Club",
    "shortName": "RC",
    "description": "Hardware and robotics enthusiasts",
    "category": "TECHNICAL",
    "status": "ACTIVE"
  }
  ```
- **Success (201 Created):** `{ "success": true, "message": "Club created successfully.", "club": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden` (non-admin), `409 Conflict` (duplicate club name).

#### 4. Update Club
- **Method:** `PUT`
- **Endpoint:** `/api/clubs/:id`
- **Auth:** `college_admin` only
- **Request Body:** `{ "description": "Updated description", "logoUrl": "...", "socialLinks": { ... } }`
- **Success (200 OK):** `{ "success": true, "message": "Club updated successfully.", "club": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

#### 5. Update Club Status
- **Method:** `PATCH`
- **Endpoint:** `/api/clubs/:id/status`
- **Auth:** `college_admin` only
- **Request Body:** `{ "status": "INACTIVE" }`
- **Success (200 OK):** `{ "success": true, "message": "Club status updated successfully.", "club": { ... } }`
- **Common Errors:** `400 Bad Request` (invalid status enum), `403 Forbidden`, `404 Not Found`.

---

### C. Club Membership & Lead Management APIs (`/api/clubs/:clubId/members`, `/api/clubs/:clubId/lead`)

#### 1. Get Club Members
- **Method:** `GET`
- **Endpoint:** `/api/clubs/:clubId/members`
- **Auth:** Authenticated (`student`, `president`, `college_admin`)
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "count": 4,
    "members": [
      {
        "id": "...",
        "userId": { "id": "...", "name": "Aditya Sharma", "email": "aditya@college.edu", "role": "president" },
        "clubId": "...",
        "role": "LEAD",
        "designation": "President",
        "isActive": true
      }
    ]
  }
  ```

#### 2. Get Active Club Lead
- **Method:** `GET`
- **Endpoint:** `/api/clubs/:clubId/lead`
- **Auth:** Authenticated
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "lead": {
      "membershipId": "...",
      "role": "LEAD",
      "designation": "President",
      "user": { "id": "...", "name": "Aditya Sharma", "email": "aditya@college.edu" }
    }
  }
  ```
- **Common Errors:** `404 Not Found` (if club has no active lead).

#### 3. Add Club Member / Assign Lead
- **Method:** `POST`
- **Endpoint:** `/api/clubs/:clubId/members`
- **Auth:** `college_admin` OR active `LEAD` of `:clubId`
- **Request Body:**
  ```json
  {
    "userId": "60d0fe4f5311236168a109cb",
    "role": "MEMBER",
    "designation": "Technical Coordinator"
  }
  ```
  *(Note: Setting `role: "LEAD"` automatically demotes the previous active lead to `MEMBER` ensuring single active lead invariant).*
- **Success (201 Created):** `{ "success": true, "message": "Member added successfully.", "member": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden` (unauthorized user or lead of different club), `404 Not Found`, `409 Conflict` (duplicate member).

#### 4. Update Club Member / Promote Lead
- **Method:** `PATCH`
- **Endpoint:** `/api/clubs/:clubId/members/:userId`
- **Auth:** `college_admin` OR active `LEAD` of `:clubId`
- **Request Body:**
  ```json
  {
    "role": "LEAD",
    "designation": "Club President",
    "isActive": true
  }
  ```
- **Success (200 OK):** `{ "success": true, "message": "Membership updated successfully.", "member": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

#### 5. Remove / Deactivate Club Member
- **Method:** `DELETE`
- **Endpoint:** `/api/clubs/:clubId/members/:userId`
- **Auth:** `college_admin` OR active `LEAD` of `:clubId`
- **Success (200 OK):** `{ "success": true, "message": "Club member deactivated successfully.", "member": { ... } }`
- **Common Errors:** `403 Forbidden`, `404 Not Found`.

---

### D. Event CRUD & Management APIs (`/api/events`)

#### 1. List Events
- **Method:** `GET`
- **Endpoint:** `/api/events`
- **Auth:** Authenticated (`student`, `president`, `college_admin`)
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "count": 8,
    "events": [
      {
        "id": "...",
        "title": "Annual Hackathon 2026",
        "eventType": "Hackathon",
        "category": "CLUB",
        "date": "2026-11-20T00:00:00.000Z",
        "startTime": "09:00 AM",
        "endTime": "06:00 PM",
        "status": "APPROVED",
        "clubId": { "id": "...", "name": "Coding Club", "shortName": "CC" },
        "venueId": { "id": "...", "name": "Main Auditorium", "capacity": 500 },
        "proposedBy": { "id": "...", "name": "Aditya Sharma", "email": "aditya@college.edu" }
      }
    ]
  }
  ```

#### 2. Get Event Details
- **Method:** `GET`
- **Endpoint:** `/api/events/:id`
- **Auth:** Authenticated
- **Success (200 OK):** `{ "success": true, "event": { ... } }`
- **Common Errors:** `400 Bad Request`, `404 Not Found`.

#### 3. Create Event
- **Method:** `POST`
- **Endpoint:** `/api/events`
- **Auth:** `college_admin` OR `president` (Active `LEAD` of target `clubId`)
- **Request Body:**
  ```json
  {
    "title": "AI & ML Masterclass",
    "eventType": "Workshop",
    "category": "CLUB",
    "clubId": "60d0fe4f5311236168a109ca",
    "venueId": "60d0fe4f5311236168a109cd",
    "date": "2026-11-25",
    "startTime": "10:00 AM",
    "endTime": "01:00 PM",
    "shortDescription": "Introduction to neural networks",
    "maxParticipants": 100,
    "registrationRequired": true,
    "registrationMethod": "CAMPUSCONNECT"
  }
  ```
  *(Note: `proposedBy` is automatically assigned from `req.user._id` and client overrides are ignored).*
- **Success (201 Created):** `{ "success": true, "message": "Event created successfully.", "event": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden` (student, or president who is not active lead of `clubId`, or president attempting academic event), `404 Not Found` (invalid club/venue).

#### 4. Update Event
- **Method:** `PUT`
- **Endpoint:** `/api/events/:id`
- **Auth:** `college_admin` OR active `LEAD` of the event's `clubId`
- **Request Body:** `{ "title": "Updated Title", "maxParticipants": 150, "agenda": "...", ... }`
- **Success (200 OK):** `{ "success": true, "message": "Event updated successfully.", "event": { ... } }`
- **Common Errors:** `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

#### 5. Cancel Event
- **Method:** `PATCH`
- **Endpoint:** `/api/events/:id/cancel`
- **Auth:** `college_admin` OR active `LEAD` of the event's `clubId`
- **Request Body:** `{ "reason": "Postponed due to college festival" }`
- **Success (200 OK):** `{ "success": true, "message": "Event cancelled successfully.", "event": { ..., "status": "CANCELLED" } }`
- **Common Errors:** `403 Forbidden`, `404 Not Found`.

---

### E. Admin Approval / Rejection Workflow APIs (`/api/events/:id/*`)

#### 1. Admin Approve Event
- **Method:** `PATCH`
- **Endpoint:** `/api/events/:id/approve`
- **Auth:** `college_admin` only
- **Request Body:** `{ "comments": "Approved for main auditorium" }`
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Event approved successfully.",
    "event": { "id": "...", "status": "APPROVED", ... },
    "approval": { "id": "...", "eventId": "...", "reviewedBy": "...", "action": "APPROVED", "comments": "Approved for main auditorium" }
  }
  ```
- **Common Errors:** `400 Bad Request` (cannot approve `CANCELLED`, `COMPLETED`, or already `APPROVED` events), `403 Forbidden` (non-admin), `404 Not Found`.

#### 2. Admin Reject Event
- **Method:** `PATCH`
- **Endpoint:** `/api/events/:id/reject`
- **Auth:** `college_admin` only
- **Request Body:** `{ "reason": "Schedule clashes with semester exams" }`
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Event rejected successfully.",
    "event": { "id": "...", "status": "REJECTED", "rejectionReason": "Schedule clashes with semester exams", ... },
    "approval": { "id": "...", "action": "REJECTED", "comments": "Schedule clashes with semester exams" }
  }
  ```
- **Common Errors:** `400 Bad Request` (cannot reject `CANCELLED`, `COMPLETED`, or already `REJECTED` events), `403 Forbidden`, `404 Not Found`.

#### 3. Admin Request Changes
- **Method:** `PATCH`
- **Endpoint:** `/api/events/:id/request-changes`
- **Auth:** `college_admin` only
- **Request Body:** `{ "comments": "Please update speaker profile and budget details" }` *(Required)*
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Changes requested for event successfully.",
    "event": { "id": "...", "status": "CHANGES_REQUESTED", "changeComments": "Please update speaker profile and budget details", ... },
    "approval": { "id": "...", "action": "CHANGES_REQUESTED", "comments": "Please update speaker profile and budget details" }
  }
  ```
- **Common Errors:** `400 Bad Request` (missing comments or invalid state transition), `403 Forbidden`, `404 Not Found`.

#### 4. Get Event Approval History
- **Method:** `GET`
- **Endpoint:** `/api/events/:id/approvals`
- **Auth:** Authenticated (`student`, `president`, `college_admin`)
- **Success (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "approvals": [
      {
        "id": "...",
        "eventId": "...",
        "reviewedBy": { "id": "...", "name": "Dean Admin", "email": "admin@college.edu", "role": "college_admin" },
        "action": "APPROVED",
        "comments": "Approved for main auditorium",
        "reviewedAt": "2026-11-01T10:00:00.000Z"
      }
    ]
  }
  ```
- **Common Errors:** `400 Bad Request`, `404 Not Found`.

---

## 3. Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional descriptive message",
  "data_key": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### Status Code Standards
- `200 OK`: Successful read or update.
- `201 Created`: Successful creation.
- `400 Bad Request`: Validation failure, invalid ID format, or invalid state transition.
- `401 Unauthorized`: Missing, expired, or invalid JWT token.
- `403 Forbidden`: Insufficient role or unauthorized club/event management.
- `404 Not Found`: Resource (User, Club, Event, Venue, Membership) does not exist.
- `409 Conflict`: Unique constraint violation (e.g. email, club name, duplicate membership).
- `500 Internal Server Error`: Unexpected unhandled error.
