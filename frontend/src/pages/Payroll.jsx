import { useState, useEffect } from "react";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Wallet, 
  FileText, 
  Calculator,
  TrendingUp,
  Users,
  ArrowRight,
  RefreshCw,
  Eye
} from "lucide-react";

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  
  const [payPeriod, setPayPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const [deductionCalc, setDeductionCalc] = useState({
    salary: "",
    result: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, payRes] = await Promise.all([
        api.get("/employees", { params: { status: "active" } }),
        api.get("/payroll/payslips")
      ]);
      setEmployees(empRes.data);
      setPayslips(payRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    setProcessing(true);
    try {
      const response = await api.post("/payroll/process", {
        pay_period_start: payPeriod.start,
        pay_period_end: payPeriod.end
      });
      toast.success(`Processed payroll for ${response.data.length} employees`);
      setPayslips(prev => [...response.data, ...prev]);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to process payroll");
    } finally {
      setProcessing(false);
    }
  };

  const handleCalculateDeductions = async () => {
    if (!deductionCalc.salary) {
      toast.error("Please enter a salary amount");
      return;
    }

    try {
      const response = await api.post("/deductions/calculate", {
        gross_salary: parseFloat(deductionCalc.salary)
      });
      setDeductionCalc(prev => ({ ...prev, result: response.data }));
    } catch (error) {
      toast.error("Failed to calculate deductions");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
    <div className="space-y-6" data-testid="payroll-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payroll</h1>
        <p className="text-muted-foreground mt-1">Process payroll and manage payslips</p>
      </div>

      {/* Process Payroll Card */}
      <Card className="glass-card p-6" data-testid="process-payroll-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Process Payroll
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Pay Period Start</Label>
            <Input
              type="date"
              value={payPeriod.start}
              onChange={(e) => setPayPeriod(p => ({ ...p, start: e.target.value }))}
              className="bg-muted/50 border-border/50"
              data-testid="pay-period-start"
            />
          </div>
          <div className="space-y-2">
            <Label>Pay Period End</Label>
            <Input
              type="date"
              value={payPeriod.end}
              onChange={(e) => setPayPeriod(p => ({ ...p, end: e.target.value }))}
              className="bg-muted/50 border-border/50"
              data-testid="pay-period-end"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleProcessPayroll}
              disabled={processing || employees.length === 0}
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="process-payroll-btn"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Process Payroll
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{employees.length}</span> active employees will be processed
          </p>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deduction Calculator */}
        <Card className="glass-card p-6" data-testid="deduction-calculator">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-secondary" />
            Deduction Calculator
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter gross salary"
                value={deductionCalc.salary}
                onChange={(e) => setDeductionCalc(prev => ({ ...prev, salary: e.target.value, result: null }))}
                className="flex-1 bg-muted/50 border-border/50 font-mono"
                data-testid="deduction-calc-input"
              />
              <Button
                onClick={handleCalculateDeductions}
                variant="outline"
                className="border-secondary/50 text-secondary hover:bg-secondary/10"
                data-testid="calculate-deductions-btn"
              >
                Calculate
              </Button>
            </div>

            {deductionCalc.result && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 animate-fade-in">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gross Salary</span>
                  <span className="font-mono">{formatCurrency(deductionCalc.result.gross_salary)}</span>
                </div>
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SSS</span>
                    <span className="font-mono text-red-300">-{formatCurrency(deductionCalc.result.deductions.sss)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">PhilHealth</span>
                    <span className="font-mono text-red-300">-{formatCurrency(deductionCalc.result.deductions.philhealth)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pag-IBIG</span>
                    <span className="font-mono text-red-300">-{formatCurrency(deductionCalc.result.deductions.pagibig)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Withholding Tax</span>
                    <span className="font-mono text-red-300">-{formatCurrency(deductionCalc.result.deductions.withholding_tax)}</span>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between">
                  <span className="font-semibold">Net Salary</span>
                  <span className="font-mono text-lg text-secondary">{formatCurrency(deductionCalc.result.net_salary)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Uses <code className="bg-muted px-1 rounded">DeductionCalculator</code> class with SSS, PhilHealth, Pag-IBIG, and TRAIN Law tax tables.
            </p>
          </div>
        </Card>

        {/* Recent Payslips */}
        <Card className="glass-card p-6" data-testid="recent-payslips">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Recent Payslips
          </h3>

          {payslips.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {payslips.slice(0, 10).map((payslip, index) => (
                <div
                  key={payslip.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPayslip(payslip)}
                  data-testid={`payslip-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payslip.employee_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-secondary">{formatCurrency(payslip.net_pay)}</p>
                      <span className={`${getEmployeeTypeBadge(payslip.employee_type)} text-xs px-2 py-0.5 rounded-full`}>
                        {formatEmployeeType(payslip.employee_type)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-muted-foreground">No payslips generated yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* OOP Note */}
      <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-accent font-semibold">PayrollProcessor Class:</span> Orchestrates Employee, AttendanceTracker, and DeductionCalculator through composition. Demonstrates OOP's Single Responsibility Principle.
        </p>
      </div>

      {/* Payslip Detail Modal */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="glass-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Payslip Details
            </DialogTitle>
          </DialogHeader>

          {selectedPayslip && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{selectedPayslip.employee_name}</span>
                  <span className={`${getEmployeeTypeBadge(selectedPayslip.employee_type)} text-xs px-2 py-1 rounded-full`}>
                    {formatEmployeeType(selectedPayslip.employee_type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPayslip.department} • {selectedPayslip.position}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pay Period: {formatDate(selectedPayslip.pay_period_start)} - {formatDate(selectedPayslip.pay_period_end)}
                </p>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">EARNINGS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Basic Pay</span>
                    <span className="font-mono">{formatCurrency(selectedPayslip.earnings?.basic_pay)}</span>
                  </div>
                  {selectedPayslip.earnings?.overtime_pay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Overtime ({selectedPayslip.earnings?.overtime_hours}h)</span>
                      <span className="font-mono">{formatCurrency(selectedPayslip.earnings?.overtime_pay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border/50 pt-2">
                    <span>Gross Pay</span>
                    <span className="font-mono">{formatCurrency(selectedPayslip.earnings?.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">DEDUCTIONS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>SSS</span>
                    <span className="font-mono text-red-300">-{formatCurrency(selectedPayslip.deductions?.sss)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PhilHealth</span>
                    <span className="font-mono text-red-300">-{formatCurrency(selectedPayslip.deductions?.philhealth)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pag-IBIG</span>
                    <span className="font-mono text-red-300">-{formatCurrency(selectedPayslip.deductions?.pagibig)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Withholding Tax</span>
                    <span className="font-mono text-red-300">-{formatCurrency(selectedPayslip.deductions?.withholding_tax)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border/50 pt-2">
                    <span>Total Deductions</span>
                    <span className="font-mono text-red-300">-{formatCurrency(selectedPayslip.deductions?.total)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="p-4 rounded-lg bg-primary/10 flex justify-between items-center">
                <span className="font-semibold">NET PAY</span>
                <span className="text-2xl font-bold text-secondary font-mono">
                  {formatCurrency(selectedPayslip.net_pay)}
                </span>
              </div>

              {/* Work Info */}
              <div className="text-xs text-muted-foreground text-center">
                Days Worked: {selectedPayslip.days_worked} • Hours: {selectedPayslip.hours_worked}h
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
