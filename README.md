# 🚚 Phoenix Express (PERN Stack Delivery Platform)

<p align="center">
  <img src="frontend/src/Images/1.png" alt="Phoenix Express Logo" width="900" />
</p>

Phoenix Express is a full-stack delivery management platform built with PostgreSQL, Express, React, and Node.js.  
It supports multi-role workflows (customer/company, employee, and admin), shipment tracking, delivery operations, settlements/wallet flows, content management, newsletters, support chat, and notifications.

---

## 1) Project Title
**Phoenix Express – PERN Delivery & Logistics Management System**

## 2) Project Description
This project provides an end-to-end logistics workflow:
- Customers/companies can register, place delivery orders, track shipments, and manage account/profile data.
- Employees can manage assigned shipments, update delivery statuses/locations, manage profile/documents, and submit wallet withdrawal requests.
- Admins can manage delegates/drivers, parcel distribution, returned shipments, handover requests, merchants/settlements, reports, and content.

The system includes authentication, role-based access checks, and a React frontend with dedicated role-based dashboards.

## 3) Tech Stack
- **Frontend:** React, React Router, Axios, Bootstrap, React Bootstrap, SweetAlert2, React Icons
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM & DB Tooling:** Sequelize, Sequelize CLI
- **Auth/Security:** JWT (jsonwebtoken), bcryptjs
- **Messaging/Email:** Nodemailer
- **Utility Integrations:** QRCode generation, CORS, dotenv

## 4) Main Features (from actual code)
- 🔐 Authentication (register/login/change password/forgot password with code)
- 👥 Multi-role support: `admin`, `employee`, `customer`, `company`
- 📦 Order creation and shipment lifecycle handling
- 📍 Tracking lookup by tracking number (authenticated)
- 🧾 Employee dashboard (orders, profile, documents, wallet/withdrawals)
- 🛠️ Admin dashboard modules (delegates, parcel distribution, returned shipments, reports, handover requests)
- 💬 Support chat (customer-employee conversation flow)
- 📰 Newsletter subscribe/send flow
- 🔔 Role-based notifications with unread counters and read actions
- 🖼️ Article/blog and photo gallery content management
- 📱 QR generation endpoint for tracking links

## 5) Project Structure
```text
Phoenix-Express/
├── backend/
│   ├── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seeders/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .sequelizerc
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── apis/
│   │   ├── Components/
│   │   ├── data/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── customuer/
│   │   │   ├── employee/
│   │   │   └── Admin/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── samples/
│   └── .env.template
└── README.md
```

## 6) Backend Overview
### Server setup
- Entry point: `backend/src/server.js`
- Uses `express.json()` and CORS (`origin: http://localhost:3000`)
- Mounts API routes under `/api/*`
- Runs on **port 5000** (currently hardcoded in code)

### Routes & Controllers
- Route files in `backend/src/routes/`
- Controller files in `backend/src/controllers/`
- Domains: auth, users, admins, customers, employees, orders, shipments, tracking, vehicles, wallets, feedback, support chat, newsletter, notifications, articles, photo gallery, QR

### Middleware
- `backend/src/middleware/auth.middleware.js`
  - `authenticateUser`
  - `authenticateAdmin`
  - `authenticateEmployee`
  - `mockEmployeeAuth` (used by newsletter employee endpoints)

### Database connection
- Sequelize model bootstrap: `backend/src/models/index.js`
- Additional Sequelize instance helper: `backend/src/db/sequelize.js`
- Sequelize config: `backend/src/config/config.json`
- Sequelize paths configured via `backend/.sequelizerc`

### Authentication / Validation
- JWT signed in `auth.controller.js` (`JWT_SECRET` fallback exists in code)
- Password hashing in `User` model hook (`bcryptjs`)
- Validation is primarily via:
  - Sequelize model validators/constraints
  - Controller-level checks (required fields, role checks, status/business rules)
- No separate validation library (e.g., Joi/Zod) detected

## 7) Frontend Overview
### React structure
- App entry: `frontend/src/App.js`
- Router: `frontend/src/routes/AppRoutes.jsx`
- Layouts: Customer, Admin, Employee, Auth (`frontend/src/layouts/`)

