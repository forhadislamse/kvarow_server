# Kvarow Backend Service API
### High-Performance RESTful API & Real-Time Socket.IO Engine for Mobile & Web Applications

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

Kvarow Server is a production-grade backend engine engineered to power the **Kvarow Skill Marketplace & Instructor Booking Platform** for mobile and web clients. The server handles secure user authentication, multi-role onboarding, skill cataloging, instructor availability scheduling, hourly booking orders, Stripe payments and transfers, real-time messaging via Socket.IO, and media file uploads.

---

## Architectural Overview

> Kvarow connects students with verified skill instructors for online and in-person learning sessions. The backend is designed around a modular, decoupled architecture using Node.js, Express.js, TypeScript, and Prisma ORM connected to a MongoDB database. It provides real-time WebSockets for chat communications, automated revenue commission splits via Stripe Connect, and dual-engine cloud media storage.

---

## Core Backend Modules

### Authentication & Multi-Role User Management
- Role-Based Access Control: Granular permissions for Student (`USER`), Instructor (`TEACHER`), and Administrator (`ADMIN`).
- JWT Security: Access token validation, refresh token rotation, and bcrypt password hashing.
- Account Verification: Email OTP verification for account signup and password reset.
- Profile Onboarding: Detailed profiles with skill levels (`BEGINNER`, `INTERMEDIATE`, `EXPERT`), location coordinates (`lat`/`lng`), and FCM push notification tokens.

### Skill Catalog & Instructor Scheduling
- Category Hierarchy: Categories, sub-categories, and individual skills with image icons.
- Instructor Profiles: Instructors can list skills with custom hourly rates, teaching modes (`ONLINE`, `IN_PERSON`, `BOTH`), and availability schedules.
- Marketplace Discovery: Filtering and search API by category, location, and rating.

### Booking Orders & Financial Operations
- Hourly Hiring Orders: End-to-end booking workflow for hiring instructors for specified training hours.
- Automated Platform Commission: Price calculations separating student payment amounts, teacher receipts, and platform commission.
- Stripe Connect & Webhooks: Stripe Payment Intents, Connect Express accounts, and webhook listeners for order processing.

### Real-Time Messaging & Notifications
- Socket.IO Chat Engine: 1-on-1 private rooms and group chat rooms with message history retrieval.
- Push & Email Dispatch: Firebase Cloud Messaging (FCM) push notifications paired with Brevo, SendGrid, and Nodemailer.

### Cloud Storage Services
- Dual Cloud Storage: DigitalOcean Spaces CDN integration alongside Cloudinary SDK for high-performance asset delivery.

---

## Technology Stack

| Domain | Technologies |
|---|---|
| **Runtime & Language** | Node.js, TypeScript |
| **API Framework** | Express.js |
| **Database & ORM** | MongoDB Atlas, Prisma ORM |
| **Real-Time Communication** | Socket.IO, WebSockets |
| **Payment Gateway** | Stripe SDK (Payment Intents & Connect Accounts) |
| **Media Storage** | DigitalOcean Spaces CDN, Cloudinary SDK |
| **Push & Email Services** | Firebase Admin (FCM), Brevo API, SendGrid, Nodemailer |
| **Security & Validation** | Zod Middleware, JWT, Bcrypt |

---

## Comprehensive API Endpoint Reference

### 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user or teacher account | No |
| POST | `/api/v1/auth/login` | Authenticate user & issue JWT tokens | No |
| POST | `/api/v1/auth/verify-otp` | Verify registration email OTP code | No |
| POST | `/api/v1/auth/resend-otp` | Resend verification OTP code | No |
| POST | `/api/v1/auth/forgot-password` | Request password reset OTP email | No |
| POST | `/api/v1/auth/reset-password` | Reset account password using reset token | No |
| POST | `/api/v1/auth/refresh-token` | Obtain new access token using refresh token | Yes |
| POST | `/api/v1/auth/change-password` | Change password for authenticated user | Yes |

