import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export const AttendanceCharts = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("week");
  const [insights, setInsights] = useState({
    mostAbsentDay: "",
    averageAttendance: 0,
    topPerformer: "",
    streakDays: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedGrade, selectedStudent, timeRange]);

  const loadData = async () => {
    try {
      // Load students
      let studentsQuery = supabase.from("students").select("*");
      if (selectedGrade !== "all") {
        studentsQuery = studentsQuery.eq("grade", selectedGrade);
      }
      const { data: studentsData } = await studentsQuery;

      // Calculate date range
      const endDate = new Date();
      let startDate = subDays(endDate, 7);
      if (timeRange === "month") startDate = subDays(endDate, 30);
      if (timeRange === "year") startDate = subDays(endDate, 365);

      // Load attendance
      let attendanceQuery = supabase
        .from("attendance")
        .select("*, students(name, grade, section)")
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (selectedStudent !== "all") {
        attendanceQuery = attendanceQuery.eq("student_id", selectedStudent);
      }

      const { data: attendanceData } = await attendanceQuery;

      setStudents(studentsData || []);
      setAttendanceData(attendanceData || []);
      calculateInsights(attendanceData || [], studentsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const calculateInsights = (attendance: any[], students: any[]) => {
    if (!attendance.length) {
      setInsights({
        mostAbsentDay: "N/A",
        averageAttendance: 0,
        topPerformer: "N/A",
        streakDays: 0
      });
      return;
    }

    // Most absent day
    const dayStats = attendance.reduce((acc, record) => {
      const day = format(new Date(record.date), "EEEE");
      if (!acc[day]) acc[day] = { present: 0, absent: 0 };
      if (record.status === 0) acc[day].absent++;
      else acc[day].present++;
      return acc;
    }, {} as Record<string, { present: number; absent: number }>);

    const mostAbsentDay = Object.entries(dayStats).sort(
      ([, a], [, b]) => {
        const aStats = a as { present: number; absent: number };
        const bStats = b as { present: number; absent: number };
        return bStats.absent - aStats.absent;
      }
    )[0]?.[0] || "N/A";

    // Average attendance
    const totalPresent = attendance.filter(a => a.status === 1).length;
    const averageAttendance = Math.round((totalPresent / attendance.length) * 100);

    // Top performer
    const studentStats = students.map(s => ({
      name: s.name,
      attendance: s.attendance_percentage || 0
    })).sort((a, b) => b.attendance - a.attendance);
    const topPerformer = studentStats[0]?.name || "N/A";

    // Attendance streak
    const sortedDates = [...new Set(attendance.map(a => a.date))].sort();
    let maxStreak = 0;
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    setInsights({
      mostAbsentDay,
      averageAttendance,
      topPerformer,
      streakDays: maxStreak
    });
  };

  // Group attendance by date for chart
  const chartData = attendanceData.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) acc[date] = { date, present: 0, absent: 0 };
    if (record.status === 1) acc[date].present++;
    else acc[date].absent++;
    return acc;
  }, {} as Record<string, { date: string; present: number; absent: number }>);

  const chartArray = (Object.values(chartData) as Array<{ date: string; present: number; absent: number }>).slice(-14);

  return (
    <Card className="border-primary/20 shadow-accent">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg sm:text-2xl">Attendance Trends & Insights</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Visualize patterns and track performance over time
        </CardDescription>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Grades</SelectItem>
              {Array.from({ length: 13 }, (_, i) => i + 1).map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-60">
              <SelectItem value="all">All Students</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 space-y-6">
        {/* Simple Bar Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Daily Attendance</h4>
          <div className="h-64 flex items-end gap-1 sm:gap-2 overflow-x-auto">
            {chartArray.map((day, i) => {
              const total = day.present + day.absent;
              const presentHeight = total > 0 ? (day.present / total) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[40px] sm:min-w-[60px]">
                  <div className="flex flex-col w-full h-48 bg-muted rounded-t justify-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-secondary to-primary rounded-t transition-all"
                      style={{ height: `${presentHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {format(new Date(day.date), "MMM d")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-t from-secondary to-primary rounded" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded" />
              <span>Absent</span>
            </div>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
            <div className="text-xs text-muted-foreground mb-1">Most Absent Day</div>
            <div className="text-base sm:text-lg font-bold text-secondary">{insights.mostAbsentDay}</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Avg Attendance</div>
            <div className="text-base sm:text-lg font-bold text-primary">{insights.averageAttendance}%</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="text-xs text-muted-foreground mb-1">Top Performer</div>
            <div className="text-base sm:text-sm font-bold text-accent truncate">{insights.topPerformer}</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Longest Streak</div>
            <div className="text-base sm:text-lg font-bold text-primary">{insights.streakDays} days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
