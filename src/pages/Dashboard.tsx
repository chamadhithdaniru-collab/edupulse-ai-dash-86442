import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AttendanceReminder } from "@/components/notifications/AttendanceReminder";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl pb-8">
        <AttendanceReminder />
        
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
      </main>
    </div>
  );
};

export default Dashboard;
