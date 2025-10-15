import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AttendanceTrackingProps {
  onUpdate: () => void;
}

export const AttendanceTracking = ({ onUpdate }: AttendanceTrackingProps) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, { status: number; reason?: string }>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, [selectedDate]);

  const loadStudents = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("name");

      if (studentsError) throw studentsError;

      // Load existing attendance for selected date
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", format(selectedDate, "yyyy-MM-dd"));

      const attendanceMap: Record<string, { status: number; reason?: string }> = {};
      attendanceData?.forEach(a => {
        attendanceMap[a.student_id] = {
          status: a.status,
          reason: a.absence_reason
        };
      });

      setStudents(studentsData || []);
      setAttendance(attendanceMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceChange = (studentId: string, status: number) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { status, reason: prev[studentId]?.reason }
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], reason }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      for (const studentId of Object.keys(attendance)) {
        const { status, reason } = attendance[studentId];
        
        const { error } = await supabase
          .from("attendance")
          .upsert({
            student_id: studentId,
            date: dateStr,
            status,
            absence_reason: status === 0 ? reason || 'unknown' : null,
          }, {
            onConflict: 'student_id,date'
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, { status: number }> = {};
    students.forEach(s => {
      newAttendance[s.id] = { status: 1 };
    });
    setAttendance(newAttendance);
  };

  // Group students by grade and section
  const groupedStudents = students.reduce((acc, student) => {
    const gradeNum = parseInt(student.grade);
    const section = (student as any).section || '';
    const key = `Grade ${gradeNum}${section ? ` - Section ${section}` : ''}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {} as Record<string, typeof students>);

  // Sort grade keys
  const sortedGradeKeys = Object.keys(groupedStudents).sort((a, b) => {
    const gradeA = parseInt(a.match(/\d+/)?.[0] || '0');
    const gradeB = parseInt(b.match(/\d+/)?.[0] || '0');
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.localeCompare(b);
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-2xl">Attendance Tracking</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Mark daily attendance for students</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={markAllPresent} variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            Mark All Present
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || Object.keys(attendance).length === 0}
            className="bg-gradient-primary gap-2 w-full sm:w-auto text-xs sm:text-sm"
          >
            Save Attendance
          </Button>
        </div>

        {sortedGradeKeys.map((gradeKey) => (
          <div key={gradeKey} className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold text-primary border-b pb-2">{gradeKey}</h3>
            <div className="space-y-2">
              {groupedStudents[gradeKey].map(student => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border border-primary/20 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{student.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Index: {student.index_number}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant={attendance[student.id]?.status === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceChange(student.id, 1)}
                        className={cn(
                          "flex-1 sm:flex-none text-xs",
                          attendance[student.id]?.status === 1 && "bg-secondary hover:bg-secondary"
                        )}
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        variant={attendance[student.id]?.status === 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceChange(student.id, 0)}
                        className={cn(
                          "flex-1 sm:flex-none text-xs",
                          attendance[student.id]?.status === 0 && "bg-destructive hover:bg-destructive"
                        )}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Absent
                      </Button>
                    </div>

                    {attendance[student.id]?.status === 0 && (
                      <Select
                        value={attendance[student.id]?.reason || "unknown"}
                        onValueChange={(value) => handleReasonChange(student.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-32 text-xs">
                          <SelectValue placeholder="Reason" />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          <SelectItem value="sick">Sick</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
