import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    position: "",
    employee_type: "full_time",
    date_hired: new Date().toISOString().split('T')[0],
    basic_salary: "",
    hourly_rate: "",
    daily_rate: "",
    hours_per_week: "20",
    contract_end_date: "",
    status: "active"
  });

  useEffect(() => {
    if (isEdit) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/employees/${id}`);
      const emp = response.data;
      setFormData({
        employee_id: emp.employee_id || "",
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        email: emp.email || "",
        department: emp.department || "",
        position: emp.position || "",
        employee_type: emp.employee_type || "full_time",
        date_hired: emp.date_hired || "",
        basic_salary: emp.basic_salary?.toString() || "",
        hourly_rate: emp.hourly_rate?.toString() || "",
        daily_rate: emp.daily_rate?.toString() || "",
        hours_per_week: emp.hours_per_week?.toString() || "20",
        contract_end_date: emp.contract_end_date || "",
        status: emp.status || "active"
      });
    } catch (error) {
      toast.error("Failed to fetch employee");
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        basic_salary: parseFloat(formData.basic_salary) || 0,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        daily_rate: parseFloat(formData.daily_rate) || 0,
        hours_per_week: parseFloat(formData.hours_per_week) || 20,
      };

      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
        toast.success("Employee updated successfully");
      } else {
        await api.post("/employees", payload);
        toast.success("Employee created successfully");
      }
      navigate("/employees");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="employee-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/employees")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? "Edit Employee" : "Add Employee"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Update employee information" : "Create a new employee record"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="glass-card p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  placeholder="EMP001"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                  className="bg-muted/50 border-border/50 font-mono"
                  data-testid="employee-id-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="employee@motorph.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-muted/50 border-border/50"
                  data-testid="employee-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="bg-muted/50 border-border/50"
                  data-testid="employee-firstname-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Dela Cruz"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="bg-muted/50 border-border/50"
                  data-testid="employee-lastname-input"
                />
              </div>
            </div>
          </div>

          {/* Position Info */}
          <div className="border-t border-border/50 pt-6">
            <h3 className="text-lg font-semibold mb-4">Position Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(v) => handleSelectChange("department", v)}
                >
                  <SelectTrigger className="bg-muted/50 border-border/50" data-testid="department-select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Software Engineer"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="bg-muted/50 border-border/50"
                  data-testid="position-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_hired">Date Hired *</Label>
                <Input
                  id="date_hired"
                  name="date_hired"
                  type="date"
                  value={formData.date_hired}
                  onChange={handleChange}
                  required
                  className="bg-muted/50 border-border/50"
                  data-testid="date-hired-input"
                />
              </div>
              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => handleSelectChange("status", v)}
                  >
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Employee Type & Salary */}
          <div className="border-t border-border/50 pt-6">
            <h3 className="text-lg font-semibold mb-4">Employment Type & Compensation</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Employee Type *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "full_time", label: "Full-Time", desc: "Monthly salary" },
                    { value: "part_time", label: "Part-Time", desc: "Hourly rate" },
                    { value: "contract", label: "Contractor", desc: "Daily rate" }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleSelectChange("employee_type", type.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        formData.employee_type === type.value
                          ? type.value === "full_time" 
                            ? "border-violet-500 bg-violet-500/10"
                            : type.value === "part_time"
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-pink-500 bg-pink-500/10"
                          : "border-border/50 hover:border-border"
                      }`}
                      data-testid={`employee-type-${type.value}`}
                    >
                      <span className={`text-sm font-semibold ${
                        formData.employee_type === type.value
                          ? type.value === "full_time" ? "text-violet-300"
                            : type.value === "part_time" ? "text-cyan-300"
                            : "text-pink-300"
                          : ""
                      }`}>
                        {type.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Salary Fields */}
              {formData.employee_type === "full_time" && (
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Monthly Salary (PHP) *</Label>
                  <Input
                    id="basic_salary"
                    name="basic_salary"
                    type="number"
                    placeholder="25000"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="bg-muted/50 border-border/50 font-mono"
                    data-testid="basic-salary-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Full-time employees use <code className="bg-muted px-1 rounded">compute_salary()</code> with monthly calculation
                  </p>
                </div>
              )}

              {formData.employee_type === "part_time" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate (PHP) *</Label>
                    <Input
                      id="hourly_rate"
                      name="hourly_rate"
                      type="number"
                      placeholder="150"
                      value={formData.hourly_rate}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="bg-muted/50 border-border/50 font-mono"
                      data-testid="hourly-rate-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours_per_week">Hours per Week</Label>
                    <Input
                      id="hours_per_week"
                      name="hours_per_week"
                      type="number"
                      placeholder="20"
                      value={formData.hours_per_week}
                      onChange={handleChange}
                      min="1"
                      max="40"
                      className="bg-muted/50 border-border/50 font-mono"
                      data-testid="hours-per-week-input"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Part-time employees use <code className="bg-muted px-1 rounded">compute_salary()</code> with hourly calculation
                  </p>
                </div>
              )}

              {formData.employee_type === "contract" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Daily Rate (PHP) *</Label>
                    <Input
                      id="daily_rate"
                      name="daily_rate"
                      type="number"
                      placeholder="1500"
                      value={formData.daily_rate}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="bg-muted/50 border-border/50 font-mono"
                      data-testid="daily-rate-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contract_end_date">Contract End Date</Label>
                    <Input
                      id="contract_end_date"
                      name="contract_end_date"
                      type="date"
                      value={formData.contract_end_date}
                      onChange={handleChange}
                      className="bg-muted/50 border-border/50"
                      data-testid="contract-end-date-input"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Contract employees use <code className="bg-muted px-1 rounded">compute_salary()</code> with daily calculation
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* OOP Note */}
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-sm text-muted-foreground">
              <span className="text-accent font-semibold">OOP Factory Pattern:</span> When saved, the backend uses{" "}
              <code className="bg-muted px-1 rounded">create_employee()</code> factory function to instantiate the appropriate subclass.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/employees")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
              disabled={saving}
              data-testid="save-employee-btn"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? "Update Employee" : "Create Employee"}
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
