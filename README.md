# Kvarow Server
### Real-Time Skill Marketplace & Instructor Booking Engine API

Kvarow Server is a high-performance RESTful API and real-time Socket server engineered with Node.js, Express.js, TypeScript, Prisma ORM, and MongoDB. It serves as the core backend operating system powering the Kvarow Mobile Application, enabling instructor discovery, skill cataloging, hourly booking management, Stripe payments, and real-time chat.

---

## Architectural Overview

> The Kvarow platform solves the challenge of finding verified skill instructors and scheduling hourly training sessions. The backend architecture provides role-based user onboarding, dynamic instructor availability scheduling, automated marketplace fee distribution via Stripe Connect, and instant WebSocket messaging.

---

## Core System Modules

### Authentication & Multi-Role User Management
- Role-Based Access Control: Supports Student (`USER`), Instructor (`TEACHER`), and Administrator (`ADMIN`) access tiers.
- Secure Authentication: JWT authentication with access token validation, refresh token rotation, and bcrypt password hashing.
- Account Onboarding: Verification workflows via email OTP for registration and password recovery.
- User Profile Management: Detailed profile management including skill proficiency levels (`BEGINNER`, `INTERMEDIATE`, `EXPERT`), location coordinates (`lat`/`lng`), and FCM push notification tokens.

### Skill Marketplace & Availability Engine
- Hierarchical Skill Catalog: Structured category, sub-category, and skill hierarchy management.
- Instructor Skill Profiles: Instructors can publish individual skills with hourly rates, teaching modes (`ONLINE`, `IN_PERSON`, `BOTH`), and weekly availability schedules.
- Marketplace Discovery: Search and filter API for finding instructors based on skills, location, and rating.

### Booking Orders & Stripe Financial Operations
- Hourly Hiring Orders: End-to-end booking lifecycle for hiring instructors for dedicated training hours.
- Admin Commission Split: Automated platform fee calculation separating student payments, instructor payouts, and platform earnings.
- Stripe Connect & Webhooks: Stripe Payment Intent processing and webhook listeners for order confirmations and payouts.

### Real-Time Socket.IO Messaging & Chat
- Private & Group Rooms: Socket.IO powered messaging system supporting 1-on-1 private rooms and group chats.
- Read Receipts & Logs: Real-time message status tracking, timestamping, and chat history retrieval.

### Goal Tracking & Review System
- Student Practice Goals: Goal tracking system allowing students to define monthly practice targets and duration goals.
- Verified Ratings & Reviews: Rating system enabling students and instructors to exchange 1-5 star reviews and comments.

### Cloud Media Storage & Multi-Channel Notifications
- DigitalOcean Spaces & Cloudinary: Dual-engine media storage setup delivering high-speed image and document CDN URLs.
- Push & Transactional Emails: Real-time push notifications via Firebase Cloud Messaging (FCM) combined with Brevo, SendGrid, and Nodemailer email integrations.

---

## Technology Stack

| Domain | Technologies |
|---|---|
| **Runtime & Language** | Node.js, TypeScript |
| **API Framework** | Express.js |
| **Database & ORM** | MongoDB Atlas, Prisma ORM |
| **Real-Time Communication** | Socket.IO, WebSockets |
| **Payment Gateway** | Stripe SDK (Payment Intents & Connect) |
| **Media Storage** | DigitalOcean Spaces CDN, Cloudinary SDK |
| **Push & Email Services** | Firebase Admin (FCM), Brevo API, SendGrid, Nodemailer |
| **Security & Validation** | Zod Middleware, JWT, Bcrypt |

---

## Directory Structure

```
kvarow_server/
├── prisma/
│   └── schema.prisma          # Database schema & Prisma models
├── src/
│   ├── app/
│   │   ├── middlewares/        # Authentication, Zod validation, error handling
│   │   ├── modules/            # Domain modules (Auth, User, Admin, FileUpload, etc.)
│   │   └── routes/             # Central API router registry
│   ├── helpars/                # JWT helpers, file uploaders, email senders
│   ├── shared/                 # Async error handlers & response formatting
│   ├── app.ts                  # Express application setup
│   └── server.ts               # Server entry point & Socket.IO server initialization
├── .env                        # Local environment variables
├── .env.example                # Environment variables template
├── ecosystem.config.js         # PM2 process management
├── vercel.json                 # Deployment configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## Installation & Setup

### 1. Prerequisites
- Node.js (v18.x or higher)
- MongoDB Atlas database cluster

### 2. Environment Configuration
Clone the repository and set up your local environment file:

```bash
cp .env.example .env
```

Fill in your MongoDB URI, JWT secrets, Stripe keys, and cloud storage credentials.

### 3. Install Dependencies
```bash
npm install
```

### 4. Prisma Client Generation
Generate Prisma client artifacts:

```bash
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

The server will start at `http://localhost:13001`.

---

## Links & API Resources

- **Local Base URL:** `http://localhost:13001/api/v1`
- **Postman API Documentation:** [View Postman Documentation](https://documenter.getpostman.com/view/34968572/2sBY4SLyYk)
- **Backend Repository:** [github.com/forhadislamse/kvarow_server](https://github.com/forhadislamse/kvarow_server)

---

## API Endpoint Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | User login and JWT token issuance |
| `POST` | `/api/v1/auth/register` | Register new student or instructor account |
| `POST` | `/api/v1/auth/verify-otp` | Verify registration email OTP |
| `GET` | `/api/v1/user/profile` | Fetch authenticated user profile |
| `PATCH` | `/api/v1/user/profile` | Update profile information and skills |
| `POST` | `/api/v1/orders/create` | Create new instructor booking order |
| `POST` | `/api/v1/payments/create-intent` | Initialize Stripe checkout payment intent |
| `POST` | `/api/v1/file-uploads/upload` | Upload avatar or media to Cloud Storage |

---

## License

Proprietary software developed for Kvarow. All rights reserved.
