import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Users, TrendingUp, AlertTriangle, LogOut, Moon, Sun, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StudentsList } from "@/components/students/StudentsList";
import { AttendanceTracking } from "@/components/attendance/AttendanceTracking";
import { AIInsights } from "@/components/ai/AIInsights";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    atRiskCount: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: students, error } = await supabase
        .from("students")
        .select("*");

      if (error) throw error;

      if (students) {
        const totalStudents = students.length;
        const averageAttendance = students.length > 0
          ? students.reduce((sum, s) => sum + (parseFloat(s.attendance_percentage as any) || 0), 0) / students.length
          : 0;
        const atRiskCount = students.filter(s => s.status === 'at_risk').length;

        setStats({
          totalStudents,
          averageAttendance: Math.round(averageAttendance),
          atRiskCount,
        });
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                EduPulse
              </h1>
              <p className="text-xs text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            gradient="from-primary to-secondary"
            loading={loading}
          />
          <StatsCard
            title="Average Attendance"
            value={`${stats.averageAttendance}%`}
            icon={TrendingUp}
            gradient="from-secondary to-accent"
            loading={loading}
          />
          <StatsCard
            title="At-Risk Students"
            value={stats.atRiskCount}
            icon={AlertTriangle}
            gradient="from-accent to-destructive"
            loading={loading}
          />
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Attendance Tracking */}
        <AttendanceTracking onUpdate={loadStats} />

        {/* Students List */}
        <StudentsList onUpdate={loadStats} />
      </main>
    </div>
  );
};

export default Dashboard;
