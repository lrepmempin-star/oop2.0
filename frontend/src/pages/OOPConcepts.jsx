import { useState, useEffect, useCallback } from "react";
import { api } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Code2, 
  GitBranch, 
  Layers, 
  Lock,
  Shield,
  Eye,
  Box,
  ArrowRight,
  Workflow
} from "lucide-react";

// Custom Node Component
const ClassNode = ({ data }) => {
  const typeColors = {
    abstract_class: { bg: "rgba(139, 92, 246, 0.15)", border: "#8b5cf6", text: "#a78bfa" },
    class: { bg: "rgba(45, 212, 191, 0.15)", border: "#2dd4bf", text: "#5eead4" },
    service_class: { bg: "rgba(219, 39, 119, 0.15)", border: "#db2777", text: "#f472b6" },
  };

  const colors = typeColors[data.type] || typeColors.class;

  const accessIcons = {
    public: <Eye className="w-3 h-3 text-emerald-400" />,
    protected: <Shield className="w-3 h-3 text-amber-400" />,
    private: <Lock className="w-3 h-3 text-red-400" />,
  };

  return (
    <div
      className="rounded-lg p-3 min-w-[200px]"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Class Name */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
        <Box className="w-4 h-4" style={{ color: colors.text }} />
        <span className="font-semibold text-sm" style={{ color: colors.text }}>
          {data.name}
        </span>
        {data.type === "abstract_class" && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
            abstract
          </span>
        )}
      </div>

      {/* Attributes */}
      {data.attributes && data.attributes.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">Attributes</p>
          <div className="space-y-0.5">
            {data.attributes.slice(0, 4).map((attr, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                {accessIcons[attr.access]}
                <span className="font-mono text-muted-foreground">{attr.name}</span>
              </div>
            ))}
            {data.attributes.length > 4 && (
              <span className="text-xs text-muted-foreground">+{data.attributes.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Methods */}
      {data.methods && data.methods.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Methods</p>
          <div className="space-y-0.5">
            {data.methods.slice(0, 4).map((method, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                {accessIcons[method.access]}
                <span className="font-mono text-muted-foreground">
                  {method.name}
                  {method.type === "abstract" && (
                    <span className="text-violet-300 ml-1">*</span>
                  )}
                  {method.type === "override" && (
                    <span className="text-cyan-300 ml-1">↑</span>
                  )}
                </span>
              </div>
            ))}
            {data.methods.length > 4 && (
              <span className="text-xs text-muted-foreground">+{data.methods.length - 4} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  classNode: ClassNode,
};

export default function OOPConcepts() {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  useEffect(() => {
    if (hierarchy) {
      createFlowNodes();
    }
  }, [hierarchy]);

  const fetchHierarchy = async () => {
    try {
      const response = await api.get("/oop/class-hierarchy");
      setHierarchy(response.data);
    } catch (error) {
      console.error("Failed to fetch hierarchy:", error);
    } finally {
      setLoading(false);
    }
  };

  const createFlowNodes = () => {
    if (!hierarchy) return;

    const nodePositions = {
      Employee: { x: 400, y: 50 },
      FullTimeEmployee: { x: 100, y: 250 },
      PartTimeEmployee: { x: 400, y: 250 },
      ContractEmployee: { x: 700, y: 250 },
      PayrollProcessor: { x: 400, y: 450 },
      DeductionCalculator: { x: 150, y: 600 },
      AttendanceTracker: { x: 650, y: 600 },
    };

    const newNodes = hierarchy.classes.map((cls) => ({
      id: cls.name,
      type: "classNode",
      position: nodePositions[cls.name] || { x: 0, y: 0 },
      data: cls,
    }));

    const edgeColors = {
      inheritance: "#8b5cf6",
      composition: "#db2777",
      dependency: "#3b82f6",
    };

    const newEdges = hierarchy.relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.from,
      target: rel.to,
      type: "smoothstep",
      animated: rel.type === "dependency",
      style: { stroke: edgeColors[rel.type], strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColors[rel.type],
      },
      label: rel.type,
      labelStyle: { fill: edgeColors[rel.type], fontSize: 10 },
      labelBgStyle: { fill: "#0a0a0a" },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="oop-concepts-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">OOP Concepts</h1>
        <p className="text-muted-foreground mt-1">Class hierarchy and design patterns visualization</p>
      </div>

      <Tabs defaultValue="diagram" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="diagram" className="data-[state=active]:bg-primary/20">
            <GitBranch className="w-4 h-4 mr-2" />
            Class Diagram
          </TabsTrigger>
          <TabsTrigger value="concepts" className="data-[state=active]:bg-primary/20">
            <Layers className="w-4 h-4 mr-2" />
            OOP Concepts
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-primary/20">
            <Code2 className="w-4 h-4 mr-2" />
            Code Examples
          </TabsTrigger>
        </TabsList>

        {/* Class Diagram Tab */}
        <TabsContent value="diagram">
          <Card className="glass-card p-0 overflow-hidden h-[600px]" data-testid="class-diagram">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#333" gap={20} />
              <Controls className="bg-card border border-border rounded-lg" />
              <MiniMap
                nodeColor={(node) => {
                  switch (node.data.type) {
                    case "abstract_class":
                      return "#8b5cf6";
                    case "service_class":
                      return "#db2777";
                    default:
                      return "#2dd4bf";
                  }
                }}
                className="bg-card border border-border rounded-lg"
              />
            </ReactFlow>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-violet-500/30 border border-violet-500" />
              <span className="text-sm text-muted-foreground">Abstract Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500" />
              <span className="text-sm text-muted-foreground">Concrete Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-500/30 border border-pink-500" />
              <span className="text-sm text-muted-foreground">Service Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-violet-500" />
              <span className="text-sm text-muted-foreground">Inheritance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-pink-500" />
              <span className="text-sm text-muted-foreground">Composition</span>
            </div>
          </div>
        </TabsContent>

        {/* OOP Concepts Tab */}
        <TabsContent value="concepts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hierarchy?.oop_concepts && Object.entries(hierarchy.oop_concepts).map(([key, concept]) => (
              <Card key={key} className="glass-card p-6">
                <h3 className="text-lg font-semibold capitalize mb-2 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-primary" />
                  {key.replace("_", " ")}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{concept.description}</p>
                <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs text-cyan-300">
                  {concept.example}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Code Examples Tab */}
        <TabsContent value="code">
          <div className="space-y-6">
            {/* Inheritance Example */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-violet-400" />
                Inheritance - Employee Subclasses
              </h3>
              <pre className="p-4 rounded-lg bg-muted/30 overflow-x-auto text-sm">
                <code className="text-cyan-300">{`class Employee(ABC):
    """Parent class - Abstract Base Class"""
    
    @abstractmethod
    def compute_salary(self, hours_worked, days_worked):
        pass


class FullTimeEmployee(Employee):
    """Subclass - inherits from Employee"""
    
    def compute_salary(self, hours_worked=0, days_worked=0):
        # Monthly salary calculation with overtime
        return self.basic_salary + overtime_pay


class PartTimeEmployee(Employee):
    """Subclass - inherits from Employee"""
    
    def compute_salary(self, hours_worked=0, days_worked=0):
        # Hourly rate calculation
        return self._hourly_rate * hours_worked


class ContractEmployee(Employee):
    """Subclass - inherits from Employee"""
    
    def compute_salary(self, hours_worked=0, days_worked=0):
        # Daily rate calculation
        return self._daily_rate * days_worked`}</code>
              </pre>
            </Card>

            {/* Encapsulation Example */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Encapsulation - Access Modifiers
              </h3>
              <pre className="p-4 rounded-lg bg-muted/30 overflow-x-auto text-sm">
                <code className="text-cyan-300">{`class Employee:
    def __init__(self, data):
        # Protected attributes (accessible by subclasses)
        self._employee_id = data['employee_id']
        self._first_name = data['first_name']
        
        # Private attribute (name mangling)
        self.__basic_salary = data.get('basic_salary', 0.0)
    
    # Getter using @property decorator
    @property
    def basic_salary(self) -> float:
        return self.__basic_salary
    
    # Setter with validation
    @basic_salary.setter
    def basic_salary(self, value: float):
        if value < 0:
            raise ValueError("Salary cannot be negative")
        self.__basic_salary = value`}</code>
              </pre>
            </Card>

            {/* Composition Example */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-400" />
                Composition - PayrollProcessor
              </h3>
              <pre className="p-4 rounded-lg bg-muted/30 overflow-x-auto text-sm">
                <code className="text-cyan-300">{`class PayrollProcessor:
    """Composes DeductionCalculator and AttendanceTracker"""
    
    def __init__(self):
        # Composition - HAS-A relationship
        self._deduction_calculator = DeductionCalculator()
        self._attendance_tracker = AttendanceTracker()
    
    def process_payroll(self, employee_data, attendance_records):
        # Create employee (Factory Pattern)
        employee = create_employee(employee_data)
        
        # Get attendance summary
        summary = self._attendance_tracker.calculate_period_summary(
            attendance_records
        )
        
        # Calculate salary (Polymorphism)
        gross_pay = employee.compute_salary(
            summary['total_hours_worked'],
            summary['present_days']
        )
        
        # Calculate deductions
        deductions = self._deduction_calculator.calculate_all_deductions(
            gross_pay
        )
        
        return payslip`}</code>
              </pre>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Access Level Legend */}
      <Card className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Access Modifiers Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">
              <span className="font-semibold">Public</span> - Accessible from anywhere
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm">
              <span className="font-semibold">Protected</span> - Accessible by subclasses (_attribute)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-sm">
              <span className="font-semibold">Private</span> - Hidden with name mangling (__attribute)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
