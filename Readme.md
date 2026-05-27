# Express AI Chat API

A robust backend API for an AI-powered chat application. This project is built using Node.js, Express.js, TypeScript, PostgreSQL, and Prisma ORM. It includes user authentication (JWT), integration with AI services, and interactive Swagger API documentation.

## Features

- **User Authentication**: Secure registration and login using `bcrypt` for password hashing and `jsonwebtoken` for protected routes.
- **AI Chat Integration**: Endpoints to create and manage AI conversations and chat messages.
- **Database Management**: PostgreSQL with Prisma ORM for strongly-typed, relational database interactions.
- **API Documentation**: Auto-generated and interactive Swagger UI to easily test your endpoints.

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & bcrypt
- **Documentation**: Swagger (OpenAPI 3.0)

## Prerequisites

Before running this project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (running locally or a cloud database URL)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or use your existing one). You can use `example.env` as a reference.

```env
PORT=9000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/aichat?schema=public"
JWT_SECRET="your_very_secure_jwt_secret"
API_KEY="your_ai_service_api_key"
```

### 3. Database Setup (Prisma)

Push the database schema to your PostgreSQL database and generate the Prisma client:

```bash
# Push the schema to the database (creates tables)
npx prisma db push

# OR, if you want to track migration history:
npx prisma migrate dev --name init

# Generate the Prisma Client
npx prisma generate
```

> **Note**: If you ever need to completely reset the database (this deletes all data), run `npx prisma migrate reset`.

### 4. Start the Server

**Development Mode** (uses nodemon for auto-reloading):
```bash
npm run dev
```

**Production Mode**:
```bash
npm run build
npm start
```

The server should now be running on `http://localhost:9000`.

---

## API Documentation

This project comes with built-in Swagger documentation so you can test all the routes directly from your browser.

Once the server is running, navigate to:
**👉 [http://localhost:9000/api-docs](http://localhost:9000/api-docs)**

### How to use Protected Routes (Authentication)

The AI chat routes require a Bearer token. To test them in Swagger:
1. Go to the `POST /api/users` endpoint to register a new account.
2. Go to the `POST /api/users/login` endpoint to log in and get your JWT token.
3. Scroll to the top of the Swagger page and click the green **"Authorize"** button.
4. Paste your token into the box (Swagger handles the "Bearer " prefix for you) and click Authorize.
5. You can now successfully test the protected `/api/chat` endpoints!

## Folder Structure

```text
/
 ┣ prisma/
 ┃ ┗ schema.prisma      # Prisma database schema models
 ┣ src/
 ┃ ┣ config/            # Config files (Swagger setup)
 ┃ ┣ controllers/       # Business logic and request handling
 ┃ ┣ lib/               # Shared utilities (Prisma client instance)
 ┃ ┣ middlewares/       # Express middlewares (JWT Auth)
 ┃ ┣ routes/            # API route definitions
 ┃ ┗ server.ts          # Express application entry point
 ┣ .env                 # Environment variables
 ┣ package.json         # Project dependencies and scripts
 ┗ tsconfig.json        # TypeScript configuration
```