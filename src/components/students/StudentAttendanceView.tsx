import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Download, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

interface StudentAttendanceViewProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const StudentAttendanceView = ({ studentId, studentName, onClose }: StudentAttendanceViewProps) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    percentage: 0
  });

  useEffect(() => {
    loadAttendance();
  }, [studentId, currentMonth]);

  const loadAttendance = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

      setAttendance(data || []);

      // Calculate stats
      const totalPresent = data?.filter(a => a.status === 1).length || 0;
      const totalAbsent = data?.filter(a => a.status === 0).length || 0;
      const total = totalPresent + totalAbsent;
      const percentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

      setStats({ totalPresent, totalAbsent, percentage });
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ["Date", "Status", "Reason"],
      ...attendance.map(a => [
        a.date,
        a.status === 1 ? "Present" : "Absent",
        a.absence_reason || "-"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName}_attendance_${format(currentMonth, "yyyy-MM")}.csv`;
    a.click();
  };

  // Generate calendar days
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const getAttendanceStatus = (day: Date) => {
    return attendance.find(a => isSameDay(new Date(a.date), day));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{studentName}</CardTitle>
            <CardDescription>Individual Attendance Report</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20 text-center">
            <div className="text-2xl font-bold text-secondary">{stats.totalPresent}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.totalAbsent}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="text-2xl font-bold text-primary">{stats.percentage}%</div>
            <div className="text-xs text-muted-foreground">Rate</div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            Previous
          </Button>
          <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            Next
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {/* Empty cells for days before month starts */}
          {Array.from({ length: start.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Calendar days */}
          {days.map((day) => {
            const record = getAttendanceStatus(day);
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 text-xs ${
                  record
                    ? record.status === 1
                      ? "bg-secondary/20 border-secondary"
                      : "bg-destructive/20 border-destructive"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="font-semibold">{format(day, "d")}</div>
                {record && (
                  record.status === 1 ? (
                    <CheckCircle2 className="h-3 w-3 text-secondary" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive" />
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Export Button */}
        <Button onClick={exportReport} className="w-full gap-2 bg-gradient-primary">
          <Download className="h-4 w-4" />
          Export CSV Report
        </Button>
      </CardContent>
    </Card>
  );
};
