# EduNexus-LMS

A lightweight Learning Management System (Mini-LMS) built with the MERN stack. EduNexus provides a complete system for creating and managing courses, users, lectures, assignments, and real-time communication between students and instructors.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Core Data Models](#core-data-models)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Overview

EduNexus is intended for small- to medium-sized teams, instructors, and institutions who want a simple, extensible LMS built on modern web technologies. It includes role-based access control, file uploads, real-time chat, and separate dashboards for different user roles.

---

## Key Features

- JWT authentication with role-based access (student, instructor, admin)
- Course creation, enrollment and management
- Lecture management (video links)
- Assignment creation and student submissions
- File uploads (Cloudinary + Multer)
- Real-time chat using Socket.io
- Tailwind CSS-based responsive UI
- Separate dashboards: Student, Instructor, Admin

---

## Tech Stack

Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

Frontend
- React
- React Router
- Context API

Authentication
- JSON Web Tokens (JWT)

Real-time
- Socket.io

File Uploads
- Cloudinary + Multer

Styling
- Tailwind CSS

---

## Project Structure

```
/edunexus-lms
|
|--- /client                # React Frontend
|   |--- /public
|   |--- /src
|   |   |--- /components
|   |   |--- /context
|   |   |--- /hooks
|   |   |--- /pages
|   |   |--- /services
|   |   |--- App.js
|   |   |--- index.js
|   |--- package.json
|   |--- tailwind.config.js
|
|--- /server                # Node.js Backend
|   |--- /config
|   |--- /controllers
|   |--- /middleware
|   |--- /models
|   |--- /routes
|   |--- server.js
|   |--- package.json
|   |--- .env
```

---

## Dependencies

Backend
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- socket.io
- cloudinary
- multer
- multer-storage-cloudinary
- nodemon (dev)

Frontend
- react
- react-dom
- react-router-dom
- axios
- socket.io-client
- jwt-decode
- tailwindcss
- @heroicons/react

---

## Core Data Models (summary)

User
```json
{
  "name": "String",
  "email": "String",
  "password": "String",
  "role": "student|instructor|admin"
}
```

Course
```json
{
  "title": "String",
  "description": "String",
  "instructor": "Ref(User)",
  "studentsEnrolled": ["Ref(User)"],
  "lectures": ["Lecture"],
  "assignments": ["Ref(Assignment)"]
}
```

Lecture
```json
{
  "title": "String",
  "videoUrl": "String"
}
```

Assignment
```json
{
  "title": "String",
  "description": "String",
  "dueDate": "Date",
  "fileUrl": "String",
  "submissions": ["Ref(Submission)"]
}
```

Submission
```json
{
  "student": "Ref(User)",
  "assignment": "Ref(Assignment)",
  "fileUrl": "String",
  "submittedAt": "Date"
}
```

---

## API Endpoints

Method | Endpoint | Description | Access
--- | --- | --- | ---
POST | /api/auth/register | Register a new user | Public
POST | /api/auth/login | Login and receive JWT | Public
GET | /api/auth/me | Get current user data | Auth
GET | /api/courses | Get all courses | Auth
GET | /api/courses/:id | Get a single course | Auth
POST | /api/courses | Create a course | Instructor
PUT | /api/courses/:id | Update a course | Instructor
POST | /api/courses/:id/enroll | Enroll in a course | Student
POST | /api/courses/:id/lectures | Add a lecture | Instructor
POST | /api/courses/:id/assignments | Add an assignment | Instructor
GET | /api/assignments/:id/submissions | View submissions | Instructor
POST | /api/assignments/:id/submit | Submit assignment | Student
GET | /api/users | Get all users | Admin
DELETE | /api/users/:id | Delete a user | Admin

---

## Getting Started

### Prerequisites
- Node.js (>= 14)
- npm or yarn
- MongoDB connection (Atlas or self-hosted)
- Cloudinary account for file uploads (optional but recommended)

### Backend Setup
1. Clone the repository and enter the project directory:
```bash
git clone https://github.com/your-username/edunexus-lms.git
cd edunexus-lms
```

2. Install backend dependencies and configure environment variables:
```bash
cd server
npm install
```

Create a `.env` file in `/server` with the following values:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Run the backend in development:
```bash
npm run dev
```

### Frontend Setup
1. Install frontend dependencies and run:
```bash
cd client
npm install
npm start
```

2. If you use Tailwind CSS, ensure you follow Tailwind’s React setup (postcss, tailwind.config.js, and import directives) — the project includes a baseline configuration file.

---

## Scripts

Backend
- npm run dev — run server in development mode (nodemon)
- npm start — run production server

Frontend
- npm start — run React app in development
- npm run build — build React app for production

---

## Contributing

Contributions are welcome. Suggested workflow:
1. Fork the repository.
2. Create a branch for your feature or bugfix: `git checkout -b feat/your-feature`.
3. Commit changes with descriptive messages.
4. Push to your fork and open a Pull Request describing your changes.

Please follow existing code style, add tests where applicable, and ensure no sensitive secrets are committed.

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this project provided attribution is kept according to the license.

---

## Support

If you find this project useful, please give it a star on GitHub and share it with others. For issues and feature requests, open an issue in the repository.