### Pages
- Customer/public pages: home, about, tracking, blog, gallery, reviews, request delivery, profile, order confirmation
- Auth pages: sign in, login, forgot password
- Admin pages: dashboard, delegates, parcel distribution, returned shipments, merchants, handover requests, reports, content management, profile
- Employee pages: home, orders, support chats, newsletter, payment, profile

### Routing & access control
- `ProtectedRoute` checks user/token from localStorage/sessionStorage
- `RoleRoute` enforces allowed roles

### API integration
- Axios base client in `frontend/src/apis/api.js` (`http://localhost:5000/api`)
- Request interceptor attaches:
  - `Authorization: Bearer <token>`
  - `x-user-id`
  - `x-user-role`
  - `x-mock-auth-mode`
- Feature services under `frontend/src/features/**/services` and `frontend/src/services`

### State management
- React local state/hooks (`useState`, `useEffect`, custom hooks)
- No Redux/Zustand detected

## 8) Database Overview
- **Database name (from Sequelize config):** `phoenix_db`
- **Primary ORM:** Sequelize
- **Migrations:** Extensive migration set in `backend/migrations/`
- **Seeders:** Available in `backend/src/seeders/`

### Main tables/models detected
`users`, `admins`, `customers`, `individual_customer_profiles`, `company_customer_profiles`, `employees`, `employee_documents`, `vehicles`, `orders`, `shipments`, `tracking_updates`, `employee_wallets`, `wallet_transactions`, `withdrawal_requests`, `merchant_settlements`, `feedback`, `articles`, `photo_galleries`, `newsletter_subscribers`, `newsletter_campaigns`, `support_conversations`, `support_messages`, `notifications`, `regions`

### Key relationships (clear from models)
- User has one Admin / Customer / Employee
- Customer has profile type (individual/company)
- Customer has many Orders
- Order has one Shipment
- Shipment belongs to Order and optionally Employee (driver)
- Shipment has many TrackingUpdate
- Employee has wallet/documents and assigned shipments
- SupportConversation / SupportMessage linked to users and employees

## 9) API Documentation
> Base URL: `http://localhost:5000`
>
> Note: `/api/admins/*` is also mounted and mirrors `/api/admin/*`.

### Authentication
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Register a new account | No | `{ email, phone, password, role, fullName?, address? }` | `{ success, message, data }` |
| POST | `/api/auth/login` | Login with phone/email + password | No | `{ phone or email, password }` | `{ success, token, user }` |
| POST | `/api/auth/forgot-password` | Send reset code | No | `{ phone }` | `{ success, message }` |
| POST | `/api/auth/reset-password` | Reset password with code | No | `{ phone, code, newPassword }` | `{ success, message }` |
| PATCH | `/api/auth/change-password` | Change password | User | `{ currentPassword, newPassword, confirmPassword }` | `{ success, message }` |
| GET | `/api/auth/` | List auth users | No | N/A | `{ success, data }` |
| GET | `/api/auth/:id` | Get auth user by id | No | N/A | `{ success, data }` |
| PUT | `/api/auth/:id` | Update auth user | No | user fields | `{ success, data }` |
| DELETE | `/api/auth/:id` | Delete auth user | No | N/A | `{ success, message }` |

