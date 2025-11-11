import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const AttendanceReminder = () => {
  const [hasUpdatedToday, setHasUpdatedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAttendanceUpdate();
    
    // Check every hour
    const interval = setInterval(checkAttendanceUpdate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAttendanceUpdate = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setHasUpdatedToday(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if teacher has students
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id);

      if (!students || students.length === 0) {
        setHasUpdatedToday(true);
        setLoading(false);
        return;
      }

      // Check if attendance was updated today
      const { data: attendance } = await supabase
        .from("attendance")
        .select("id")
        .eq("date", today)
        .in("student_id", students.map(s => s.id))
        .limit(1);

      const updated = attendance && attendance.length > 0;
      setHasUpdatedToday(updated);

      if (!updated) {
        toast({
          title: "📚 Attendance Reminder",
          description: "Please update today's student attendance",
          duration: 10000,
        });
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsAcknowledged = () => {
    setHasUpdatedToday(true);
    toast({
      title: "Reminder Dismissed",
      description: "Don't forget to update attendance today!",
    });
  };

  if (loading || hasUpdatedToday) return null;

  return (
    <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600 animate-pulse" />
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Attendance Update Needed
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={markAsAcknowledged}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Dismiss
          </Button>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          You haven't updated attendance for today yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => window.location.href = '/attendance'}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          Update Attendance Now
        </Button>
      </CardContent>
    </Card>
  );
};
