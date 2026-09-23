# College Calendar Backend Database

MongoDB + Mongoose database layer for the Centralized College Calendar and Club Management System.

## Contents

- 13 Mongoose models
- MongoDB connection helper
- `.env.example`
- `package.json`
- `seed.js` with demo departments, users, venues, and club

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI`.
3. Install dependencies:

```bash
npm install
```

4. Seed demo data:

```bash
npm run seed
```

## Demo credentials

- Admin: `admin@college.edu` / `Admin@123`
- Club President: `president@college.edu` / `Admin@123`
- Student: `student@college.edu` / `Admin@123`
- Club ID: `CLUB001`

These are development-only demo credentials. Change/remove them before deployment.

## Models

1. User
2. Department
3. Club
4. ClubSignupRequest
5. ClubMembership
6. Venue
7. Event
8. Approval
9. EventRegistration
10. Notification
11. Reminder
12. EventHistory
13. AcademicEvent

## Important

This folder contains the database layer, not the complete backend API. Controllers, routes, authentication, authorization, notification delivery, capacity checks, and venue conflict checks should be implemented in the main backend.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fea98be0-7b20-4e00-9ac8-fffb4d0fe9a5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
