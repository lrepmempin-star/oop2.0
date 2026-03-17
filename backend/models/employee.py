from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid


class EmployeeBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    first_name: str
    last_name: str
    email: str
    department: str
    position: str
    employee_type: str
    date_hired: str
    status: str = "active"
    basic_salary: float = 0.0
    hourly_rate: float = 0.0
    daily_rate: float = 0.0
    hours_per_week: Optional[float] = None
    contract_end_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Employee(ABC):
    def __init__(self, data: Dict[str, Any]):
        self._id = data.get('id', str(uuid.uuid4()))
        self._employee_id = data['employee_id']
        self._first_name = data['first_name']
        self._last_name = data['last_name']
        self._email = data['email']
        self._department = data['department']
        self._position = data['position']
        self._employee_type = data['employee_type']
        self._date_hired = data['date_hired']
        self._status = data.get('status', 'active')
        self.__basic_salary = data.get('basic_salary', 0.0)
        self._created_at = data.get('created_at', datetime.now(timezone.utc).isoformat())
        self._updated_at = data.get('updated_at', datetime.now(timezone.utc).isoformat())

    @property
    def id(self) -> str:
        return self._id

    @property
    def employee_id(self) -> str:
        return self._employee_id

    @property
    def full_name(self) -> str:
        return f"{self._first_name} {self._last_name}"

    @property
    def first_name(self) -> str:
        return self._first_name

    @property
    def last_name(self) -> str:
        return self._last_name

    @property
    def email(self) -> str:
        return self._email

    @property
    def department(self) -> str:
        return self._department

    @property
    def position(self) -> str:
        return self._position

    @property
    def employee_type(self) -> str:
        return self._employee_type

    @property
    def date_hired(self) -> str:
        return self._date_hired

    @property
    def status(self) -> str:
        return self._status

    @property
    def basic_salary(self) -> float:
        return self.__basic_salary

    @basic_salary.setter
    def basic_salary(self, value: float):
        if value < 0:
            raise ValueError("Salary cannot be negative")
        self.__basic_salary = value
        self._updated_at = datetime.now(timezone.utc).isoformat()

    @status.setter
    def status(self, value: str):
        valid_statuses = ['active', 'inactive', 'terminated']
        if value not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        self._status = value
        self._updated_at = datetime.now(timezone.utc).isoformat()

    @abstractmethod
    def compute_salary(self, hours_worked: float = 0, days_worked: int = 0) -> float:
        pass

    @abstractmethod
    def get_salary_breakdown(self, hours_worked: float = 0, days_worked: int = 0) -> Dict[str, Any]:
        pass

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self._id,
            'employee_id': self._employee_id,
            'first_name': self._first_name,
            'last_name': self._last_name,
            'email': self._email,
            'department': self._department,
            'position': self._position,
            'employee_type': self._employee_type,
            'date_hired': self._date_hired,
            'status': self._status,
            'basic_salary': self.__basic_salary,
            'created_at': self._created_at,
            'updated_at': self._updated_at
        }

    def __str__(self) -> str:
        return f"{self.employee_type.title()}Employee({self.employee_id}: {self.full_name})"

    def __repr__(self) -> str:
        return self.__str__()


class FullTimeEmployee(Employee):
    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self._hours_per_day = 8
        self._days_per_month = 22

    def compute_salary(self, hours_worked: float = 0, days_worked: int = 0) -> float:
        monthly_salary = self.basic_salary
        if days_worked > 0:
            daily_rate = self.basic_salary / self._days_per_month
            base_pay = daily_rate * min(days_worked, self._days_per_month)
            standard_hours = days_worked * self._hours_per_day
            if hours_worked > standard_hours:
                overtime_hours = hours_worked - standard_hours
                hourly_rate = daily_rate / self._hours_per_day
                overtime_pay = overtime_hours * hourly_rate * 1.25
                return base_pay + overtime_pay
            return base_pay
        return monthly_salary

    def get_salary_breakdown(self, hours_worked: float = 0, days_worked: int = 0) -> Dict[str, Any]:
        daily_rate = self.basic_salary / self._days_per_month
        hourly_rate = daily_rate / self._hours_per_day
        if days_worked > 0:
            base_pay = daily_rate * min(days_worked, self._days_per_month)
            standard_hours = days_worked * self._hours_per_day
            overtime_hours = max(0, hours_worked - standard_hours)
            overtime_pay = overtime_hours * hourly_rate * 1.25
        else:
            base_pay = self.basic_salary
            overtime_hours = 0
            overtime_pay = 0
        return {
            'employee_type': 'full_time',
            'monthly_salary': self.basic_salary,
            'daily_rate': round(daily_rate, 2),
            'hourly_rate': round(hourly_rate, 2),
            'days_worked': days_worked if days_worked > 0 else self._days_per_month,
            'hours_worked': hours_worked if hours_worked > 0 else self._days_per_month * self._hours_per_day,
            'base_pay': round(base_pay, 2),
            'overtime_hours': overtime_hours,
            'overtime_pay': round(overtime_pay, 2),
            'gross_salary': round(base_pay + overtime_pay, 2)
        }

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['hours_per_day'] = self._hours_per_day
        data['days_per_month'] = self._days_per_month
        return data


