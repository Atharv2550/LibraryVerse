# LibraryVerse 📚🏛️ — Role-Based Smart Library Management System (MERN Stack)

> **LibraryVerse** is an enterprise-grade, full-stack MERN (MongoDB, Express.js, React 18, Node.js) **Library Management System (LMS)** engineered with three distinct roles: **Admin**, **Librarian**, and **User (Library Member)**. It provides end-to-end automation for registration, staff authorization workflows, common login, role-specific dashboards, catalogue curation, physical copy barcode tracking, patron circulation (issue, return, renewals), reservation hold queues, automated overdue fine calculation, operational CSV reports, and comprehensive audit logging.

---

## 📑 Table of Contents

1. [User Roles & Permissions](#-user-roles--permissions)
2. [Role-Based Workflows](#-role-based-workflows)
   - [Registration System](#1-registration-system)
   - [Common Login System](#2-common-login-system)
   - [Role 1: Admin Governance Console (`/admin`)](#3-role-one-admin-dashboard)
   - [Role 2: Librarian Circulation Desk (`/circulation`)](#4-role-two-librarian-dashboard)
   - [Role 3: User Dashboard (`/my-library`)](#5-role-three-user-dashboard)
3. [Circulation & Inventory Architecture](#-circulation--inventory-architecture)
4. [Tech Stack](#-tech-stack)
5. [Folder Structure](#-folder-structure)
6. [Prerequisites & Installation](#-prerequisites--installation)
7. [Environment Variables](#-environment-variables)
8. [Running Locally](#-running-locally)
9. [Automated Testing](#-automated-testing)
10. [Production Build](#-production-build)
11. [API Reference](#-api-reference)
12. [Legacy Database Migration & Cleanup](#-legacy-database-migration--cleanup)
13. [Security Hardening](#-security-hardening)
14. [License](#-license)

---

## 👥 User Roles & Permissions

| Role | Access Level | Responsibilities & Capabilities |
|---|---|---|
| **Administrator (`admin`)** | Full System Governance | Platform overview KPIs, approve/reject librarian applicants, manage cardholder accounts & staff status (suspend/reactivate), configure global circulation policies (loan duration, fine rates, limits), review audit trail logs. |
| **Librarian (`librarian`)** | Staff Operations | Catalogue book additions & metadata, physical copy barcode generation, circulation desk (issue/return/renew), manage reservation queues, collect overdue fines, operational analytics & CSV reports. *(Requires Administrator approval before access)*. |
| **User (`user` / `member`)** | Patron Self-Service | Browse institutional catalogue, live copy availability, place reservation holds, track borrowed books & due dates, request renewals, personal notifications, and cardholder profile. |

---

## ⚡ Role-Based Workflows

### 1. Registration System
- Fields:
  1. Full Name
  2. Email Address
  3. Password (min 6 characters)
  4. Confirm Password (must match Password)
  5. **Register As** selector: **User (Reader)** or **Librarian**. *(Public Admin registration is strictly prohibited and rejected by the server).*
- **User Registration**:
  - Automatically assigned role `user` and status `active`.
  - Issued authentication JWT immediately with redirection to the User Dashboard (`/my-library`).
- **Librarian Registration**:
  - Assigned role `librarian` and status `pending`.
  - No authentication token is issued until an Administrator reviews and approves the application.
  - Applicant is shown an "Application Awaiting Approval" screen with clear guidance.

### 2. Common Login System
- Single unified login page with **exactly two fields**: `Email Address` and `Password` (no role selector).
- Server securely checks credentials, role, and account status from MongoDB:
  - `admin` → Redirected to **Administrator Platform Console** (`/admin`).
  - `librarian` (status `approved` or `active`) → Redirected to **Librarian Circulation Desk** (`/circulation`).
  - `user` (status `active`) → Redirected to **User Dashboard** (`/my-library`).
- Status guards:
  - **Pending Librarian**: Blocks login with 403 error: *"Your librarian account is awaiting administrator approval."*
  - **Rejected Librarian**: Blocks login with 403 error and displays the reason recorded by the administrator.
  - **Suspended Account**: Blocks login with 403 error: *"Your account has been suspended. Please contact the library administrator."*

### 3. Role One: Admin Dashboard (`/admin`)
- **System Overview KPIs**: Real MongoDB metrics for total users, active librarians, pending librarian requests, book titles, physical copies, active loans, overdue loans, pending reservations, and outstanding fines.
- **Librarian Approval Console**:
  - Filter by `pending`, `approved`, `rejected`, or `all`.
  - One-click **Approve** (activates account, triggers approval notification, logs audit trail).
  - One-click **Reject** with custom rejection reason modal.
- **Users & Staff Management**: Search by name/email/card ID, filter by role/status, toggle account suspension/reactivation.
- **System Policies Configuration**: Configure default loan duration (days), maximum active loans per member, renewal limits, daily fine rate ($/day), and reservation pickup window (hours).
- **Direct Navigation**: Shortcuts to Circulation Desk, Reports & CSV export, and Audit Trail.

### 4. Role Two: Librarian Dashboard (`/circulation`)
- **Circulation Desk**:
  - Rapid Book Issue by entering/scanning Member ID and Physical Copy Barcode.
  - Book Returns with automatic fine assessment and hold queue transition.
  - Loan Renewals enforcing loan limits and reservation conflict checks.
- **Physical Inventory**: Manage individual `BookCopy` records with unique Accession Numbers, Barcodes, Shelf Locations, and Statuses (`available`, `issued`, `reserved`, `damaged`, `lost`).
- **Hold Queue Fulfillment**: When an issued copy is returned, the system automatically marks it `reserved` and alerts the reserving member.
- **Fines Desk (`/fines`)**: Record fine payments or view assessed late fees.

### 5. Role Three: User Dashboard (`/my-library`)
- **Active Loans**: Live view of borrowed books, issue dates, due dates, and remaining days.
- **Renewals**: One-click loan renewal requests.
- **Hold Queue**: View pending book reservations and ready-for-collection alerts.
- **Fines**: Personal outstanding fines balance.
- **Notifications**: Due date reminders, ready-for-pickup alerts, and system notices.

---

## 🏗️ Circulation & Inventory Architecture

```text
[ Browser Client: React 18 SPA + Vite + Tailwind CSS ]
                         │
                         ▼ (REST API & WebSockets)
        [ Express.js API Gateway & RBAC Circulation Engine ]
        ├── Auth Controller (Role whitelist, bcrypt hash, approval status check)
        ├── Admin Controller (/api/admin: overview, approvals, policies, user controls)
        ├── Circulation Service (Atomic issue/return/renew transactions, hold queue fulfillment)
        ├── Real-Time Socket.IO (Patron notification rooms)
        └── Policy Engine (Configurable loan durations, fine rates, and limits)
                         │
                         ▼ (Mongoose ODM)
                 [ MongoDB Database ]
                 ├── users (admin, librarian, user; pending/approved/rejected/active/suspended)
                 ├── policies (System-wide circulation rules and limits)
                 ├── books & bookcopies (Inventory, accession numbers, barcodes, shelf locations)
                 ├── loans (Issue history, due dates, renewal counters)
                 ├── reservations (FIFO hold queues, pickup deadlines)
                 ├── fines (Overdue late fees, payment records)
                 ├── notifications (Circulation alerts)
                 └── auditlogs (Immutable system audit trail)
```

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios, Socket.IO Client, Lucide React |
| **Backend** | Node.js (v20+), Express.js 4, Mongoose 8, Socket.IO 4, JWT, BcryptJS, Express Validator, Helmet, Express Rate Limit |
| **Database** | MongoDB 6+ / MongoDB Atlas |
| **Testing** | Node Test Runner, Supertest (Backend), Vitest 2, React Testing Library, JSDOM (Frontend) |

---

## 📂 Folder Structure

```text
LibraryManagementSystem/
├── backend/
│   ├── src/
│   │   ├── config/              # MongoDB connection, socket handlers
│   │   ├── controllers/         # admin, auth, book, copy, loan, reservation, fine, report, audit, user
│   │   ├── middlewares/         # JWT auth, protect, admin, librarian, authorize, error handler
│   │   ├── models/              # User, Policy, Book, BookCopy, Loan, Reservation, Fine, AuditLog, Notification
│   │   ├── routes/              # admin, auth, book, copy, loan, reservation, fine, report, audit, user
│   │   ├── services/            # circulation, copy, audit, notification services
│   │   ├── tests/               # 32 Automated backend tests (api.test, libraryManagement.test, roleBasedAuth.test)
│   │   ├── utils/               # seedAdmin, seedData, seedRunner, cleanupLegacyCollections
│   │   ├── app.js               # Express application route assembly
│   │   └── server.js            # Server entry point with auto admin setup
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/          # common (Navbar, Footer, NotificationBell, ThemeToggle), books, Modal
│   │   ├── context/             # AuthContext provider
│   │   ├── hooks/               # useAuth, useSocket
│   │   ├── pages/               # AdminDashboard, CirculationDesk, MyLibrary, Home, BookDetails,
│   │   │                        # MembersManagement, FinesManagement, LibraryReports, AuditLogs, Profile, Login, Register
│   │   ├── services/            # adminService, authService, bookService, circulationService, fineService, etc.
│   │   ├── test/                # 8 Frontend Vitest component tests
│   │   ├── App.jsx              # Role-protected routing (/admin, /circulation, /my-library, etc.)
│   │   └── main.jsx             # React DOM entry
│   ├── package.json
│   └── vite.config.js
│
├── package.json                 # Root npm scripts
└── README.md
```

---

## 💻 Prerequisites & Installation

1. **Node.js**: v18.0.0 or higher (v20+ recommended)
2. **MongoDB**: MongoDB running locally on port `27017` or MongoDB Atlas URI

Install all dependencies across root, backend, and frontend:
```bash
npm run install:all
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/bookverse
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🏃 Running Locally

Launch both backend API and frontend Vite server concurrently:
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Backend API (Port 5000)
npm run dev:backend

# Terminal 2 - Frontend SPA (Port 5173)
npm run dev:frontend
```

Access the application in your browser at `http://localhost:5173`.

### Initial Administrator Credentials:
If no admin exists on boot, the server automatically provisions:
- **Email**: `admin@libraryverse.test`
- **Password**: `AdminPassword123!`
- **Role**: `admin`

---

## 🧪 Automated Testing

### Backend Tests (32 Tests)
```bash
npm run test:backend
```
*Validates:*
- Core API health and database connection.
- User registration, membership ID assignment, active status.
- Disallowing public `admin` role registration (privilege escalation prevention).
- Password and confirmPassword matching validation.
- Librarian registration (status `pending`, no token issued).
- Blocking pending librarian login (403).
- Role-based route guard enforcement on `/api/admin/*`.
- Admin overview KPI aggregation.
- Admin approval workflow (`accountStatus: 'approved'`).
- Successful login of approved librarian.
- Admin rejection workflow with reason notes.
- System policy configuration retrieval and updates.
- Physical copy inventory synchronization.
- Book issue, duplicate issue prevention, renewals.
- Reservation queue creation and auto-hold on return.
- Late fine calculations, payments, CSV reports, and audit logging.

### Frontend Tests (8 Tests)
```bash
npm run test:frontend
```
*Validates BookCard catalogue rendering, unauthenticated Navbar, member authenticated Navbar, librarian circulation links, admin audit trail links, ThemeToggle, Modal, and LoadingSpinner.*

---

## 🌐 API Reference

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Server health & database connection status |
| `/api/auth/register` | POST | Public | Register new User or Librarian |
| `/api/auth/login` | POST | Public | Authenticate user & issue JWT based on role |
| `/api/auth/me` | GET | Authenticated | Retrieve current user profile, role, and status |
| `/api/admin/overview` | GET | Admin | System overview KPIs (users, librarians, loans, fines) |
| `/api/admin/librarians` | GET | Admin | List librarian applications with status filter |
| `/api/admin/librarians/:id/approve` | PUT | Admin | Approve pending librarian application |
| `/api/admin/librarians/:id/reject` | PUT | Admin | Reject librarian application with reason |
| `/api/admin/users` | GET | Admin | Search and list users with role and status filters |
| `/api/admin/users/:id/status` | PUT | Admin | Suspend or reactivate user account |
| `/api/admin/policies` | GET/PUT | Admin | Get or update system circulation policies |
| `/api/books` | GET | Public | Paginated catalogue search & filtering |
| `/api/books` | POST | Staff | Catalog new book title and auto-generate copies |
| `/api/copies/book/:bookId` | GET | Public | List physical copies for a title |
| `/api/copies/bulk` | POST | Staff | Bulk generate barcoded physical copies |
| `/api/loans` | GET | Staff | List circulation loans (active, overdue, returned) |
| `/api/loans/my-loans` | GET | Member | Member's personal active loans and history |
| `/api/loans/issue` | POST | Staff | Issue a physical copy to a cardholder |
| `/api/loans/:id/return` | POST | Staff | Process book return & assess late fines |
| `/api/loans/:id/renew` | POST | Member/Staff | Renew an eligible loan |
| `/api/reservations` | GET | Staff | View active title hold queues |
| `/api/reservations/my-reservations` | GET | Member | View member's active hold requests |
| `/api/reservations` | POST | Member | Place a hold on a book title |
| `/api/reservations/:id/cancel` | PUT | Member/Staff | Cancel a reservation |
| `/api/fines` | GET | Staff | List outstanding and historical library fines |
| `/api/fines/my-fines` | GET | Member | Member's outstanding fines balance |
| `/api/fines/:id/pay` | POST | Staff | Record payment for an assessed fine |
| `/api/fines/:id/waive` | POST | Admin | Administratively waive an assessed fine |
| `/api/library-reports/summary` | GET | Staff | Operational KPI dashboard metrics |
| `/api/library-reports/export/csv` | GET | Staff | Downloadable CSV report exports |
| `/api/audit` | GET | Admin | View immutable security audit trail logs |

---

## 🧹 Legacy Database Migration & Cleanup

If you previously ran the legacy BookVerse social reading platform, your MongoDB database may still contain obsolete collections (`clubs`, `challenges`, `badges`, `discussions`, `quotes`).

A safe audit and cleanup utility is provided:

```bash
# 1. Audit / Dry-Run (lists legacy collections without modifying data):
node backend/src/utils/cleanupLegacyCollections.js

# 2. Execute Cleanup (safely drops identified legacy collections & unsets legacy fields):
node backend/src/utils/cleanupLegacyCollections.js --execute
```

---

## 🛡️ Security Hardening

- **Role-Based Authorization**: Strict backend middleware (`protect`, `admin`, `librarian`, `authorize`) enforces role validation on every endpoint.
- **No Self-Assigned Admin**: Registration role whitelist strictly accepts only `user` or `librarian`.
- **Librarian Approval Gate**: Newly registered librarians are set to `pending` and cannot authenticate or access staff endpoints until explicitly approved by an administrator.
- **Password Protection**: Passwords are hashed with bcrypt (salt 10) and omitted from all JSON serialization (`delete ret.password`).
- **Audit Logging**: All significant operations (librarian approval/rejection, book issue, returns, policy changes, status updates) write immutable records to `AuditLog`.
- **Rate Limiting & Helmet**: Protects against brute force on auth routes and enforces secure HTTP headers.

---

## 📄 License

This project is licensed under the MIT License.
