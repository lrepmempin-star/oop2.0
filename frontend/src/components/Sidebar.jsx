import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Wallet, 
  Code2, 
  LogOut,
  Shield,
  Lock,
  Eye
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/employees", icon: Users, label: "Employees" },
    { path: "/attendance", icon: Clock, label: "Attendance" },
    { path: "/payroll", icon: Wallet, label: "Payroll" },
    { path: "/oop-concepts", icon: Code2, label: "OOP Concepts" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <h1 className="text-xl font-bold text-primary">OOP Payroll</h1>
        <p className="text-xs text-muted-foreground mt-1">MotorPH System v2.0</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Access Levels Legend */}
      <div className="p-4 border-t border-border/50">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Access Levels</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-public text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" /> Public
            </span>
            <span className="text-xs text-muted-foreground">Accessible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-protected text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Shield className="w-3 h-3" /> Protected
            </span>
            <span className="text-xs text-muted-foreground">Subclass only</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-private text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" /> Private
            </span>
            <span className="text-xs text-muted-foreground">Hidden</span>
          </div>
        </div>
      </div>

      {/* User & Logout */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
