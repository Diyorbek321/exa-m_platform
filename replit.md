# Online Exam Platform

## Overview
A comprehensive online exam platform with role-based access for administrators and students. Administrators can manage subjects, quizzes, questions, and student accounts. Students can take timed exams with randomly selected questions and view their results.

## Current State
The application is fully functional with all MVP features implemented:
- User authentication with admin/student roles
- Admin dashboard with full CRUD for subjects, quizzes, questions, and students
- Excel import for bulk question upload
- Student exam interface with question navigation
- Results page with detailed answer review

## Default Credentials
- **Admin**: username: `admin`, password: `adminpass`

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js, Node.js
- **Storage**: In-memory storage (MemStorage)
- **Authentication**: Express sessions with bcrypt password hashing

## Project Architecture

### Frontend (`client/src/`)
- `App.tsx` - Main router with authentication guards
- `lib/auth.tsx` - Authentication context and hooks
- `lib/queryClient.ts` - TanStack Query configuration
- `components/` - Shared components (layouts, theme toggle)
- `pages/login.tsx` - Login page
- `pages/admin/` - Admin pages (dashboard, subjects, quizzes, questions, students)
- `pages/student/` - Student pages (dashboard, exam, results)

### Backend (`server/`)
- `index.ts` - Express server setup
- `routes.ts` - API endpoints with session management
- `storage.ts` - In-memory data storage with CRUD operations

### Shared (`shared/`)
- `schema.ts` - TypeScript types and Zod validation schemas

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Routes
- `GET /api/admin/stats` - Dashboard statistics
- `GET/POST /api/subjects` - List/create subjects
- `PATCH/DELETE /api/subjects/:id` - Update/delete subject
- `GET/POST /api/quizzes` - List/create quizzes
- `PATCH/DELETE /api/quizzes/:id` - Update/delete quiz
- `GET/POST /api/questions` - List/create questions
- `POST /api/questions/import` - Import questions from Excel
- `PATCH/DELETE /api/questions/:id` - Update/delete question
- `GET/POST /api/students` - List/create students
- `POST /api/students/:id/extend` - Extend student access
- `DELETE /api/students/:id` - Delete student

### Student Routes
- `GET /api/student/subjects` - Get subjects with quizzes
- `POST /api/exam/start` - Start an exam
- `GET /api/exam/:examId` - Get exam questions
- `POST /api/exam/:examId/submit` - Submit exam answers
- `GET /api/exam/:examId/results` - Get exam results

## Recent Changes
- Initial implementation of the online exam platform
- Added authentication with session management
- Implemented admin CRUD operations for all entities
- Added Excel import for questions
- Implemented student exam taking and results viewing
- Added dark mode support

## User Preferences
- Material Design 3 inspired UI with Roboto font
- Clean, minimal interface with focus on functionality
- Bootstrap 5 responsive styling patterns
