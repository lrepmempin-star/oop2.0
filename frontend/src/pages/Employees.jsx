import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [typeFilter]);

  const fetchEmployees = async () => {
    try {
      const params = {};
      if (typeFilter && typeFilter !== "all") {
        params.employee_type = typeFilter;
      }
      const response = await api.get("/employees", { params });
      setEmployees(response.data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/employees/${deleteId}`);
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to delete employee");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || 
           emp.employee_id?.toLowerCase().includes(searchLower) ||
           emp.department?.toLowerCase().includes(searchLower);
  });

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employees-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage employee records</p>
        </div>
        <Button 
          onClick={() => navigate("/employees/new")}
          className="bg-primary hover:bg-primary/90"
          data-testid="add-employee-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
              data-testid="employee-search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-border/50" data-testid="employee-type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full-Time</SelectItem>
                <SelectItem value="part_time">Part-Time</SelectItem>
                <SelectItem value="contract">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Employee List */}
      <Card className="glass-card overflow-hidden">
        {filteredEmployees.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Type</th>
                <th>Salary/Rate</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.id} data-testid={`employee-row-${index}`}>
                  <td>
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
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                      {employee.employee_id}
                    </code>
                  </td>
                  <td>
                    <span className="text-sm">{employee.department}</span>
                    <p className="text-xs text-muted-foreground">{employee.position}</p>
                  </td>
                  <td>
                    <span className={`${getEmployeeTypeBadge(employee.employee_type)} text-xs px-2 py-1 rounded-full`}>
                      {formatEmployeeType(employee.employee_type)}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-sm">
                      {employee.employee_type === 'full_time' 
                        ? formatCurrency(employee.basic_salary) + '/mo'
                        : employee.employee_type === 'part_time'
                        ? formatCurrency(employee.hourly_rate) + '/hr'
                        : formatCurrency(employee.daily_rate) + '/day'
                      }
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/employees/${employee.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(employee.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
            <h3 className="text-lg font-semibold mb-2">No employees found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Get started by adding your first employee"}
            </p>
            <Button onClick={() => navigate("/employees/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        )}
      </Card>

      {/* OOP Note */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-semibold">OOP Inheritance:</span> Each employee is an instance of a subclass (FullTimeEmployee, PartTimeEmployee, ContractEmployee) inheriting from the Employee parent class.
        </p>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
