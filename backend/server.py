from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from models import (
    Employee, FullTimeEmployee, PartTimeEmployee, ContractEmployee,
    PayrollProcessor, Payslip,
    DeductionCalculator,
    AttendanceTracker, AttendanceRecord
)
from models.employee import create_employee


# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ── In-memory store ────────────────────────────────────────────────────────────
store: Dict[str, Dict[str, Any]] = {
    "users": {},
    "employees": {},
    "attendance": {},
    "payslips": {},
}


# ── JWT config ─────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "motorph-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


# ── App / router ───────────────────────────────────────────────────────────────
app = FastAPI(title="MotorPH OOP Payroll System", version="2.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

payroll_processor = PayrollProcessor()
deduction_calculator = DeductionCalculator()
attendance_tracker = AttendanceTracker()


# ── Pydantic models ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "user"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: str
    department: str
    position: str
    employee_type: str
    date_hired: str
    basic_salary: float = 0.0
    hourly_rate: float = 0.0
    daily_rate: float = 0.0
    hours_per_week: Optional[float] = None
    contract_end_date: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    basic_salary: Optional[float] = None
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    hours_per_week: Optional[float] = None
    contract_end_date: Optional[str] = None


class AttendanceClockIn(BaseModel):
    employee_id: str
    timestamp: Optional[str] = None


class AttendanceClockOut(BaseModel):
    record_id: str
    timestamp: Optional[str] = None


class PayrollProcessRequest(BaseModel):
    employee_ids: Optional[List[str]] = None
    pay_period_start: str
    pay_period_end: str


class DeductionCalculateRequest(BaseModel):
    gross_salary: float


# ── Helpers ────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = store["users"].get(payload["user_id"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def find_user_by_email(email: str):
    return next((u for u in store["users"].values() if u["email"] == email), None)


def find_employee_by_employee_id(employee_id: str):
    return next(
        (e for e in store["employees"].values() if e["employee_id"] == employee_id), None
    )


def filter_employees(employee_type=None, status=None, department=None):
    results = list(store["employees"].values())
    if employee_type:
        results = [e for e in results if e.get("employee_type") == employee_type]
    if status:
        results = [e for e in results if e.get("status") == status]
    if department:
        results = [e for e in results if e.get("department") == department]
    return results


def filter_attendance(employee_id=None, date=None, start_date=None, end_date=None):
    records = list(store["attendance"].values())
    if employee_id:
        records = [r for r in records if r.get("employee_id") == employee_id]
    if date:
        records = [r for r in records if r.get("date") == date]
    if start_date and end_date:
        records = [r for r in records if start_date <= r.get("date", "") <= end_date]
    return sorted(records, key=lambda r: r.get("date", ""), reverse=True)


# ── Auth routes ────────────────────────────────────────────────────────────────

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    if find_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store["users"][user_id] = user

    token = create_token(user_id, user_data.email, user_data.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
        ),
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = find_user_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            role=user["role"],
        ),
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        role=current_user["role"],
    )


# ── Employee routes ────────────────────────────────────────────────────────────

