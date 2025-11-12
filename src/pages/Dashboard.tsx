import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AttendanceReminder } from "@/components/notifications/AttendanceReminder";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { StudentAttendanceModal } from "@/components/dashboard/StudentAttendanceModal";

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
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

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

  const exportAtRiskStudents = () => {
    if (atRiskStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No at-risk students to export",
        variant: "destructive"
      });
      return;
    }

    const csvHeaders = ["Name", "Index Number", "Grade", "Section", "Specialty", "Attendance %", "Last Attendance Date"];
    const csvRows = atRiskStudents.map(student => [
      student.name,
      student.index_number,
      student.grade,
      student.section || "N/A",
      student.specialty || "N/A",
      `${Math.round(student.attendance_percentage)}%`,
      student.lastAttendanceDate ? format(new Date(student.lastAttendanceDate), "yyyy-MM-dd") : "No records"
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `at-risk-students-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${atRiskStudents.length} at-risk students to CSV`
    });
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setShowAttendanceModal(true);
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
        const atRisk = students.filter(s => s.status === 'at_risk');

        // Get last attendance date for at-risk students
        const atRiskWithDates = await Promise.all(
          atRisk.map(async (student) => {
            const { data: attendance } = await supabase
              .from("attendance")
              .select("date")
              .eq("student_id", student.id)
              .order("date", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            return {
              ...student,
              lastAttendanceDate: attendance?.date || null
            };
          })
        );

        setStats({
          totalStudents,
          averageAttendance: Math.round(averageAttendance),
          atRiskCount: atRisk.length,
        });
        setAtRiskStudents(atRiskWithDates);
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

        {/* At-Risk Students Section */}
        {atRiskStudents.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">At-Risk Students</CardTitle>
                </div>
                <Button
                  onClick={exportAtRiskStudents}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-destructive/10 hover:bg-muted hover:border-destructive/20 cursor-pointer transition-all"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {student.index_number} • Grade {student.grade}
                        {student.section && ` ${student.section}`}
                        {student.specialty && ` • ${student.specialty}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        {Math.round(student.attendance_percentage)}%
                      </Badge>
                      <p className="text-xs text-muted-foreground">Click for details</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Attendance Details Modal */}
      <StudentAttendanceModal
        student={selectedStudent}
        open={showAttendanceModal}
        onOpenChange={setShowAttendanceModal}
      />
    </div>
  );
};

export default Dashboard;