### Admin
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| GET | `/api/admin/test` | Health/test route | No | N/A | `{ success, message }` |
| POST | `/api/admin/` | Create admin | No | admin payload | `{ success, data }` |
| GET | `/api/admin/dashboard` | Admin dashboard metrics | No | N/A | `{ success, data }` |
| GET | `/api/admin/profile` | Current admin profile | Admin | N/A | `{ success, data }` |
| PATCH | `/api/admin/profile` | Update admin profile | Admin | profile fields | `{ success, data }` |
| GET | `/api/admin/reports` | Admin reports | Admin | N/A | `{ success, data }` |
| GET | `/api/admin/reports/returned` | Returned orders report | Admin | N/A | `{ success, data }` |
| GET | `/api/admin/merchants` | List merchants | No | N/A | `{ success, data }` |
| GET | `/api/admin/merchants/:id` | Merchant details | No | N/A | `{ success, data }` |
| POST | `/api/admin/merchants/:id/settlements` | Settle merchant | Admin | settlement payload | `{ success, data }` |
| PATCH | `/api/admin/merchant-settlements/:id/sent` | Mark settlement as sent | Admin | optional payload | `{ success, data }` |
| POST | `/api/admin/delegates` | Create delegate | No | delegate payload | `{ success, data }` |
| GET | `/api/admin/delegates` | List delegates | No | N/A | `{ success, data }` |
| GET | `/api/admin/delegates/:id` | Delegate details | No | N/A | `{ success, data }` |
| PUT | `/api/admin/delegates/:id` | Update delegate | No | delegate fields | `{ success, data }` |
| PATCH | `/api/admin/delegates/:id/status` | Update delegate status | No | `{ is_active/... }` | `{ success, data }` |
| GET | `/api/admin/parcel-distribution` | Parcel distribution board | No | N/A | `{ success, data }` |
| POST | `/api/admin/parcel-distribution/assign` | Assign parcel to driver | No | assignment payload | `{ success, data }` |
| GET | `/api/admin/returned-shipments` | List returned shipments | No | N/A | `{ success, data }` |
| POST | `/api/admin/returned-shipments/:shipmentId/reassign` | Reassign returned shipment | No | assignment payload | `{ success, data }` |
| PATCH | `/api/admin/returned-shipments/:shipmentId/cancel` | Cancel returned shipment | No | optional payload | `{ success, data }` |
| GET | `/api/admin/handover-requests` | List handover requests | No | N/A | `{ success, data }` |
| GET | `/api/admin/handover-requests/:id` | Handover request details | No | N/A | `{ success, data }` |
| PATCH | `/api/admin/handover-requests/:id/status` | Update handover status | No | status payload | `{ success, data }` |
| GET | `/api/admin/` | List admins | No | N/A | `{ success, data }` |
| GET | `/api/admin/:id` | Get admin by id | No | N/A | `{ success, data }` |
| PUT | `/api/admin/:id` | Update admin | No | admin fields | `{ success, data }` |
| DELETE | `/api/admin/:id` | Delete admin | No | N/A | `{ success, message }` |

### Users / Customers / Employees
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| POST | `/api/users/` | Create user | No | user payload | `{ success, data }` |
| GET | `/api/users/` | List users | No | N/A | `{ success, data }` |
| GET | `/api/users/:id` | Get user | No | N/A | `{ success, data }` |
| PUT | `/api/users/:id` | Update user | No | user fields | `{ success, data }` |
| DELETE | `/api/users/:id` | Delete user | No | N/A | `{ success, message }` |
| POST | `/api/customers/` | Create customer | No | customer payload | `{ success, data }` |
| GET | `/api/customers/` | List customers | No | N/A | `{ success, data }` |
| GET | `/api/customers/profile/me` | Current customer profile | User | N/A | `{ success, data }` |
| PATCH | `/api/customers/profile/me` | Update current customer profile | User | profile payload | `{ success, data }` |
| GET | `/api/customers/settlements/me` | Current customer settlements | User | N/A | `{ success, data }` |
| POST | `/api/customers/settlements/me/request` | Request customer settlement | User | settlement payload | `{ success, data }` |
| PATCH | `/api/customers/settlements/me/:id/confirm` | Confirm settlement | User | N/A | `{ success, data }` |
| GET | `/api/customers/:id` | Get customer by id | No | N/A | `{ success, data }` |
| PUT | `/api/customers/:id` | Update customer | No | customer payload | `{ success, data }` |
| DELETE | `/api/customers/:id` | Delete customer | No | N/A | `{ success, message }` |
| POST | `/api/employees/` | Create employee | No | employee payload | `{ success, data }` |
| GET | `/api/employees/` | List employees | No | N/A | `{ success, data }` |
| GET | `/api/employees/dashboard` | Employee dashboard | Employee | N/A | `{ success, data }` |
| GET | `/api/employees/profile` | Current employee profile | Employee | N/A | `{ success, data }` |
| PATCH | `/api/employees/profile` | Update employee profile | Employee | profile payload | `{ success, data }` |
| PATCH | `/api/employees/profile/status` | Update availability status | Employee | `{ availabilityStatus }` | `{ success, data }` |
| PATCH | `/api/employees/vehicle` | Update employee vehicle | Employee | vehicle payload | `{ success, data }` |
| POST | `/api/employees/documents` | Add employee document | Employee | document payload | `{ success, data }` |
| PATCH | `/api/employees/documents/:id` | Update employee document | Employee | document payload | `{ success, data }` |
| DELETE | `/api/employees/documents/:id` | Delete employee document | Employee | N/A | `{ success, message }` |
| GET | `/api/employees/orders` | List employee assigned orders | Employee | N/A | `{ success, data }` |
| GET | `/api/employees/orders/:shipmentId` | Employee order details | Employee | N/A | `{ success, data }` |
| PATCH | `/api/employees/orders/:shipmentId/status` | Update shipment status | Employee | `{ status }` | `{ success, data }` |
| PATCH | `/api/employees/orders/:shipmentId/location` | Update live location | Employee | `{ latitude, longitude }` | `{ success, data }` |
| GET | `/api/employees/wallet` | Employee wallet summary | Employee | N/A | `{ success, data }` |
| POST | `/api/employees/wallet/withdrawals` | Create withdrawal request | Employee | withdrawal payload | `{ success, data }` |
| GET | `/api/employees/:id` | Get employee by id | No | N/A | `{ success, data }` |
| PUT | `/api/employees/:id` | Update employee | No | employee payload | `{ success, data }` |
| DELETE | `/api/employees/:id` | Delete employee | No | N/A | `{ success, message }` |

