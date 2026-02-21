# 🚛 FleetFlow — Enterprise Fleet Management System

**FleetFlow** is a comprehensive, full-stack SaaS solution designed to streamline logistics operations. It provides real-time visibility into fleet utilization, driver compliance, maintenance tracking, and financial analytics through a sleek, highly-responsive dashboard.

---

## 🚀 Key Features

- **Dynamic Dashboard:** Real-time KPIs for fleet utilization, revenue, and active trips.
- **Asset Registry:** Manage vehicles and driver profiles with ease.
- **Trip Dispatcher:** End-to-end workflow for managing cargo movements.
- **Maintenance Intelligence:** Track service history and pending repairs to minimize downtime.
- **Fuel Tracking:** Monitor expenses and fuel consumption per vehicle/trip.
- **Responsive Design:** Optimized for all devices—from ultra-wide monitors to mobile tablets.
- **Role-Based Security:** Custom workspaces for Managers, Dispatchers, and Analysts.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Lucide-React, Recharts.
- **Backend:** Node.js, Express.
- **Database:** PostgreSQL with Prisma ORM.
- **Styling:** Custom Enterprise CSS Design System (Clean, Minimal, Modern).
- **Branding:** Custom-generated professional identity.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database
- npm or yarn

### 2. Installation
Clone the repository and install dependencies for both Backend and Frontend:

```bash
# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
Create a `.env` file in the `backend` directory based on `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleetflow"
JWT_SECRET="your-secret-key"
PORT=5000
```

### 4. Database Initialization
Run the following commands in the `backend` directory to set up your database:

```bash
# Push schema and generate Prisma client
npx prisma db push

# Seed the database with demo data (7 entries per model)
npm run db:seed
```

---

## 🖥️ Running the Application

### Start Backend
In the `backend` directory:
```bash
npm run dev
```

### Start Frontend
In the `frontend` directory:
```bash
npm run dev
```
The application will be available at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Credentials

Access the system using the following roles. All accounts use the same password.

**Password:** `FleetFlow@123`

| Role | Email ID |
| :--- | :--- |
| **Fleet Manager** | `manager@fleetflow.com` |
| **Dispatcher** | `dispatcher@fleetflow.com` |
| **Safety Officer** | `safety@fleetflow.com` |
| **Financial Analyst** | `analyst@fleetflow.com` |

---

## 🏗️ Project Structure

```text
├── backend/            # Express API & Prisma Schema
│   ├── prisma/         # Schema and Migration/Seed files
│   ├── routes/         # API Endpoints
│   └── server.js       # Main server entry
├── frontend/           # Vite + React Client
│   ├── src/
│   │   ├── components/ # UI Components
│   │   ├── layout/     # AppLayout & Sidebar
│   │   ├── pages/      # Feature-specific pages
│   │   └── styles/     # Custom CSS Design System
│   └── index.html      # Main HTML entry
└── README.md           # Documentation
```

---

## 📝 License
Proprietary. Developed for FleetFlow Operations.
