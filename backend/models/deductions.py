from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class DeductionBreakdown:
    sss: float
    philhealth: float
    pagibig: float
    withholding_tax: float
    total_deductions: float


class DeductionCalculator:
    SSS_TABLE = [
        (4250, 180.00),
        (4750, 202.50),
        (5250, 225.00),
        (5750, 247.50),
        (6250, 270.00),
        (6750, 292.50),
        (7250, 315.00),
        (7750, 337.50),
        (8250, 360.00),
        (8750, 382.50),
        (9250, 405.00),
        (9750, 427.50),
        (10250, 450.00),
        (10750, 472.50),
        (11250, 495.00),
        (11750, 517.50),
        (12250, 540.00),
        (12750, 562.50),
        (13250, 585.00),
        (13750, 607.50),
        (14250, 630.00),
        (14750, 652.50),
        (15250, 675.00),
        (15750, 697.50),
        (16250, 720.00),
        (16750, 742.50),
        (17250, 765.00),
        (17750, 787.50),
        (18250, 810.00),
        (18750, 832.50),
        (19250, 855.00),
        (19750, 877.50),
        (20250, 900.00),
        (20750, 922.50),
        (21250, 945.00),
        (21750, 967.50),
        (22250, 990.00),
        (22750, 1012.50),
        (23250, 1035.00),
        (23750, 1057.50),
        (24250, 1080.00),
        (24750, 1102.50),
        (25250, 1125.00),
        (25750, 1147.50),
        (26250, 1170.00),
        (26750, 1192.50),
        (27250, 1215.00),
        (27750, 1237.50),
        (28250, 1260.00),
        (28750, 1282.50),
        (29250, 1305.00),
        (float('inf'), 1350.00),
    ]

    PHILHEALTH_RATE = 0.05
    PHILHEALTH_MIN = 500.00
    PHILHEALTH_MAX = 5000.00

    PAGIBIG_RATE_LOW = 0.01
    PAGIBIG_RATE_HIGH = 0.02
    PAGIBIG_MAX = 100.00

    TAX_BRACKETS = [
        (20833, 0, 0, 0),
        (33333, 20833, 0, 0.15),
        (66667, 33333, 1875, 0.20),
        (166667, 66667, 8541.67, 0.25),
        (666667, 166667, 33541.67, 0.30),
        (float('inf'), 666667, 183541.67, 0.35),
    ]

    def __init__(self):
        pass

    def calculate_sss(self, gross_salary: float) -> float:
        if gross_salary <= 0:
            return 0.0
        for ceiling, contribution in self.SSS_TABLE:
            if gross_salary <= ceiling:
                return contribution
        return self.SSS_TABLE[-1][1]

    def calculate_philhealth(self, gross_salary: float) -> float:
        if gross_salary <= 0:
            return 0.0
        total_premium = gross_salary * self.PHILHEALTH_RATE
        total_premium = max(self.PHILHEALTH_MIN, min(total_premium, self.PHILHEALTH_MAX))
        return round(total_premium / 2, 2)

    def calculate_pagibig(self, gross_salary: float) -> float:
        if gross_salary <= 0:
            return 0.0
        if gross_salary <= 1500:
            contribution = gross_salary * self.PAGIBIG_RATE_LOW
        else:
            contribution = gross_salary * self.PAGIBIG_RATE_HIGH
        return min(round(contribution, 2), self.PAGIBIG_MAX)

    def calculate_withholding_tax(self, gross_salary: float, total_deductions: float) -> float:
        taxable_income = gross_salary - total_deductions
        if taxable_income <= 0:
            return 0.0
        for ceiling, floor, base_tax, rate in self.TAX_BRACKETS:
            if taxable_income <= ceiling:
                excess = taxable_income - floor
                tax = base_tax + (excess * rate)
                return round(max(0, tax), 2)
        return 0.0

    def calculate_all_deductions(self, gross_salary: float) -> Dict[str, Any]:
        sss = self.calculate_sss(gross_salary)
        philhealth = self.calculate_philhealth(gross_salary)
        pagibig = self.calculate_pagibig(gross_salary)
        mandatory_deductions = sss + philhealth + pagibig
        withholding_tax = self.calculate_withholding_tax(gross_salary, mandatory_deductions)
        total_deductions = mandatory_deductions + withholding_tax
        net_salary = gross_salary - total_deductions
        return {
            'gross_salary': round(gross_salary, 2),
            'deductions': {
                'sss': round(sss, 2),
                'philhealth': round(philhealth, 2),
                'pagibig': round(pagibig, 2),
                'withholding_tax': round(withholding_tax, 2),
                'total': round(total_deductions, 2)
            },
            'net_salary': round(net_salary, 2)
        }

    def get_deduction_breakdown(self, gross_salary: float) -> DeductionBreakdown:
        result = self.calculate_all_deductions(gross_salary)
        deductions = result['deductions']
        return DeductionBreakdown(
            sss=deductions['sss'],
            philhealth=deductions['philhealth'],
            pagibig=deductions['pagibig'],
            withholding_tax=deductions['withholding_tax'],
            total_deductions=deductions['total']
        )