### 2. User & Profile Management (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/users/profile` | Retrieve profile details of logged-in user | Yes |
| PATCH | `/api/v1/users/profile` | Update profile information, skills & location | Yes |
| GET | `/api/v1/users` | List all users (with search and role filters) | Admin |
| GET | `/api/v1/users/:id` | Fetch specific user details by ID | Yes |
| PATCH | `/api/v1/users/status/:id` | Update user account status (Active/Blocked) | Admin |
| DELETE | `/api/v1/users/:id` | Soft delete user account | Admin |

### 3. Skill Catalog & Categories (`/api/v1/categories`, `/sub-categories`, `/skills`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/categories` | Retrieve all skill categories | No |
| POST | `/api/v1/categories` | Create a new skill category | Admin |
| GET | `/api/v1/sub-categories` | List all sub-categories under a category | No |
| POST | `/api/v1/sub-categories` | Create a new sub-category | Admin |
| GET | `/api/v1/skills` | List all available skills | No |
| POST | `/api/v1/skills` | Create a new skill item | Admin |

### 4. Instructor Skill Publishing (`/api/v1/teaches`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/teaches` | Publish new teaching skill with hourly rate & schedule | Teacher |
| GET | `/api/v1/teaches` | List all teaching profiles (filterable by skill & mode) | No |
| GET | `/api/v1/teaches/my-skills` | Fetch teaching skills created by logged-in instructor | Teacher |
| PATCH | `/api/v1/teaches/:id` | Update hourly rate, availability, or teaching mode | Teacher |
| DELETE | `/api/v1/teaches/:id` | Remove a published teaching skill profile | Teacher |

### 5. Student Learning & Orders (`/api/v1/learn`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/learn/hire` | Create a booking order to hire an instructor | User |
| GET | `/api/v1/learn/my-orders` | Fetch orders placed by logged-in student | User |
| GET | `/api/v1/learn/instructor-orders` | Fetch booking orders received by instructor | Teacher |
| PATCH | `/api/v1/learn/orders/:id/status` | Update booking order status (Confirmed/Completed) | Yes |

### 6. Stripe Payments (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/payments/create-intent` | Initialize Stripe Payment Intent for order checkout | User |
| POST | `/api/v1/payments/webhook` | Stripe webhook listener for automated payment events | No |
| GET | `/api/v1/payments/history` | Retrieve user or instructor transaction history | Yes |

### 7. Reviews & Ratings (`/api/v1/reviews`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/reviews` | Submit rating & review for an instructor or student | Yes |
| GET | `/api/v1/reviews/:userId` | Get all reviews received by a user | No |

### 8. Student Practice Goals (`/api/v1/goals`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/goals` | Set a new monthly practice duration goal | User |
| GET | `/api/v1/goals` | Fetch practice goals for logged-in user | User |
| PATCH | `/api/v1/goals/:id` | Update goal progress and targets | User |

### 9. File Uploads (`/api/v1/file-uploads`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/file-uploads/upload` | Upload avatar or media to Cloud Storage (DO / Cloudinary) | Yes |

---

## Directory Structure

```
kvarow_server/
├── prisma/
│   └── schema.prisma          # Database schema & Prisma ORM models
├── src/
│   ├── app/
│   │   ├── middlewares/        # Auth, Zod validation, and error middlewares
│   │   ├── modules/            # Domain modules (Auth, User, Admin, FileUpload, etc.)
│   │   └── routes/             # Central API router registry
│   ├── helpars/                # JWT helpers, file uploaders, email senders
│   ├── shared/                 # Async error handlers & response wrappers
│   ├── app.ts                  # Express application setup
│   └── server.ts               # Server entry point & Socket.IO server initialization
├── .env                        # Local environment variables
├── .env.example                # Environment variables template
├── ecosystem.config.js         # PM2 process configuration
├── vercel.json                 # Deployment configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and npm scripts
```

---

## Getting Started

### 1. Environment Setup
Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Generation
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

The server will start at `http://localhost:13001`.

---

## Resources & Documentation

- **Local Server Base URL:** `http://localhost:13001/api/v1`
- **Postman API Documentation:** [View Postman Documentation](https://documenter.getpostman.com/view/34968572/2sBY4TpdM8)
- **Backend Server:** [https://kvarow-server.vercel.app/](https://kvarow-server.vercel.app/)

---

## License

Proprietary software developed for **Kvarow**. All rights reserved.