@api_router.post("/employees", response_model=Dict[str, Any])
async def create_employee_api(employee_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if find_employee_by_employee_id(employee_data.employee_id):
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    emp_dict = employee_data.model_dump()
    emp_dict["id"] = str(uuid.uuid4())
    emp_dict["status"] = "active"
    now = datetime.now(timezone.utc).isoformat()
    emp_dict["created_at"] = now
    emp_dict["updated_at"] = now

    employee = create_employee(emp_dict)
    final_data = employee.to_dict()

    store["employees"][final_data["id"]] = final_data
    return final_data


@api_router.get("/employees", response_model=List[Dict[str, Any]])
async def get_employees(
    employee_type: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    return filter_employees(employee_type, status, department)


@api_router.get("/employees/{employee_id}", response_model=Dict[str, Any])
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = store["employees"].get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@api_router.put("/employees/{employee_id}", response_model=Dict[str, Any])
async def update_employee(
    employee_id: str,
    update_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_user),
):
    employee = store["employees"].get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    changes = {k: v for k, v in update_data.model_dump().items() if v is not None}
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    employee.update(changes)
    store["employees"][employee_id] = employee
    return employee


@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    if employee_id not in store["employees"]:
        raise HTTPException(status_code=404, detail="Employee not found")
    del store["employees"][employee_id]
    return {"message": "Employee deleted successfully"}


# ── Attendance routes ──────────────────────────────────────────────────────────

@api_router.post("/attendance/clock-in", response_model=Dict[str, Any])
async def clock_in(data: AttendanceClockIn, current_user: dict = Depends(get_current_user)):
    if data.employee_id not in store["employees"]:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    already_in = any(
        r["employee_id"] == data.employee_id and r["date"] == today and r.get("clock_out") is None
        for r in store["attendance"].values()
    )
    if already_in:
        raise HTTPException(status_code=400, detail="Already clocked in for today")

    record = attendance_tracker.clock_in(data.employee_id, data.timestamp)
    store["attendance"][record["id"]] = record
    return record


@api_router.post("/attendance/clock-out", response_model=Dict[str, Any])
async def clock_out(data: AttendanceClockOut, current_user: dict = Depends(get_current_user)):
    record = store["attendance"].get(data.record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if record.get("clock_out"):
        raise HTTPException(status_code=400, detail="Already clocked out")

    updated_record = attendance_tracker.clock_out(record, data.timestamp)
    store["attendance"][data.record_id] = updated_record
    return updated_record


@api_router.get("/attendance", response_model=List[Dict[str, Any]])
async def get_attendance(
    employee_id: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    return filter_attendance(employee_id, date, start_date, end_date)


@api_router.get("/attendance/today", response_model=List[Dict[str, Any]])
async def get_today_attendance(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return [r for r in store["attendance"].values() if r.get("date") == today]


@api_router.get("/attendance/summary/{employee_id}", response_model=Dict[str, Any])
async def get_attendance_summary(
    employee_id: str,
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user),
):
    prefix = f"{year}-{month:02d}"
    records = [
        r for r in store["attendance"].values()
        if r.get("employee_id") == employee_id and r.get("date", "").startswith(prefix)
    ]
    return attendance_tracker.get_monthly_attendance(employee_id, year, month, records)


# ── Payroll routes ─────────────────────────────────────────────────────────────

@api_router.post("/payroll/process", response_model=List[Dict[str, Any]])
async def process_payroll(request: PayrollProcessRequest, current_user: dict = Depends(get_current_user)):
    employees = [
        e for e in store["employees"].values()
        if e.get("status") == "active"
        and (not request.employee_ids or e["id"] in request.employee_ids)
    ]
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found")

    all_attendance = {
        emp["id"]: [
            r for r in store["attendance"].values()
            if r.get("employee_id") == emp["id"]
            and request.pay_period_start <= r.get("date", "") <= request.pay_period_end
        ]
        for emp in employees
    }

    payslips = payroll_processor.process_batch_payroll(
        employees, all_attendance, request.pay_period_start, request.pay_period_end
    )

    result = []
    for ps in payslips:
        ps_dict = ps.to_dict()
        store["payslips"][ps_dict["id"]] = ps_dict
        result.append(ps_dict)

    return result


@api_router.get("/payroll/payslips", response_model=List[Dict[str, Any]])
async def get_payslips(
    employee_id: Optional[str] = None,
    pay_period_start: Optional[str] = None,
    pay_period_end: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    payslips = list(store["payslips"].values())
    if employee_id:
        payslips = [p for p in payslips if p.get("employee_id") == employee_id]
    if pay_period_start:
        payslips = [p for p in payslips if p.get("pay_period_start", "") >= pay_period_start]
    if pay_period_end:
        payslips = [p for p in payslips if p.get("pay_period_end", "") <= pay_period_end]
    return sorted(payslips, key=lambda p: p.get("generated_at", ""), reverse=True)


@api_router.get("/payroll/payslip/{payslip_id}", response_model=Dict[str, Any])
async def get_payslip(payslip_id: str, current_user: dict = Depends(get_current_user)):
    payslip = store["payslips"].get(payslip_id)
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return payslip


@api_router.post("/payroll/estimate", response_model=Dict[str, Any])
async def estimate_payroll(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = store["employees"].get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return payroll_processor.calculate_quick_estimate(employee)


@api_router.get("/payroll/summary", response_model=Dict[str, Any])
async def get_payroll_summary(
    pay_period_start: str,
    pay_period_end: str,
    current_user: dict = Depends(get_current_user),
):
    ps_data = [
        p for p in store["payslips"].values()
        if p.get("pay_period_start") == pay_period_start
        and p.get("pay_period_end") == pay_period_end
    ]
    payslips = [
        Payslip(
            id=p["id"],
            employee_id=p["employee_id"],
            employee_name=p.get("employee_name", ""),
            employee_type=p.get("employee_type", ""),
            department=p.get("department", ""),
            position=p.get("position", ""),
            pay_period_start=p["pay_period_start"],
            pay_period_end=p["pay_period_end"],
            days_worked=p.get("days_worked", 0),
            hours_worked=p.get("hours_worked", 0),
            basic_pay=p.get("earnings", {}).get("basic_pay", 0),
            overtime_hours=p.get("earnings", {}).get("overtime_hours", 0),
            overtime_pay=p.get("earnings", {}).get("overtime_pay", 0),
            gross_pay=p.get("earnings", {}).get("gross_pay", 0),
            sss=p.get("deductions", {}).get("sss", 0),
            philhealth=p.get("deductions", {}).get("philhealth", 0),
            pagibig=p.get("deductions", {}).get("pagibig", 0),
            withholding_tax=p.get("deductions", {}).get("withholding_tax", 0),
            total_deductions=p.get("deductions", {}).get("total", 0),
            net_pay=p.get("net_pay", 0),
            status=p.get("status", "generated"),
            generated_at=p.get("generated_at", ""),
        )
        for p in ps_data
    ]
    return payroll_processor.get_payroll_summary(payslips)


# ── Deduction routes ───────────────────────────────────────────────────────────

@api_router.post("/deductions/calculate", response_model=Dict[str, Any])
async def calculate_deductions(request: DeductionCalculateRequest):
    return deduction_calculator.calculate_all_deductions(request.gross_salary)


@api_router.get("/deductions/tables")
async def get_deduction_tables():
    return {
        "sss": {
            "description": "SSS Contribution Table (2024)",
            "brackets": len(deduction_calculator.SSS_TABLE),
            "min_contribution": 180.00,
            "max_contribution": 1350.00,
        },
        "philhealth": {
            "description": "PhilHealth Premium (2024)",
            "rate": "5% of salary",
            "min_premium": 500.00,
            "max_premium": 5000.00,
            "employee_share": "50%",
        },
        "pagibig": {
            "description": "Pag-IBIG Fund Contribution",
            "rate_low": "1% for salary <= 1500",
            "rate_high": "2% for salary > 1500",
            "max_contribution": 100.00,
        },
        "withholding_tax": {
            "description": "TRAIN Law Tax Table (2024)",
            "brackets": [
                {"range": "Up to ₱250,000/year", "rate": "Exempt"},
                {"range": "₱250,001 - ₱400,000", "rate": "15% of excess over ₱250K"},
                {"range": "₱400,001 - ₱800,000", "rate": "₱22,500 + 20% of excess over ₱400K"},
                {"range": "₱800,001 - ₱2,000,000", "rate": "₱102,500 + 25% of excess over ₱800K"},
                {"range": "₱2,000,001 - ₱8,000,000", "rate": "₱402,500 + 30% of excess over ₱2M"},
                {"range": "Over ₱8,000,000", "rate": "₱2,202,500 + 35% of excess over ₱8M"},
            ],
        },
    }


# ── Dashboard routes ───────────────────────────────────────────────────────────

@api_router.get("/dashboard/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    active_employees = [e for e in store["employees"].values() if e.get("status") == "active"]

    total_monthly_payroll = 0
    for emp in active_employees:
        try:
            employee_obj = create_employee(emp)
            total_monthly_payroll += employee_obj.compute_salary()
        except Exception:
            continue

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_attendance = sum(1 for r in store["attendance"].values() if r.get("date") == today)

    recent = sorted(active_employees, key=lambda e: e.get("created_at", ""), reverse=True)[:5]

    return {
        "total_employees": len(active_employees),
        "employee_types": {
            "full_time": sum(1 for e in active_employees if e.get("employee_type") == "full_time"),
            "part_time": sum(1 for e in active_employees if e.get("employee_type") == "part_time"),
            "contract": sum(1 for e in active_employees if e.get("employee_type") == "contract"),
        },
        "monthly_payroll": round(total_monthly_payroll, 2),
        "today_attendance": today_attendance,
        "recent_employees": recent,
    }


# ── OOP concepts route ─────────────────────────────────────────────────────────

@api_router.get("/oop/class-hierarchy")
async def get_class_hierarchy():
    return {
        "classes": [
            {
                "name": "Employee",
                "type": "abstract_class",
                "access": "public",
                "description": "Parent class for all employee types",
                "attributes": [
                    {"name": "id", "access": "protected", "type": "str"},
                    {"name": "employee_id", "access": "protected", "type": "str"},
                    {"name": "first_name", "access": "protected", "type": "str"},
                    {"name": "last_name", "access": "protected", "type": "str"},
                    {"name": "email", "access": "protected", "type": "str"},
                    {"name": "department", "access": "protected", "type": "str"},
                    {"name": "position", "access": "protected", "type": "str"},
                    {"name": "basic_salary", "access": "private", "type": "float"},
                ],
                "methods": [
                    {"name": "compute_salary()", "access": "public", "type": "abstract"},
                    {"name": "get_salary_breakdown()", "access": "public", "type": "abstract"},
                    {"name": "to_dict()", "access": "public", "type": "concrete"},
                    {"name": "full_name", "access": "public", "type": "property"},
                ],
            },
            {
                "name": "FullTimeEmployee",
                "type": "class",
                "extends": "Employee",
                "access": "public",
                "description": "Full-time employees with monthly salary",
                "attributes": [
                    {"name": "hours_per_day", "access": "protected", "type": "int"},
                    {"name": "days_per_month", "access": "protected", "type": "int"},
                ],
                "methods": [
                    {"name": "compute_salary()", "access": "public", "type": "override",
                     "description": "Calculates monthly salary with overtime"},
                    {"name": "get_salary_breakdown()", "access": "public", "type": "override"},
                ],
            },
            {
                "name": "PartTimeEmployee",
                "type": "class",
                "extends": "Employee",
                "access": "public",
                "description": "Part-time employees with hourly rate",
                "attributes": [
                    {"name": "hourly_rate", "access": "protected", "type": "float"},
                    {"name": "hours_per_week", "access": "protected", "type": "float"},
                ],
                "methods": [
                    {"name": "compute_salary()", "access": "public", "type": "override",
                     "description": "Calculates salary based on hours worked"},
                    {"name": "get_salary_breakdown()", "access": "public", "type": "override"},
                ],
            },
            {
                "name": "ContractEmployee",
                "type": "class",
                "extends": "Employee",
                "access": "public",
                "description": "Contract employees with daily rate",
                "attributes": [
                    {"name": "daily_rate", "access": "protected", "type": "float"},
                    {"name": "contract_end_date", "access": "protected", "type": "str"},
                ],
                "methods": [
                    {"name": "compute_salary()", "access": "public", "type": "override",
                     "description": "Calculates salary based on days worked"},
                    {"name": "get_salary_breakdown()", "access": "public", "type": "override"},
                ],
            },
            {
                "name": "PayrollProcessor",
                "type": "service_class",
                "access": "public",
                "description": "Central payroll processing orchestrator",
                "relationships": [
                    {"type": "composition", "target": "DeductionCalculator"},
                    {"type": "composition", "target": "AttendanceTracker"},
                    {"type": "uses", "target": "Employee"},
                ],
                "methods": [
                    {"name": "process_payroll()", "access": "public", "type": "concrete"},
                    {"name": "process_batch_payroll()", "access": "public", "type": "concrete"},
                    {"name": "calculate_quick_estimate()", "access": "public", "type": "concrete"},
                ],
            },
            {
                "name": "DeductionCalculator",
                "type": "service_class",
                "access": "public",
                "description": "Handles all payroll deduction calculations",
                "methods": [
                    {"name": "calculate_sss()", "access": "public", "type": "concrete"},
                    {"name": "calculate_philhealth()", "access": "public", "type": "concrete"},
                    {"name": "calculate_pagibig()", "access": "public", "type": "concrete"},
                    {"name": "calculate_withholding_tax()", "access": "public", "type": "concrete"},
                    {"name": "calculate_all_deductions()", "access": "public", "type": "concrete"},
                ],
            },
            {
                "name": "AttendanceTracker",
                "type": "service_class",
                "access": "public",
                "description": "Employee attendance tracking service",
                "methods": [
                    {"name": "clock_in()", "access": "public", "type": "concrete"},
                    {"name": "clock_out()", "access": "public", "type": "concrete"},
                    {"name": "calculate_period_summary()", "access": "public", "type": "concrete"},
                ],
            },
        ],
        "relationships": [
            {"from": "FullTimeEmployee", "to": "Employee", "type": "inheritance"},
            {"from": "PartTimeEmployee", "to": "Employee", "type": "inheritance"},
            {"from": "ContractEmployee", "to": "Employee", "type": "inheritance"},
            {"from": "PayrollProcessor", "to": "DeductionCalculator", "type": "composition"},
            {"from": "PayrollProcessor", "to": "AttendanceTracker", "type": "composition"},
            {"from": "PayrollProcessor", "to": "Employee", "type": "dependency"},
        ],
        "oop_concepts": {
            "inheritance": {
                "description": "FullTimeEmployee, PartTimeEmployee, and ContractEmployee inherit from Employee",
                "example": "class FullTimeEmployee(Employee):",
            },
            "polymorphism": {
                "description": "compute_salary() method behaves differently based on employee type",
                "example": "Each subclass overrides compute_salary() with its own implementation",
            },
            "encapsulation": {
                "description": "Private and protected attributes with getters/setters",
                "example": "__basic_salary is private, accessed via @property decorator",
            },
            "abstraction": {
                "description": "Employee is an abstract class with abstract methods",
                "example": "@abstractmethod def compute_salary()",
            },
            "composition": {
                "description": "PayrollProcessor composes DeductionCalculator and AttendanceTracker",
                "example": "self._deduction_calculator = DeductionCalculator()",
            },
        },
    }


# ── Health / root ──────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "MotorPH OOP Payroll System API", "version": "2.0.0"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ── App assembly ───────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_default_admin():
    admin_email = "admin@motorph.com"
    if not find_user_by_email(admin_email):
        admin_id = str(uuid.uuid4())
        store["users"][admin_id] = {
            "id": admin_id,
            "email": admin_email,
            "password_hash": hash_password("admin123"),
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        logger.info("Default admin created — email: admin@motorph.com  password: admin123")
