# 🎓 Student Management System (SMS)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue)

A comprehensive, full-stack, enterprise-grade Student Management System designed for schools and colleges. This application provides a secure, role-based environment to streamline academic administration, manage student records, track attendance, calculate weighted grades, and generate automated PDF reports.

---

## 📸 Screenshots
*(Replace these placeholders with actual screenshots of your app when deployed)*
| Admin Dashboard | Teacher Portal | Student Portal |
| :---: | :---: | :---: |
| ![Admin](https://via.placeholder.com/300x200?text=Admin+Dashboard) | ![Teacher](https://via.placeholder.com/300x200?text=Teacher+Attendance) | ![Student](https://via.placeholder.com/300x200?text=Student+Grades) |

---

## 🚀 Key Features

The system is built on a strict **Role-Based Access Control (RBAC)** architecture, ensuring data privacy and operational security.

### 👑 1. Admin Portal (System Manager)
*   **Analytics Dashboard:** Interactive bar charts visualizing student enrollment distribution across different courses.
*   **Full User Management:** Complete CRUD (Create, Read, Update, Delete) operations for Students and Teachers.
*   **Course Management:** Create courses, assign faculty, and define credit weights.
*   **Enrollment Engine:** Seamlessly enroll students into specific courses with duplicate-prevention safeguards.
*   **Notice Board:** Broadcast announcements (e.g., exam schedules, holidays) to all users instantly.
*   **Server-Side Pagination:** Efficiently handles thousands of student records with backend `LIMIT`/`OFFSET` and search query parameters.

### 🍎 2. Teacher Portal (Academic Operator)
*   **Attendance Management:** Take daily class attendance (Present, Absent, Late). Features an *idempotent upsert* logic—if a teacher edits a past date, it updates the record instead of throwing an error.
*   **Assessment Builder:** Create quizzes, midterms, and finals with custom maximum scores and grading weights.
*   **Bulk Grading:** Efficiently enter and update scores for entire classes in a single view.
*   **CSV Data Export:** Download complete class attendance registers in `.csv` format for offline record-keeping.

### 🎓 3. Student Portal (End User)
*   **Academic Dashboard:** View detailed grade breakdowns, assessment scores, and the current weighted percentage per course.
*   **Attendance Visualizer:** Interactive progress bars indicating attendance rates, color-coded for performance (Green/Yellow/Red).
*   **Course Schedule:** View all enrolled courses, assigned teachers, and credit values.
*   **PDF Report Card:** Download a dynamically generated, professional PDF containing grades and attendance summaries (`PDFKit` backend integration).

### 🔒 4. Security & UX Polish
*   **JWT Authentication:** Stateless, secure authentication using JSON Web Tokens.
*   **Advanced Password Management:** Includes a simulated "Forgot Password" flow (generates a 6-digit reset code via terminal), password visibility toggles, and authenticated password changes.
*   **Rate Limiting:** `express-rate-limit` protects the `/login` route from brute-force and dictionary attacks (max 5 attempts per 15 minutes).
*   **Modern UX:** Includes React Hot Toast notifications, skeleton loading states, and empty states for a polished SaaS feel.

---

## 💻 Tech Stack & Architecture

### Frontend
*   **React.js (Vite):** Component-based architecture for a fast, SPA experience.
*   **Tailwind CSS:** Utility-first CSS for responsive, modern, and highly customizable UI.
*   **React Router DOM:** Client-side routing with protected routes based on JWT roles.
*   **Axios:** Interceptor-based API calls to automatically attach JWT tokens to headers.
*   **Recharts:** SVG-based charting library for the Admin analytics dashboard.
*   **React Hot Toast:** Lightweight, customizable toast notifications.

### Backend
*   **Node.js & Express:** RESTful API architecture.
*   **PostgreSQL:** ACID-compliant relational database.
*   **`pg` (node-postgres):** Non-blocking PostgreSQL client for Node.js.
*   **Bcrypt.js:** Salt and hash passwords before database storage.
*   **PDFKit:** Programmatic generation of PDF report cards.
*   **Express Rate Limit:** Middleware for API throttling and security.

---

## 🗄️ Database Schema Design

The database is highly normalized to ensure data integrity. Key relationships include:
*   `users`: Central table for authentication (Admin, Teacher, Student).
*   `students` & `teachers`: Extends `users` with profile-specific data (e.g., `student_number`, `employee_id`).
*   `courses`: Linked to a `teacher_id`. 
*   `enrollments`: A pivot table linking `students` and `courses` (Many-to-Many).
*   `attendance`: Linked to `enrollments`. 
*   `assessments` & `grades`: Linked to `courses` and `enrollments` to calculate weighted averages.

---

## ⚙️ Local Setup & Installation

### Prerequisites
*   Node.js (v18 or higher)
*   PostgreSQL (v14 or higher)

### 1. Database Setup
1. Open your PostgreSQL terminal (`psql`) or pgAdmin.
2. Create a new database:
   ```sql
   CREATE DATABASE sms;