### Orders / Shipments / Tracking
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| POST | `/api/orders/` | Create order | User | order payload | `{ success, data }` |
| GET | `/api/orders/` | List orders | No | N/A | `{ success, data }` |
| GET | `/api/orders/me` | Current customer orders | User | N/A | `{ success, data }` |
| PUT | `/api/orders/me/:id` | Update current customer order | User | order update | `{ success, data }` |
| DELETE | `/api/orders/me/:id` | Delete current customer order | User | N/A | `{ success, message }` |
| GET | `/api/orders/stats/most-requested-region` | Most requested region stats | No | N/A | `{ success, data }` |
| GET | `/api/orders/:id` | Get order by id | No | N/A | `{ success, data }` |
| PUT | `/api/orders/:id` | Update order | No | order payload | `{ success, data }` |
| DELETE | `/api/orders/:id` | Delete order | No | N/A | `{ success, message }` |
| POST | `/api/shipments/` | Create shipment | No | shipment payload | `{ success, data }` |
| GET | `/api/shipments/` | List shipments | No | N/A | `{ success, data }` |
| GET | `/api/shipments/:id` | Get shipment by id | No | N/A | `{ success, data }` |
| PUT | `/api/shipments/:id` | Update shipment | No | shipment payload | `{ success, data }` |
| DELETE | `/api/shipments/:id` | Delete shipment | No | N/A | `{ success, message }` |
| POST | `/api/tracking/` | Create tracking update | No | tracking payload | `{ success, data }` |
| GET | `/api/tracking/` | List tracking updates | No | N/A | `{ success, data }` |
| GET | `/api/tracking/number/:trackingNumber` | Lookup tracking by tracking number | User | N/A | `{ success, data }` |
| GET | `/api/tracking/:id` | Get tracking by id | No | N/A | `{ success, data }` |
| PUT | `/api/tracking/:id` | Update tracking | No | tracking payload | `{ success, data }` |
| DELETE | `/api/tracking/:id` | Delete tracking | No | N/A | `{ success, message }` |
| GET | `/api/generate-qr/:trackingNumber` | Generate tracking QR data URL | No | N/A | `{ success, trackingNumber, qrCode }` |

