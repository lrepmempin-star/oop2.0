import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wallet, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Briefcase,
  UserCheck,
  FileText
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getEmployeeTypeBadge = (type) => {
    const badges = {
      full_time: "badge-full-time",
      part_time: "badge-part-time",
      contract: "badge-contract"
    };
    return badges[type] || badges.full_time;
  };

  const formatEmployeeType = (type) => {
    const labels = {
      full_time: "Full-Time",
      part_time: "Part-Time",
      contract: "Contractor"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Payroll Dashboard</h1>
        <p className="text-muted-foreground mt-1">OOP Concepts in Action</p>
      </div>

      {/* Stats Grid - Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <Card className="glass-card stat-card p-6 animate-slide-up stagger-1" data-testid="stat-total-employees">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Employees
              </p>
              <p className="text-4xl font-bold mt-3">{stats?.total_employees || 0}</p>
            </div>
          </div>
        </Card>

        {/* Monthly Payroll */}
        <Card className="glass-card stat-card p-6 animate-slide-up stagger-2 lg:col-span-2" data-testid="stat-monthly-payroll">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Monthly Payroll
              </p>
              <p className="text-4xl font-bold mt-3 text-secondary">
                {formatCurrency(stats?.monthly_payroll || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-secondary/50" />
          </div>
        </Card>

        {/* Today's Attendance */}
        <Card className="glass-card stat-card p-6 animate-slide-up stagger-3" data-testid="stat-attendance">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Today's Attendance
              </p>
              <p className="text-4xl font-bold mt-3">{stats?.today_attendance || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee Types & Recent Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Types Card */}
        <Card className="glass-card p-6 animate-slide-up stagger-4" data-testid="employee-types-card">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4" />
            Employee Types
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="badge-full-time text-xs px-3 py-1 rounded-full">Full-Time</span>
              <span className="font-semibold">{stats?.employee_types?.full_time || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge-part-time text-xs px-3 py-1 rounded-full">Part-Time</span>
              <span className="font-semibold">{stats?.employee_types?.part_time || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge-contract text-xs px-3 py-1 rounded-full">Contractor</span>
              <span className="font-semibold">{stats?.employee_types?.contract || 0}</span>
            </div>
          </div>

          {/* OOP Note */}
          <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">Polymorphism:</span> Each employee type calculates salary differently using overridden methods.
            </p>
          </div>
        </Card>

        {/* Recent Employees */}
        <Card className="glass-card p-6 lg:col-span-2 animate-slide-up stagger-5" data-testid="recent-employees-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Recent Employees
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/employees")}
              className="text-xs"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {stats?.recent_employees?.length > 0 ? (
              stats.recent_employees.map((employee, index) => (
                <div 
                  key={employee.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/employees/${employee.id}/edit`)}
                  data-testid={`recent-employee-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: employee.employee_type === 'full_time' ? 'rgba(139, 92, 246, 0.2)' :
                                        employee.employee_type === 'part_time' ? 'rgba(45, 212, 191, 0.2)' :
                                        'rgba(219, 39, 119, 0.2)',
                        color: employee.employee_type === 'full_time' ? '#a78bfa' :
                               employee.employee_type === 'part_time' ? '#5eead4' :
                               '#f472b6'
                      }}
                    >
                      {employee.first_name?.[0]}{employee.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                      <p className="text-xs text-muted-foreground">{employee.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${getEmployeeTypeBadge(employee.employee_type)} text-xs px-2 py-1 rounded-full`}>
                      {formatEmployeeType(employee.employee_type)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No employees yet</p>
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => navigate("/employees/new")}
                >
                  Add your first employee
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in stagger-5">
        <Button 
          variant="outline" 
          className="h-auto p-4 flex items-center gap-3 justify-start glass-card border-border/50 hover:border-primary/50"
          onClick={() => navigate("/employees/new")}
          data-testid="quick-add-employee-btn"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Add Employee</p>
            <p className="text-xs text-muted-foreground">Create new employee record</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-4 flex items-center gap-3 justify-start glass-card border-border/50 hover:border-secondary/50"
          onClick={() => navigate("/payroll")}
          data-testid="quick-process-payroll-btn"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-left">
            <p className="font-semibold">Process Payroll</p>
            <p className="text-xs text-muted-foreground">Generate payslips</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-4 flex items-center gap-3 justify-start glass-card border-border/50 hover:border-accent/50"
          onClick={() => navigate("/oop-concepts")}
          data-testid="quick-view-oop-btn"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="font-semibold">OOP Concepts</p>
            <p className="text-xs text-muted-foreground">View class hierarchy</p>
          </div>
        </Button>
      </div>
    </div>
  );
}
