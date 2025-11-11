import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calendar, BarChart3, Bell, Bot, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export const Navigation = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard') || "Dashboard" },
    { path: "/students", icon: Users, label: t('nav.students') || "Students" },
    { path: "/attendance", icon: Calendar, label: t('nav.attendance') || "Attendance" },
    { path: "/insights", icon: BarChart3, label: t('nav.insights') || "Insights" },
    { path: "/notifications", icon: Bell, label: "Notifications" },
    { path: "/ai-assistant", icon: Bot, label: "AI Assistant" },
    { path: "/why-school", icon: GraduationCap, label: "Why School?" },
  ];

  return (
    <nav className="sticky top-[60px] z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-2 shrink-0",
                  location.pathname === item.path && "bg-gradient-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