### Content / Feedback / Communication
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| POST | `/api/articles/` | Create article | Admin | `{ title, content, ... }` | `{ success, data }` |
| GET | `/api/articles/` | List articles | No | N/A | `{ success, data }` |
| GET | `/api/articles/:id` | Get article | No | N/A | `{ success, data }` |
| PUT | `/api/articles/:id` | Update article | Admin | article payload | `{ success, data }` |
| DELETE | `/api/articles/:id` | Delete article | Admin | N/A | `{ success, message }` |
| GET | `/api/feedbacks/summary` | Feedback summary | No | N/A | `{ success, data }` |
| POST | `/api/feedbacks/` | Submit feedback | No | feedback payload | `{ success, data }` |
| POST | `/api/feedbacks/me` | Submit feedback as authenticated user | User | feedback payload | `{ success, data }` |
| GET | `/api/feedbacks/` | List feedbacks | No | N/A | `{ success, data }` |
| GET | `/api/feedbacks/:id` | Get feedback | No | N/A | `{ success, data }` |
| PUT | `/api/feedbacks/:id` | Update feedback | Admin | feedback payload | `{ success, data }` |
| DELETE | `/api/feedbacks/:id` | Delete feedback | Admin | N/A | `{ success, message }` |
| GET | `/api/support-chat/customer/conversation` | Get customer conversation | User | N/A | `{ success, data }` |
| POST | `/api/support-chat/customer/messages` | Send customer message | User | `{ message }` | `{ success, data }` |
| GET | `/api/support-chat/employee/conversations` | Employee conversations inbox | User | N/A | `{ success, data }` |
| POST | `/api/support-chat/employee/conversations/:id/messages` | Send employee message | User | `{ message }` | `{ success, data }` |
| DELETE | `/api/support-chat/employee/conversations/:id` | Delete employee conversation | User | N/A | `{ success, message }` |
| POST | `/api/newsletter/subscribe` | Subscribe current user email | User | `{ email }` | `{ success, message }` |
| GET | `/api/newsletter/employee` | Employee newsletter preview/data | Mock Employee | N/A | `{ success, data }` |
| GET | `/api/newsletter/employee/status` | Newsletter status | Mock Employee | N/A | `{ success, data }` |
| POST | `/api/newsletter/employee/send` | Send newsletter campaign | Mock Employee | `{ subject, content, ... }` | `{ success, message }` |
| GET | `/api/notifications/me` | List my notifications | User | query `limit?` | `{ success, data }` |
| GET | `/api/notifications/unread-count` | Unread count | User | N/A | `{ success, data }` |
| PATCH | `/api/notifications/read-all` | Mark all read | User | N/A | `{ success, data }` |
| PATCH | `/api/notifications/:id/read` | Mark one read | User | N/A | `{ success, data }` |

### Utility CRUD
| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|---|---|---|---|---|---|
| POST | `/api/vehicles/` | Create vehicle | No | vehicle payload | `{ success, data }` |
| GET | `/api/vehicles/` | List vehicles | No | N/A | `{ success, data }` |
| GET | `/api/vehicles/:id` | Get vehicle | No | N/A | `{ success, data }` |
| PUT | `/api/vehicles/:id` | Update vehicle | No | vehicle payload | `{ success, data }` |
| DELETE | `/api/vehicles/:id` | Delete vehicle | No | N/A | `{ success, message }` |
| POST | `/api/wallets/` | Create wallet | No | wallet payload | `{ success, data }` |
| GET | `/api/wallets/` | List wallets | No | N/A | `{ success, data }` |
| GET | `/api/wallets/:id` | Get wallet | No | N/A | `{ success, data }` |
| PUT | `/api/wallets/:id` | Update wallet | No | wallet payload | `{ success, data }` |
| DELETE | `/api/wallets/:id` | Delete wallet | No | N/A | `{ success, message }` |

## 10) Environment Variables
Create `backend/.env` using placeholders:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Auth
JWT_SECRET=your_jwt_secret

# Mail / Password reset / Newsletter
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM=no-reply@example.com
MAIL_FROM_NAME=Phoenix Express

# Optional runtime settings
NODE_ENV=development
SEQUELIZE_DEBUG=false
MOCK_EMPLOYEE_USER_ID=1
DASHBOARD_TIME_ZONE=Asia/Hebron
```

> Frontend currently uses hardcoded API base URL in `frontend/src/apis/api.js` (`http://localhost:5000/api`).

## 11) Installation and Setup
### 1. Clone repository
```bash
git clone <your-repo-url>
cd Phoenix-Express
```

