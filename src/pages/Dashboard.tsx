import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Users, TrendingUp, AlertTriangle, LogOut, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StudentsList } from "@/components/students/StudentsList";
import { AttendanceTracking } from "@/components/attendance/AttendanceTracking";
import { CameraAttendance } from "@/components/attendance/CameraAttendance";
import { AIInsights } from "@/components/ai/AIInsights";
import { AttendanceCharts } from "@/components/attendance/AttendanceCharts";
import { BulkUpload } from "@/components/students/BulkUpload";
import { EducationalInsights } from "@/components/dashboard/EducationalInsights";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                {t('app.title')}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSelector />
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
              <span className="hidden sm:inline text-xs sm:text-sm">{t('header.signOut')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Navigation */}
      <div className="sticky top-[60px] z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Button variant="outline" size="sm" onClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs shrink-0">
              📊 Insights
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById('camera')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs shrink-0">
              📸 Camera
            </Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById('students')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs shrink-0">
              👥 Students
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <StatsCard
            title={t('stats.totalStudents')}
            value={stats.totalStudents}
            icon={Users}
            gradient="from-primary to-secondary"
            loading={loading}
          />
          <StatsCard
            title={t('stats.avgAttendance')}
            value={`${stats.averageAttendance}%`}
            icon={TrendingUp}
            gradient="from-secondary to-accent"
            loading={loading}
          />
          <StatsCard
            title={t('stats.atRisk')}
            value={stats.atRiskCount}
            icon={AlertTriangle}
            gradient="from-accent to-destructive"
            loading={loading}
          />
        </div>

        {/* Educational Insights */}
        <div id="insights">
          <EducationalInsights />
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Attendance Charts */}
        <AttendanceCharts />

        {/* Camera Attendance */}
        <div id="camera">
          <CameraAttendance selectedDate={new Date()} onUpdate={loadStats} />
        </div>

        {/* Bulk Upload */}
        <BulkUpload onSuccess={loadStats} />

        {/* Attendance Tracking */}
        <AttendanceTracking onUpdate={loadStats} />

        {/* Students List */}
        <div id="students">
          <StudentsList onUpdate={loadStats} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
