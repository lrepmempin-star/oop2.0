import { useState, useEffect } from "react";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer
} from "lucide-react";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        api.get("/employees"),
        api.get("/attendance/today")
      ]);
      setEmployees(empRes.data);
      setAttendance(attRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    setClockingIn(true);
    try {
      const response = await api.post("/attendance/clock-in", {
        employee_id: selectedEmployee
      });
      toast.success("Clocked in successfully");
      setAttendance(prev => [...prev, response.data]);
      setSelectedEmployee("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to clock in");
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async (recordId) => {
    setClockingOut(recordId);
    try {
      const response = await api.post("/attendance/clock-out", {
        record_id: recordId
      });
      toast.success("Clocked out successfully");
      setAttendance(prev => 
        prev.map(r => r.id === recordId ? response.data : r)
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to clock out");
    } finally {
      setClockingOut(null);
    }
  };

  const getEmployeeById = (id) => {
    return employees.find(e => e.id === id);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "late":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "half_day":
        return <Timer className="w-4 h-4 text-cyan-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-PH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const availableEmployees = employees.filter(emp => 
    emp.status === 'active' && 
    !attendance.some(att => att.employee_id === emp.id && !att.clock_out)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground mt-1">Track employee time and attendance</p>
      </div>

      {/* Clock In Card */}
      <Card className="glass-card p-6" data-testid="clock-in-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LogIn className="w-5 h-5 text-secondary" />
          Clock In
        </h3>
        <div className="flex gap-4">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="flex-1 bg-muted/50 border-border/50" data-testid="clock-in-employee-select">
              <SelectValue placeholder="Select employee to clock in" />
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.length > 0 ? (
                availableEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  All employees already clocked in
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleClockIn}
            disabled={clockingIn || !selectedEmployee}
            className="bg-secondary hover:bg-secondary/90 text-black"
            data-testid="clock-in-btn"
          >
            {clockingIn ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Clock In
              </>
            )}
          </Button>
        </div>

        {/* Current Time */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString('en-PH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              Current time: {new Date().toLocaleTimeString('en-PH')}
            </p>
          </div>
        </div>
      </Card>

      {/* Today's Attendance */}
      <Card className="glass-card overflow-hidden" data-testid="attendance-list">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Today's Attendance
          </h3>
        </div>

        {attendance.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => {
                const employee = getEmployeeById(record.employee_id);
                return (
                  <tr key={record.id} data-testid={`attendance-row-${index}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                          {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {employee?.first_name} {employee?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee?.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-secondary">
                        {formatTime(record.clock_in)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">
                        {record.clock_out ? formatTime(record.clock_out) : "-"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">
                        {record.hours_worked > 0 ? `${record.hours_worked.toFixed(2)}h` : "-"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className="text-sm capitalize">{record.status}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      {!record.clock_out && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClockOut(record.id)}
                          disabled={clockingOut === record.id}
                          className="border-accent/50 text-accent hover:bg-accent/10"
                          data-testid={`clock-out-btn-${index}`}
                        >
                          {clockingOut === record.id ? (
                            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                          ) : (
                            <>
                              <LogOut className="w-4 h-4 mr-1" />
                              Clock Out
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-semibold mb-2">No attendance records today</h3>
            <p className="text-muted-foreground">
              Clock in employees to start tracking attendance
            </p>
          </div>
        )}
      </Card>

      {/* OOP Note */}
      <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-secondary font-semibold">AttendanceTracker Class:</span> A service class that manages clock-in/out operations and calculates working hours. Composed within PayrollProcessor for payroll calculations.
        </p>
      </div>
    </div>
  );
}