### 2. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure PostgreSQL
- Create a PostgreSQL database (example: `phoenix_db`).
- Ensure DB user has access.
- Update `backend/.env` with your DB credentials.

### 4. Configure environment
- Copy values from `samples/.env.template` and extend with required variables above.
- Save as `backend/.env`.

### 5. Run migrations (database setup)
From `backend/`:
```bash
npx sequelize-cli db:migrate
```
Optional seed data:
```bash
npx sequelize-cli db:seed:all
```

### 6. Run backend
```bash
cd backend
npm start
```
Backend runs at: `http://localhost:5000`

### 7. Run frontend
```bash
cd frontend
npm start
```
Frontend runs at: `http://localhost:3000`

## 12) Available Scripts
### Root (`/package.json`)
- No runtime scripts defined (dependencies only).

### Backend (`backend/package.json`)
- `npm start` → start Express server (`node src/server.js`)
- `npm test` → placeholder script (currently exits with error: “no test specified”)

### Frontend (`frontend/package.json`)
- `npm start` → run React development server
- `npm run build` → create production build (CRA)
- `npm test` → run React tests
- `npm eject` → eject CRA configuration

## 13) Screenshots
> To be added.

- Home Page
- Tracking Page
- Customer Profile
- Employee Dashboard
- Admin Dashboard

## 14) Future Improvements
- Add comprehensive backend test suite (unit + integration) and replace placeholder backend test script.
- Add explicit API versioning and OpenAPI/Swagger documentation.
- Introduce centralized request validation layer (e.g., Joi/Zod).
- Harden route protection for all sensitive admin endpoints.
- Move hardcoded runtime values (e.g., backend port, frontend API URL) to environment configuration.
- Add Docker-based local setup for backend/frontend/PostgreSQL.
- Improve CI pipeline to include linting and backend checks.

## 15) Performance & Load Testing with k6

The project includes a k6 performance testing suite under `performance/k6/phoenix-load-test.js`.
The goal is to evaluate backend stability, latency, and behavior under realistic traffic patterns.

### Test Coverage

The suite covers the mandatory scenarios:

- `read-heavy`: incident/operations listing, orders, shipments, tracking, public content, and lookup endpoints.
- `write-heavy`: report submissions through feedback and customer order creation.
- `mixed`: normal operational traffic combining reads, customer/employee journeys, and report submissions.
- `spike`: sudden traffic increase up to 80 virtual users.
- `soak`: sustained full-system load over time.
- `full-system`: auth, admin, customer, employee, tracking, reports, orders, newsletter, and public content.

Main covered areas:

```text
Auth:       POST /api/auth/login
Admin:      /api/admin/dashboard, /api/admin/reports, /api/admin/regions,
            /api/admin/delegates, /api/admin/merchants,
            /api/admin/parcel-distribution, /api/admin/returned-shipments,
            /api/admin/handover-requests
Customer:   /api/customers/profile/me, /api/orders/me,
            /api/customers/settlements/me, /api/notifications/me,
            /api/notifications/unread-count
Employee:   /api/employees/dashboard, /api/employees/profile,
            /api/employees/orders, /api/employees/wallet
Operations: /api/orders, /api/shipments, /api/orders/regions,
            /api/feedbacks/summary, /api/wallets
Tracking:   /api/tracking/number/:trackingNumber
Public:     /, /api/articles, /api/photogalleries,
            /api/site-content/about, /api/vehicles
Writes:     POST /api/feedbacks, POST /api/orders,
            POST /api/newsletter/subscribe
```

### Running Tests

Start the backend first:

```bash
cd backend
npm start
```

Then run from the project root:

```bash
npm run perf:smoke
npm run perf:read
npm run perf:write
npm run perf:mixed
npm run perf:full
npm run perf:spike
npm run perf:soak
```

Short soak test used during local validation:

```bash
k6 run -e PROFILE=soak -e SOAK_DURATION=5m -e SOAK_VUS=10 performance/k6/phoenix-load-test.js
```

### Thresholds

The k6 script uses these acceptance thresholds:

