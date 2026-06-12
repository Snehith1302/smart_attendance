# 📱 Smart Attendance Management System

[![Firebase hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=white)](https://smart-attendance-2026-a2419.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](#)
[![Vertex AI](https://img.shields.io/badge/Vertex--AI-Gemini-4285F4?logo=google-cloud&logoColor=white)](#)

A complete, production-ready final-year CSE project. **Smart Attendance Management System** is a modern, web-based platform that automates attendance tracking through time-bound QR code check-ins and provides dynamic compliance insights using Google Cloud's **Vertex AI Gemini API**.

🔗 **Live Deployment URL:** [https://smart-attendance-2026-a2419.web.app](https://smart-attendance-2026-a2419.web.app)

---

## 🌟 Core Features

### 🔐 1. Role-Based Access Control
* **Admin Portal:** Manage user permissions and toggle registry roles between Student, Faculty, and Administrator.
* **Faculty Dashboard:** Manage courses, enroll students, and review live attendance logs.
* **Student Interface:** Review courses, monitor attendance percentages, and download compliance audits.

### 📱 2. Time-Bound Dynamic QR Code Check-Ins
* Faculty can initiate a session generating a unique, secure QR code token expiring in 10 minutes.
* Students scan the QR code with their mobile cameras inside the web portal to check in.
* **Robust Fallback:** If camera access is unavailable, students can manually key in the session code.

### ✍️ 3. Live Attendance Grid & Override
* Real-time student check-in lists powered by Firestore WebSockets.
* Instructors can manually toggle records between **Present**, **Absent**, and **Late** to correct entry errors.

### 🤖 4. AI-Powered Monthly Reports
* Integrated with **Vertex AI Gemini API** via Firebase Cloud Functions.
* Generates a monthly academic evaluation analyzing check-in trends and compliance actions (identifying records dropping below the 75% threshold).

### 📊 5. Visual Dashboard Stats
* Course average and individual attendance rate indicators rendered through responsive **Recharts** graphs.

---

## 🏗️ System Architecture

```
                    +------------------------------------+
                    |            Presentation            |
                    |      React 18 + TS + Tailwind      |
                    +---------+--------------------+-----+
                              |                    |
                              | Authentication     | Sync Data
                              v                    v
                    +---------+----+      +--------+-----+
                    |  Firebase    |      |  Cloud       |
                    |  Auth        |      |  Firestore   |
                    +--------------+      +---+----------+
                                              |
                                              | GCF Execution
                                              v
                                          +---+----------+
                                          |  Firebase    |
                                          |  Functions   |
                                          +---+----------+
                                              |
                                              | API Call
                                              v
                                          +---+----------+
                                          |  Vertex AI   |
                                          |  (Gemini)    |
                                          +--------------+
```

---

## 💻 Running Locally

### Prerequisites
* Node.js (version 18 or above)
* npm

### Step 1: Install Dependencies
Open terminal in the project directory and install the packages:
```bash
npm install
```

### Step 2: Launch Dev Server
Launch the React application:
```bash
npm start
```
The application will start on **`http://localhost:3000`**.

### Step 3: Run Functions & Emulators (Optional)
If you want to run the Firebase local backend emulators for testing Firestore and Cloud Functions locally:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Start the local emulator suite
firebase emulators:start
```

---

## 🔒 Security Configuration
* **Firestore Security Rules:** Restricted access based on validated Auth tokens and role documents. Students are restricted to updating only their own attendance ticket status during active sessions.
* **API Key Safety:** Vertex AI client credentials and prompt parameters are stored securely inside GCF, preventing key exposure on client browsers.

---

## 📂 Project Structure

```
smart-attendance/
├── build/                    # Compiled React distribution
├── public/                   # Static browser files
├── src/
│   ├── components/           # Navbar, Protected Routing guards
│   ├── context/              # Authentication session controller
│   ├── pages/                # Login, Dashboard, Classes, Scanners, Reports
│   ├── firebase.ts           # Firebase connection configuration
│   └── App.tsx               # Route declarations
├── functions/                # Serverless Node.js Cloud Functions (Vertex AI)
├── firestore.rules           # Security rules configuration
└── tailwind.config.js        # Global layout styling configurations
```

---

## 📝 Project Documentation & Viva Q&A
A comprehensive 12-section project documentation manual containing database collections, architecture maps, and **25 Viva Q&A questions** commonly asked by college evaluators is available in the **[DOCUMENTATION.md](./DOCUMENTATION.md)** file.
