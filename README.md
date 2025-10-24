# EduNexus-LMS

# 📚 Overview

EduNexus is a lightweight Learning Management System (Mini-LMS) built with the MERN stack.
It provides an end-to-end system for managing courses, users, assignments, and real-time communication between students and instructors.

# 🚀 Tech Stack

**Backend**

1. Node.js
2. Express.js
3. MongoDB (via Mongoose)

**Frontend**

1. React
2. React Router
3. Context API

**Authentication**

1. JSON Web Tokens (JWT)

**Real-time**

1. Socket.io

**File Uploads**

1. Cloudinary + Multer

**Styling**

1. Tailwind CSS

# 📁 Project Structure

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
