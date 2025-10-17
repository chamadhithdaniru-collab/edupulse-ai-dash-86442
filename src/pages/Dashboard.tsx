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
import { CameraAttendance } from "@/components/attendance/CameraAttendance";
import { AIInsights } from "@/components/ai/AIInsights";
import { AttendanceCharts } from "@/components/attendance/AttendanceCharts";
import { BulkUpload } from "@/components/students/BulkUpload";

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
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                EduPulse
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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

        {/* Attendance Charts */}
        <AttendanceCharts />

        {/* Camera Attendance */}
        <CameraAttendance selectedDate={new Date()} onUpdate={loadStats} />

        {/* Bulk Upload */}
        <BulkUpload onSuccess={loadStats} />

        {/* Attendance Tracking */}
        <AttendanceTracking onUpdate={loadStats} />

        {/* Students List */}
        <StudentsList onUpdate={loadStats} />
      </main>
    </div>
  );
};

export default Dashboard;
