from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from pydantic import BaseModel, Field
import uuid


class AttendanceRecordBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    hours_worked: float = 0.0
    status: str = "present"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class AttendanceRecord:
    id: str
    employee_id: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    hours_worked: float = 0.0
    status: str = "present"
    notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'date': self.date,
            'clock_in': self.clock_in,
            'clock_out': self.clock_out,
            'hours_worked': self.hours_worked,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }


class AttendanceTracker:
    STANDARD_WORK_START = "09:00"
    STANDARD_WORK_END = "18:00"
    STANDARD_HOURS_PER_DAY = 8
    LATE_THRESHOLD_MINUTES = 15

    def __init__(self):
        pass

    def clock_in(self, employee_id: str, timestamp: Optional[str] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        clock_in_time = timestamp or now.isoformat()

        if isinstance(clock_in_time, str):
            try:
                parsed_time = datetime.fromisoformat(clock_in_time.replace('Z', '+00:00'))
            except ValueError:
                parsed_time = now
        else:
            parsed_time = now

        work_start = parsed_time.replace(hour=9, minute=0, second=0, microsecond=0)
        late_threshold = work_start + timedelta(minutes=self.LATE_THRESHOLD_MINUTES)

        status = "present"
        if parsed_time > late_threshold:
            status = "late"

        record = AttendanceRecord(
            id=str(uuid.uuid4()),
            employee_id=employee_id,
            date=parsed_time.strftime('%Y-%m-%d'),
            clock_in=clock_in_time,
            status=status
        )

        return record.to_dict()

    def clock_out(self, record_data: Dict[str, Any], timestamp: Optional[str] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        clock_out_time = timestamp or now.isoformat()

        clock_in_str = record_data.get('clock_in')
        if not clock_in_str:
            raise ValueError("Cannot clock out without clock-in time")

        try:
            clock_in = datetime.fromisoformat(clock_in_str.replace('Z', '+00:00'))
            clock_out = datetime.fromisoformat(clock_out_time.replace('Z', '+00:00'))
        except ValueError as e:
            raise ValueError(f"Invalid datetime format: {e}")

        duration = clock_out - clock_in
        hours_worked = round(max(0, duration.total_seconds() / 3600), 2)

        status = record_data.get('status', 'present')
        if hours_worked < 4:
            status = "half_day"

        record_data.update({
            'clock_out': clock_out_time,
            'hours_worked': hours_worked,
            'status': status,
            'updated_at': now.isoformat()
        })

        return record_data

    def calculate_period_summary(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_days = len(records)
        present_days = sum(1 for r in records if r.get('status') in ['present', 'late'])
        late_days = sum(1 for r in records if r.get('status') == 'late')
        absent_days = sum(1 for r in records if r.get('status') == 'absent')
        half_days = sum(1 for r in records if r.get('status') == 'half_day')
        total_hours = sum(r.get('hours_worked', 0) for r in records)
        avg_hours = total_hours / max(present_days, 1)

        return {
            'total_days': total_days,
            'present_days': present_days,
            'late_days': late_days,
            'absent_days': absent_days,
            'half_days': half_days,
            'total_hours_worked': round(total_hours, 2),
            'average_hours_per_day': round(avg_hours, 2)
        }

    def get_monthly_attendance(self, employee_id: str, year: int, month: int,
                               records: List[Dict[str, Any]]) -> Dict[str, Any]:
        month_prefix = f"{year}-{month:02d}"
        filtered = [
            r for r in records
            if r.get('employee_id') == employee_id and
            r.get('date', '').startswith(month_prefix)
        ]
        summary = self.calculate_period_summary(filtered)
        summary['employee_id'] = employee_id
        summary['year'] = year
        summary['month'] = month
        return summary
