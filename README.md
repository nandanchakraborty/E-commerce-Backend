# E-Commerce Backend API

A production-ready E-Commerce Backend built with Node.js, Express.js, PostgreSQL, Prisma ORM, JWT Authentication, Stripe Payments, Swagger Documentation, and Zod Validation.

## Features

### Authentication & Authorization

* User Registration with Email OTP Verification
* User Login with JWT Access Token
* Role-Based Authorization (Admin/User)
* Password Hashing using bcrypt
* Protected Routes using JWT Middleware

### Product Management

* Create Product (Admin)
* Update Product (Admin)
* Delete Product (Admin)
* Get All Products
* Get Product by ID
* Category-wise Product Management

### Cart Management

* Add Product to Cart
* Update Cart Quantity
* Remove Product from Cart
* Get User Cart

### Order Management

* Create Order
* Get User Orders
* Get Single Order
* Cancel Order
* Automatic Stock Restoration on Order Cancellation

### Payment Integration

* Stripe Checkout Session
* Stripe Webhook Integration
* Payment Status Tracking
* Idempotency Key Storage
* Stripe Payment Intent Tracking
* Automatic Order Status Update after Successful Payment

### Review System

* Create Review
* Update Review
* Delete Review
* Product Review Listing
* Review Allowed Only for Purchased Products
* One Review per User per Product

### Email Notifications

* OTP Verification Email
* Payment Success Email
* Order Status Notification Email
* Order Cancellation Email

### Admin Dashboard APIs

* Total Users
* Total Orders
* Total Revenue
* Total Products
* Recent Orders
* Order Management
* Review Management

### API Documentation

* Swagger UI Documentation
* Request/Response Examples
* Authorization Support

### Validation

* Zod Schema Validation
* Request Body Validation
* Error Handling

---

# Technologies Used

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL
* Prisma ORM

## Authentication

* JWT
* bcrypt

## Payments

* Stripe Checkout
* Stripe Webhooks

## Validation

* Zod

## Documentation

* Swagger

## Email Service

* Nodemailer

---

# Project Structure

```bash
E-COMMERCE-BACKEND
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│
├── src/
│   │
│   ├── config/
│   │   ├── config.js
│   │   ├── prisma.js
│   │   └── swagger.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── validationMiddleware.js
│   │
│   ├── models/
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── services/
│   │   ├── adminService.js
│   │   ├── authService.js
│   │   └── userService.js
│   │
│   ├── utils/
│   │   └── helperFunction.js
│   │
│   └── validators/
│       └── authValidators.js
│
├── app.js
├── server.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json

---
Folder Responsibilities
Folder	Purpose
controllers/	Handle request and response logic
services/	Business logic and database operations
routes/	API endpoint definitions
middleware/	Authentication, authorization, validation
validators/	Zod validation schemas
utils/	Helper functions (OTP, email, etc.)
config/	Database, environment, Swagger configuration
prisma/	Database schema and migrations
public/	Static files (Stripe test pages, success page, etc.)

# Database Schema

Main Models:

* User
* Category
* Product
* Cart
* CartItem
* Order
* OrderItem
* Payment
* Review

Relationships:

```text
User
 ├── Cart
 ├── Orders
 └── Reviews

Category
 └── Products

Product
 ├── CartItems
 ├── OrderItems
 └── Reviews

Order
 ├── OrderItems
 └── Payment
```

---

# Race Condition Handling

When multiple users attempt to purchase the same product simultaneously, race conditions can cause stock inconsistencies.

This project prevents overselling by using:

## Prisma Transaction

```js
await prisma.$transaction(async (tx) => {
    ...
});
```

## Atomic Stock Update

```js
await tx.product.updateMany({
    where: {
        id: productId,
        stock: {
            gte: quantity
        }
    },
    data: {
        stock: {
            decrement: quantity
        }
    }
});
```

### Why This Works

Instead of:

```text
Read Stock
Check Stock
Update Stock
```

which is vulnerable to race conditions,

the project performs:

```text
Check + Update
```

in a single database operation.

This guarantees stock can never become negative.

---

# Payment Flow

This project uses Stripe Checkout.

## Payment Process

```text
Create Order
      ↓
Create Stripe Checkout Session
      ↓
User Redirected to Stripe
      ↓
Payment Completed
      ↓
Stripe Webhook Triggered
      ↓
Database Updated
      ↓
Email Notification Sent
```

---

## Checkout Session Creation

```js
stripe.checkout.sessions.create(...)
```

Stores:

```text
Order ID
User ID
Amount
```

inside Stripe metadata.

---

## Webhook Verification

```js
stripe.webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret
);
```

Ensures the request truly came from Stripe.

---

## Payment Success

When:

```text
checkout.session.completed
```

is received:

```text
Order Status → PAID
Payment Status → COMPLETED
Paid Time Saved
Transaction ID Saved
Email Sent
```

---

# Idempotency Protection

To avoid duplicate payments:

```text
User Double Click
Network Retry
Stripe Retry
```

the system stores:

```text
idempotencyKey
stripeIntentId
```

inside the Payment table.

This ensures a payment is processed only once.

---

# Environment Variables

Create a `.env` file:

```env
PORT=3000

DATABASE_URL=

JWT_SECRET=
JWT_REFRESH=

EMAILUSER=
EMAILPASSWORD=

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

SECRET=
```

---

# Installation

Clone the repository:

```bash
git clone https://github.com/nandanchakraborty/E-commerce-Backend.git

cd E-commerce-Backend
```

Install dependencies:

```bash
npm install
```

---

# Database Setup

Create PostgreSQL database.

Update:

```env
DATABASE_URL=
```

Run migration:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

---

# Running the Project

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

# API Documentation

After starting the server:

```text
http://localhost:3000/api-docs
```

Swagger UI provides:

* Endpoint Documentation
* Request Examples
* Response Examples
* Authorization Testing

---

# Security Features

* JWT Authentication
* Role-Based Authorization
* Password Hashing with bcrypt
* Zod Request Validation
* Stripe Signature Verification
* Protected Payment Webhooks
* Race Condition Prevention
* Idempotency Protection

---

# Author

Nandan Chakraborty

GitHub:
https://github.com/nandanchakraborty

LinkedIn:
https://linkedin.com

Email:
[nandancsebubt@gmail.com](mailto:nandancsebubt@gmail.com)