- Failed requests must stay below `5%`.
- Overall p95 latency must stay below `1200ms`.
- Read p95 latency must stay below `900ms`.
- Write p95 latency must stay below `1500ms`.
- Auth p95 latency must stay below `1000ms`.
- Admin/customer/employee p95 latency must stay below `1200ms`.
- Tracking p95 latency must stay below `1000ms`.

### Results

Test environment:

```text
Date: 2026-05-14
Machine: local development machine
Backend URL: http://localhost:5000
Database: local development PostgreSQL
k6 version: 1.7.1
```

| Scenario | Result | Failed Requests | Checks Passed | p95 Overall Latency | p95 Read | p95 Write | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| smoke | PASS | 0.00% | 100.00% | 109.84ms | 110.17ms | 31.66ms | Full-system validation before longer runs |
| read-heavy | PASS | 0.00% | 100.00% | 134.59ms | 133.91ms | N/A | Read-heavy latency improved after limiting heavy list endpoints |
| write-heavy | PASS | 0.00% | 100.00% | 18.89ms | N/A | 18.79ms | Created feedback reports and test orders |
| mixed | PASS | 0.00% | 100.00% | 229.88ms | 240.04ms | 177.58ms | Simulates normal customer/employee usage |
| spike | PASS | 0.00% | 100.00% | 334.32ms | 341.32ms | 186.98ms | System stayed responsive at 80 virtual users |
| soak | STABLE / READ LATENCY THRESHOLD EXCEEDED | 0.00% | 100.00% | 1.09s | 1096.64ms | 25.44ms | 5-minute sustained load stayed available; read p95 was slightly above the strict target |

Detailed run metrics:

| Scenario | Max VUs | Duration | HTTP Requests | Iterations | Data Received |
| --- | ---: | ---: | ---: | ---: | ---: |
| smoke | 1 | 10s | 293 | 9 | 9.5 MB |
| read-heavy | 25 | 2m | 16986 | 1306 | 111 MB |
| write-heavy | 18 | 2m | 2841 | 1133 | 3.3 MB |
| mixed | 25 | 3m | 9344 | 2155 | 939 MB |
| spike | 80 | 1m55s | 18340 | 4231 | 130 MB |
| soak | 10 | 5m | 33451 | 1060 | 1.0 GB |

### Performance Improvements Applied

During testing, bottlenecks were found in heavy read endpoints. The following optimizations were applied:

- Added optional `limit` support to heavy list endpoints such as orders, shipments, admin reports, customer orders, customer lists, and employee orders.
- Updated k6 to request bounded list sizes using `LIST_LIMIT=25`.
- Optimized `/api/feedbacks/summary` to use aggregate queries instead of loading all feedback rows.
- Optimized customer settlement calculations using database `SUM` queries.
- Limited employee dashboard task loading.
- Adjusted full-system soak traffic to avoid repeatedly hitting every heavy admin endpoint on every iteration.

### Interpretation

- The system showed strong functional stability: all scenarios reported `0.00%` failed requests and `100.00%` successful checks.
- Read-heavy performance improved from about `1.16s` p95 to `133.91ms` p95 after endpoint limiting.
- Spike performance improved from about `3.33s` p95 to `334.32ms` p95 after backend and k6 tuning.
- The only remaining strict-threshold issue was the soak read p95, which was `1096.64ms` against a `900ms` target. The system stayed available, but this indicates future work for caching and indexing.

Recommended next improvements:

- Add indexes for frequently sorted/filterable columns.
- Cache admin dashboard and report summaries.
- Add proper pagination metadata for frontend list pages.
- Run tests again on a staging server closer to production conditions.


## 16) Authors & Contributors

| Name   | GitHub | LinkedIn |
|--------|--------|----------|
| Ahmad  | [Ahmad-IR122](https://github.com/Ahmad-IR122/) |[ِAhmad Irshaid](https://www.linkedin.com/in/ahmadikirshaid/) |
| Ammal  | [Amaal2005](https://github.com/amaal2005) | [Aamaal Jumaa‏](https://www.linkedin.com/in/amaal-feras-425067382/)  |
| Raghad | [Raghad Shaar](https://github.com/raghadshaar) | [Raghad Shaar](https://www.linkedin.com/in/raghad-shaar/) |
