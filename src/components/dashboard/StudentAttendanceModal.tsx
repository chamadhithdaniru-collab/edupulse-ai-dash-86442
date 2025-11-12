import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentAttendanceModalProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentAttendanceModal = ({
  student,
  open,
  onOpenChange,
}: StudentAttendanceModalProps) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && student) {
      loadAttendance();
    }
  }, [open, student]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", student.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: number) => {
    if (status === 1) {
      return <CheckCircle2 className="h-4 w-4 text-secondary" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="default" className="bg-secondary">Present</Badge>;
    }
    return <Badge variant="destructive">Absent</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History - {student?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Index Number</p>
              <p className="font-semibold">{student?.index_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className="font-semibold">
                {student?.grade}
                {student?.section && ` ${student.section}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specialty</p>
              <p className="font-semibold">{student?.specialty || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="font-semibold text-destructive">
                {Math.round(student?.attendance_percentage || 0)}%
              </p>
            </div>
          </div>

          {/* Attendance Records */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance Records ({attendance.length} total)
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading attendance records...
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(record.status)}
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(new Date(record.date), "EEEE, MMMM d, yyyy")}
                          </p>
                          {record.absence_reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-semibold">Reason:</span>{" "}
                              {record.absence_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg text-center">
            <div>
              <p className="text-2xl font-bold text-secondary">
                {attendance.filter((r) => r.status === 1).length}
              </p>
              <p className="text-xs text-muted-foreground">Present Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {attendance.filter((r) => r.status === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Absent Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {attendance.filter((r) => r.absence_reason).length}
              </p>
              <p className="text-xs text-muted-foreground">With Reasons</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
