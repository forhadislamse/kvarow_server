# Kvarow Server 🚀
### Real-Time Skill Marketplace & Instructor Booking Engine API

> **Kvarow Server** is a high-performance RESTful API and real-time Socket server engineered with **Node.js, Express.js, TypeScript, Prisma ORM, and MongoDB**. It serves as the core backend operating system powering the **Kvarow Mobile Application**, enabling seamless instructor discovery, skill cataloging, hourly booking management, Stripe payments, and real-time chat.

---

## 🌟 Key Architecture & Modules

### 🔐 Auth & Multi-Role User Management
- **Role-Based Access Control (RBAC):** Supports `USER` (Students), `TEACHER` (Instructors), and `ADMIN` access tiers.
- **Secure Authentication:** JWT authentication with access token expiration, refresh token rotation, and bcrypt password hashing.
- **OTP Verification & Password Reset:** Email OTP validation for account registration and password recovery workflows.
- **User Onboarding & Profile:** Customizable user profiles with skill levels (`BEGINNER`, `INTERMEDIATE`, `EXPERT`), location coordinates (`lat`/`lng`), and FCM push tokens.

### 📚 Skill Marketplace & Availability Engine
- **Hierarchical Skill Catalog:** Managed categories, sub-categories, and skills with image icons.
- **Instructor Profiles:** Instructors can publish teaching skills with hourly rates, teaching mode (`ONLINE`, `IN_PERSON`, `BOTH`), and availability schedules.
- **Skill Search & Filtering:** Fast keyword search and filter system for skill learners.

### 💳 Orders, Bookings & Stripe Integration
- **Hourly Hiring Orders:** Booking system allowing students to hire instructors for specific hours with automated cost calculations.
- **Admin Revenue Commission:** Automated platform fee calculation separating student payment amounts, teacher earnings, and admin revenue.
- **Stripe Connect & Webhooks:** Stripe Payment Intent processing and webhook listeners for automated order confirmation and payout distributions.

### 💬 Real-Time Socket.IO Messaging & Chat
- **Private & Group Rooms:** Socket.IO powered messaging system supporting 1-on-1 private rooms and group chats.
- **Read Receipts & Delivery Logs:** Real-time message status tracking (`isRead`), timestamping, and chat history preservation.

### 🎯 Goal Tracking & Review System
- **Practice Goals:** Goal tracking system for students to set target practice months and daily/weekly duration targets.
- **Ratings & Reviews:** Verified review system allowing students and instructors to exchange 1-5 star ratings and feedback.

### ☁️ Cloud Media Storage & Notifications
- **DigitalOcean Spaces CDN & Cloudinary:** Dual-engine cloud storage integration for fast image and document CDN delivery.
- **Multi-Channel Notifications:** Real-time push notifications powered by Firebase Cloud Messaging (FCM) and email notifications via SendGrid, Brevo, and Nodemailer.

---

## 🛠️ Technology Stack

| Domain | Technology / Library |
|---|---|
| **Runtime & Language** | Node.js, TypeScript |
| **Framework & Router** | Express.js |
| **Database & ORM** | MongoDB Atlas, Prisma ORM |
| **Real-Time Communication** | Socket.IO, WebSockets |
| **Payment Gateway** | Stripe SDK (Payment Intents & Connect) |
| **Media Storage** | DigitalOcean Spaces CDN, Cloudinary SDK |
| **Push & Email Services** | Firebase Admin (FCM), Brevo API, SendGrid SMTP, Nodemailer |
| **Validation & Security** | Zod Middleware, JWT, Bcrypt |

---

## 📂 Directory Structure

```
kvarow_server/
├── prisma/
│   └── schema.prisma          # Database models & Prisma ORM configuration
├── src/
│   ├── app/
│   │   ├── middlewares/        # Auth, Zod validation, and error middlewares
│   │   ├── modules/            # Domain modules (Auth, User, Admin, FileUpload, etc.)
│   │   └── routes/             # Central API router registry
│   ├── helpars/                # JWT helpers, file uploaders, email senders
│   ├── shared/                 # Async error handlers & response wrappers
│   ├── app.ts                  # Express application setup
│   └── server.ts               # Server entry point & Socket.IO server initialization
├── .env                        # Local environment variables (git-ignored)
├── .env.example                # Environment variables template
├── ecosystem.config.js         # PM2 deployment configuration
├── vercel.json                 # Vercel serverless deployment settings
├── tsconfig.json               # TypeScript configuration
└── package.json                # Node.js dependencies & scripts
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm** or **yarn**
- **MongoDB Atlas** database cluster

### 2. Environment Setup
Clone the repository and create your local `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your database connection string, JWT secrets, Stripe keys, and Cloud storage API credentials in `.env`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Prisma Database Sync
Generate Prisma client artifacts and sync with your MongoDB database:

```bash
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

The server will start locally at `http://localhost:13001`.

---

## 🔗 Links & Resources

- **Local API Base URL:** `http://localhost:13001/api/v1`
- **Postman API Documentation:** [View Postman Documentation](https://documenter.getpostman.com/view/34968572/2sBY4SLyYk)
- **Backend Repository:** [github.com/forhadislamse/kvarow_server](https://github.com/forhadislamse/kvarow_server)

---

## 📡 API Endpoint Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | User authentication & JWT token generation |
| `POST` | `/api/v1/auth/register` | Register new student or teacher account |
| `POST` | `/api/v1/auth/verify-otp` | Verify email OTP code |
| `GET` | `/api/v1/user/profile` | Retrieve authenticated user profile |
| `PATCH` | `/api/v1/user/profile` | Update user profile & skills |
| `POST` | `/api/v1/orders/create` | Create new instructor booking order |
| `POST` | `/api/v1/payments/create-intent` | Generate Stripe checkout payment intent |
| `POST` | `/api/v1/file-uploads/upload` | Upload avatar/document to Cloud Storage |

---

## 🛡️ License

This project is proprietary software developed for **Kvarow**. All rights reserved.