class PartTimeEmployee(Employee):
    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self._hourly_rate = data.get('hourly_rate', 0.0)
        self._hours_per_week = data.get('hours_per_week', 20)

    @property
    def hourly_rate(self) -> float:
        return self._hourly_rate

    @hourly_rate.setter
    def hourly_rate(self, value: float):
        if value < 0:
            raise ValueError("Hourly rate cannot be negative")
        self._hourly_rate = value

    @property
    def hours_per_week(self) -> float:
        return self._hours_per_week

    def compute_salary(self, hours_worked: float = 0, days_worked: int = 0) -> float:
        if hours_worked > 0:
            return self._hourly_rate * hours_worked
        return self._hourly_rate * self._hours_per_week * 4

    def get_salary_breakdown(self, hours_worked: float = 0, days_worked: int = 0) -> Dict[str, Any]:
        actual_hours = hours_worked if hours_worked > 0 else self._hours_per_week * 4
        gross = self._hourly_rate * actual_hours
        return {
            'employee_type': 'part_time',
            'hourly_rate': self._hourly_rate,
            'hours_per_week': self._hours_per_week,
            'hours_worked': actual_hours,
            'days_worked': days_worked,
            'base_pay': round(gross, 2),
            'overtime_hours': 0,
            'overtime_pay': 0,
            'gross_salary': round(gross, 2)
        }

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['hourly_rate'] = self._hourly_rate
        data['hours_per_week'] = self._hours_per_week
        return data


class ContractEmployee(Employee):
    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self._daily_rate = data.get('daily_rate', 0.0)
        self._contract_end_date = data.get('contract_end_date')

    @property
    def daily_rate(self) -> float:
        return self._daily_rate

    @daily_rate.setter
    def daily_rate(self, value: float):
        if value < 0:
            raise ValueError("Daily rate cannot be negative")
        self._daily_rate = value

    @property
    def contract_end_date(self) -> Optional[str]:
        return self._contract_end_date

    def compute_salary(self, hours_worked: float = 0, days_worked: int = 0) -> float:
        if days_worked > 0:
            return self._daily_rate * days_worked
        return self._daily_rate * 22

    def get_salary_breakdown(self, hours_worked: float = 0, days_worked: int = 0) -> Dict[str, Any]:
        actual_days = days_worked if days_worked > 0 else 22
        gross = self._daily_rate * actual_days
        return {
            'employee_type': 'contract',
            'daily_rate': self._daily_rate,
            'days_worked': actual_days,
            'hours_worked': hours_worked if hours_worked > 0 else actual_days * 8,
            'contract_end_date': self._contract_end_date,
            'base_pay': round(gross, 2),
            'overtime_hours': 0,
            'overtime_pay': 0,
            'gross_salary': round(gross, 2)
        }

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['daily_rate'] = self._daily_rate
        data['contract_end_date'] = self._contract_end_date
        return data


def create_employee(data: Dict[str, Any]) -> Employee:
    employee_type = data.get('employee_type', 'full_time')
    if employee_type == 'full_time':
        return FullTimeEmployee(data)
    elif employee_type == 'part_time':
        return PartTimeEmployee(data)
    elif employee_type == 'contract':
        return ContractEmployee(data)
    else:
        raise ValueError(f"Unknown employee type: {employee_type}")
