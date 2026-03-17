from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
from pydantic import BaseModel, Field
import uuid

from .employee import Employee, create_employee
from .deductions import DeductionCalculator
from .attendance import AttendanceTracker


class PayslipBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    pay_period_start: str
    pay_period_end: str
    basic_pay: float
    overtime_pay: float = 0.0
    gross_pay: float
    sss: float = 0.0
    philhealth: float = 0.0
    pagibig: float = 0.0
    withholding_tax: float = 0.0
    total_deductions: float = 0.0
    net_pay: float
    status: str = "generated"
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None


@dataclass
class Payslip:
    id: str
    employee_id: str
    employee_name: str
    employee_type: str
    department: str
    position: str
    pay_period_start: str
    pay_period_end: str
    days_worked: int
    hours_worked: float
    basic_pay: float
    overtime_hours: float
    overtime_pay: float
    gross_pay: float
    sss: float
    philhealth: float
    pagibig: float
    withholding_tax: float
    total_deductions: float
    net_pay: float
    status: str
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee_name,
            'employee_type': self.employee_type,
            'department': self.department,
            'position': self.position,
            'pay_period_start': self.pay_period_start,
            'pay_period_end': self.pay_period_end,
            'days_worked': self.days_worked,
            'hours_worked': self.hours_worked,
            'earnings': {
                'basic_pay': self.basic_pay,
                'overtime_hours': self.overtime_hours,
                'overtime_pay': self.overtime_pay,
                'gross_pay': self.gross_pay
            },
            'deductions': {
                'sss': self.sss,
                'philhealth': self.philhealth,
                'pagibig': self.pagibig,
                'withholding_tax': self.withholding_tax,
                'total': self.total_deductions
            },
            'net_pay': self.net_pay,
            'status': self.status,
            'generated_at': self.generated_at
        }


class PayrollProcessor:
    def __init__(self):
        self._deduction_calculator = DeductionCalculator()
        self._attendance_tracker = AttendanceTracker()

    @property
    def deduction_calculator(self) -> DeductionCalculator:
        return self._deduction_calculator

    @property
    def attendance_tracker(self) -> AttendanceTracker:
        return self._attendance_tracker

    def process_payroll(self, employee_data: Dict[str, Any],
                        attendance_records: List[Dict[str, Any]],
                        pay_period_start: str,
                        pay_period_end: str) -> Payslip:
        employee = create_employee(employee_data)
        attendance_summary = self._attendance_tracker.calculate_period_summary(attendance_records)

        days_worked = attendance_summary['present_days']
        hours_worked = attendance_summary['total_hours_worked']

        salary_breakdown = employee.get_salary_breakdown(hours_worked, days_worked)
        gross_pay = salary_breakdown['gross_salary']
        basic_pay = salary_breakdown['base_pay']
        overtime_pay = salary_breakdown.get('overtime_pay', 0)
        overtime_hours = salary_breakdown.get('overtime_hours', 0)

        deduction_result = self._deduction_calculator.calculate_all_deductions(gross_pay)
        deductions = deduction_result['deductions']

        return Payslip(
            id=str(uuid.uuid4()),
            employee_id=employee.id,
            employee_name=employee.full_name,
            employee_type=employee.employee_type,
            department=employee.department,
            position=employee.position,
            pay_period_start=pay_period_start,
            pay_period_end=pay_period_end,
            days_worked=days_worked,
            hours_worked=hours_worked,
            basic_pay=basic_pay,
            overtime_hours=overtime_hours,
            overtime_pay=overtime_pay,
            gross_pay=gross_pay,
            sss=deductions['sss'],
            philhealth=deductions['philhealth'],
            pagibig=deductions['pagibig'],
            withholding_tax=deductions['withholding_tax'],
            total_deductions=deductions['total'],
            net_pay=deduction_result['net_salary'],
            status='generated',
            generated_at=datetime.now(timezone.utc).isoformat()
        )

    def process_batch_payroll(self, employees_data: List[Dict[str, Any]],
                              all_attendance: Dict[str, List[Dict[str, Any]]],
                              pay_period_start: str,
                              pay_period_end: str) -> List[Payslip]:
        payslips = []
        for emp_data in employees_data:
            emp_id = emp_data.get('id')
            attendance = all_attendance.get(emp_id, [])
            try:
                payslip = self.process_payroll(emp_data, attendance, pay_period_start, pay_period_end)
                payslips.append(payslip)
            except Exception as e:
                print(f"Error processing payroll for {emp_id}: {e}")
                continue
        return payslips

    def calculate_quick_estimate(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        employee = create_employee(employee_data)
        salary_breakdown = employee.get_salary_breakdown()
        gross_pay = salary_breakdown['gross_salary']
        deduction_result = self._deduction_calculator.calculate_all_deductions(gross_pay)

        return {
            'employee_id': employee.id,
            'employee_name': employee.full_name,
            'employee_type': employee.employee_type,
            'salary_breakdown': salary_breakdown,
            'deductions': deduction_result['deductions'],
            'gross_pay': gross_pay,
            'net_pay': deduction_result['net_salary'],
            'note': 'This is an estimate based on standard working period'
        }

    def get_payroll_summary(self, payslips: List[Payslip]) -> Dict[str, Any]:
        if not payslips:
            return {
                'total_employees': 0,
                'total_gross': 0,
                'total_deductions': 0,
                'total_net': 0,
                'by_type': {}
            }

        total_gross = sum(p.gross_pay for p in payslips)
        total_deductions = sum(p.total_deductions for p in payslips)
        total_net = sum(p.net_pay for p in payslips)

        by_type = {}
        for payslip in payslips:
            emp_type = payslip.employee_type
            if emp_type not in by_type:
                by_type[emp_type] = {'count': 0, 'total_gross': 0, 'total_net': 0}
            by_type[emp_type]['count'] += 1
            by_type[emp_type]['total_gross'] += payslip.gross_pay
            by_type[emp_type]['total_net'] += payslip.net_pay

        return {
            'total_employees': len(payslips),
            'total_gross': round(total_gross, 2),
            'total_deductions': round(total_deductions, 2),
            'total_net': round(total_net, 2),
            'by_type': by_type
        }
