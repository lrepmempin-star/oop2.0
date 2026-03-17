# MotorPH OOP Payroll System

## Overview
A full-stack payroll management system built to demonstrate Object-Oriented Programming (OOP) principles. The application manages employees, attendance, deductions, and payslip generation for MotorPH.

## Architecture

### Frontend
- **Framework:** React (Create React App + CRACO)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives (`@radix-ui/*`)
- **Routing:** React Router DOM v7
- **Charts:** Recharts
- **State/Forms:** React Hook Form + Zod
- **Port:** 5000

### Backend
- **Framework:** FastAPI (Python)
- **Storage:** In-memory Python dicts (no database required)
- **Auth:** JWT (pyjwt) + bcrypt
- **Port:** 8000

## Project Structure

```
/
├── frontend/               # React app
│   ├── public/
│   │   └── index.html      # App shell (cleaned)
│   ├── src/
│   │   ├── pages/          # Route-level page components
│   │   ├── components/     # Reusable UI components
│   │   └── App.js          # Root router
│   ├── craco.config.js     # CRACO config (allowedHosts, alias, watchOptions)
│   └── package.json        # Frontend deps (proxy → localhost:8000)
├── backend/
│   ├── server.py           # FastAPI app, all routes
│   ├── models/
│   │   ├── employee.py     # Employee, FullTime, PartTime, Contract classes
│   │   ├── deductions.py   # DeductionCalculator
│   │   ├── attendance.py   # AttendanceTracker, AttendanceRecord
│   │   ├── payroll.py      # PayrollProcessor, Payslip
│   │   └── __init__.py     # Public model exports
│   └── requirements.txt    # Python dependencies
└── node_modules/           # Root-level JS packages (shared by frontend)
```

## Default Admin Account
On first startup the backend seeds a default admin user:
- **Email:** `admin@motorph.com`
- **Password:** `admin123`

## API Proxy
The CRA dev server proxies all `/api/*` requests to `http://localhost:8000` via the `"proxy"` field in `frontend/package.json`. `REACT_APP_BACKEND_URL` is set to empty string so the frontend uses this proxy automatically.
