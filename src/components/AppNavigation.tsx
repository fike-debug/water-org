import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  BarChart3, 
  Search,
  Receipt,
  LogOut 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "agents", label: "Agents", icon: Users },
  { id: "upload", label: "Upload Receipt", icon: Upload },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "search", label: "Search", icon: Search },
];

export function AppNavigation({ activeTab, onTabChange, onLogout }: AppNavigationProps) {
  return (
    <Card className="h-full bg-gradient-card border-border shadow-card">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
            <Receipt className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">Receipt Manager</h1>
            <p className="text-sm text-muted-foreground">Financial Agent System</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-smooth",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "hover:bg-secondary"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-border hover:bg-secondary"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
}