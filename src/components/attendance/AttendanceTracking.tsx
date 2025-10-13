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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Attendance Tracking</CardTitle>
            <CardDescription>Mark daily attendance for students</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={markAllPresent} variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Mark All Present
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || Object.keys(attendance).length === 0}
            className="bg-gradient-primary gap-2"
          >
            Save Attendance
          </Button>
        </div>

        <div className="space-y-2">
          {students.map(student => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-primary/20 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.index_number} • {student.grade}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={attendance[student.id]?.status === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttendanceChange(student.id, 1)}
                  className={cn(
                    attendance[student.id]?.status === 1 && "bg-secondary hover:bg-secondary"
                  )}
                >
                  <Check className="h-4 w-4" />
                  Present
                </Button>
                <Button
                  variant={attendance[student.id]?.status === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttendanceChange(student.id, 0)}
                  className={cn(
                    attendance[student.id]?.status === 0 && "bg-destructive hover:bg-destructive"
                  )}
                >
                  <X className="h-4 w-4" />
                  Absent
                </Button>
              </div>

              {attendance[student.id]?.status === 0 && (
                <Select
                  value={attendance[student.id]?.reason || "unknown"}
                  onValueChange={(value) => handleReasonChange(student.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
